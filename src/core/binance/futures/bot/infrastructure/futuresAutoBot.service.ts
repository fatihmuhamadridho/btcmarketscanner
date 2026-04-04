import { randomUUID } from 'crypto';
import type {
  FuturesAutoBotExecutionRecord,
  FuturesAutoBotLogEntry,
  FuturesAutoBotState,
  StartFuturesAutoBotInput,
} from '../domain/futuresAutoBot.model';
import { futuresAutoConsensusService } from './futuresAutoConsensus.service';
import { futuresAutoTradeService } from './futuresAutoTrade.service';

const inMemoryBots = new Map<string, FuturesAutoBotState>();
const inMemoryLogs = new Map<string, FuturesAutoBotLogEntry[]>();
const inFlightProgressChecks = new Set<string>();

function createBotId(symbol: string) {
  return `${symbol}-${randomUUID()}`;
}

function createLog(level: FuturesAutoBotLogEntry['level'], message: string): FuturesAutoBotLogEntry {
  return {
    id: randomUUID(),
    level,
    message,
    timestamp: new Date().toISOString(),
  };
}

function appendLog(symbol: string, log: FuturesAutoBotLogEntry) {
  const currentLogs = inMemoryLogs.get(symbol) ?? [];
  inMemoryLogs.set(symbol, [...currentLogs, log].slice(-50));
}

function hasBetterConsensus(currentGradeRank: number, nextGradeRank: number) {
  return nextGradeRank > currentGradeRank;
}

function formatDirectionLabel(direction: 'long' | 'short') {
  return direction === 'long' ? 'LONG' : 'SHORT';
}

export class FuturesAutoBotService {
  get(symbol: string) {
    return inMemoryBots.get(symbol) ?? null;
  }

  getLogs(symbol: string) {
    return inMemoryLogs.get(symbol) ?? [];
  }

  async recordProgress(symbol: string) {
    const current = inMemoryBots.get(symbol);

    if (!current || current.status === 'stopped') {
      return current;
    }

    if (inFlightProgressChecks.has(symbol)) {
      return current;
    }

    inFlightProgressChecks.add(symbol);

    try {
      const consensus = await futuresAutoConsensusService.buildConsensus(symbol);
      let nextState: FuturesAutoBotState = current;
      const isPositionOpen = current.status === 'entry_placed';

      if (!isPositionOpen && current.plan.executionBehavior === 're_evaluate' && consensus.consensusSetup) {
        nextState = {
          ...nextState,
          plan: {
            ...nextState.plan,
            ...consensus.consensusSetup,
            executionMode: nextState.plan.executionMode,
            executionBehavior: nextState.plan.executionBehavior,
            setupGradeRank: consensus.consensusSetup.gradeRank,
          },
          updatedAt: new Date().toISOString(),
        };
        appendLog(
          symbol,
          createLog(
            'info',
            `Consensus re-evaluated for ${symbol}. Using ${consensus.executionConsensusLabel} from ${consensus.executionBasisLabel}.`
          )
        );
      } else if (
        !isPositionOpen &&
        current.plan.executionBehavior === 'switch_if_better' &&
        consensus.consensusSetup &&
        hasBetterConsensus(current.plan.setupGradeRank, consensus.consensusSetup.gradeRank)
      ) {
        nextState = {
          ...nextState,
          plan: {
            ...nextState.plan,
            ...consensus.consensusSetup,
            executionMode: nextState.plan.executionMode,
            executionBehavior: nextState.plan.executionBehavior,
            setupGradeRank: consensus.consensusSetup.gradeRank,
          },
          updatedAt: new Date().toISOString(),
        };
        appendLog(
          symbol,
          createLog(
            'success',
            `Consensus switched for ${symbol} to ${consensus.executionConsensusLabel} from ${consensus.executionBasisLabel}.`
          )
        );
      } else if (!isPositionOpen && current.plan.executionBehavior === 'locked') {
        appendLog(
          symbol,
          createLog(
            'info',
            `Consensus locked for ${symbol}. Keeping ${current.plan.setupLabel} even if multi-timeframe score changes.`
          )
        );
      } else if (!isPositionOpen && !consensus.consensusSetup) {
        appendLog(
          symbol,
          createLog('warn', `Consensus unavailable for ${symbol}. Keeping current plan until enough market data loads.`)
        );
      }

      const ticker = await futuresAutoTradeService.getCurrentPrice(symbol);
      const currentPrice = Number(ticker.price);

      if (!Number.isFinite(currentPrice)) {
        throw new Error('Unable to parse current market price.');
      }

      const entryLow = current.plan.entryZone.low ?? current.plan.entryMid ?? null;
      const entryHigh = current.plan.entryZone.high ?? current.plan.entryMid ?? null;
      const entryMin = entryLow !== null && entryHigh !== null ? Math.min(entryLow, entryHigh) : null;
      const entryMax = entryLow !== null && entryHigh !== null ? Math.max(entryLow, entryHigh) : null;
      const inEntryZone = entryMin !== null && entryMax !== null ? currentPrice >= entryMin && currentPrice <= entryMax : false;
      const scanMessage = isPositionOpen
        ? `Position open for ${symbol}: price ${currentPrice.toFixed(2)}, tracking market bias ${consensus.consensusSetup ? formatDirectionLabel(consensus.consensusSetup.direction) : 'n/a'} from ${consensus.executionConsensusLabel}. Letting SL handle the exit.`
        : `Progress check for ${symbol}: price ${currentPrice.toFixed(2)}, entry zone ${entryMin ?? 'n/a'} - ${entryMax ?? 'n/a'}, TP1 ${current.plan.takeProfits[0]?.price ?? 'n/a'}, SL ${current.plan.stopLoss ?? 'n/a'}.`;

      appendLog(symbol, createLog('info', scanMessage));

      const scannedState: FuturesAutoBotState = {
        ...nextState,
        lastScanPrice: currentPrice,
        updatedAt: new Date().toISOString(),
      };

      if (nextState.plan.executionMode === 'paper') {
        inMemoryBots.set(symbol, scannedState);
        appendLog(
          symbol,
          createLog(
            'info',
            `Paper mode for ${symbol}: consensus is ${consensus.executionConsensusLabel} and no orders will be placed.`
          )
        );
        return scannedState;
      }

      if (nextState.status === 'entry_placed') {
        inMemoryBots.set(symbol, scannedState);
        return scannedState;
      }

      if (!inEntryZone) {
        inMemoryBots.set(symbol, scannedState);
        return scannedState;
      }

      appendLog(symbol, createLog('success', `Entry trigger hit for ${symbol} at ${currentPrice.toFixed(2)}. Placing demo orders.`));

      const execution = (await futuresAutoTradeService.executeDemoTrade(nextState.plan, currentPrice)) as {
        entryOrder: { orderId: number; status?: string | null; avgPrice?: string | null };
        entryPrice: number | null;
        algoOrderClientIds: string[];
        positionSide: 'LONG' | 'SHORT' | null;
        quantity: number;
        stopLossAlgoOrder: { algoId: number } | null;
        takeProfitAlgoOrders: Array<{ algoId: number }>;
      };

      const executionRecord: FuturesAutoBotExecutionRecord = {
        algoOrderClientIds: execution.algoOrderClientIds,
        entryOrderId: execution.entryOrder.orderId,
        entryOrderStatus: execution.entryOrder.status ?? null,
        entryPrice: execution.entryPrice ?? currentPrice,
        executedAt: new Date().toISOString(),
        positionSide: execution.positionSide,
        stopLossAlgoOrderId: execution.stopLossAlgoOrder?.algoId ?? null,
        takeProfitAlgoOrderIds: execution.takeProfitAlgoOrders.map((order) => order.algoId),
        quantity: execution.quantity,
      };

      const executedState: FuturesAutoBotState = {
        ...scannedState,
        execution: executionRecord,
        status: 'entry_placed',
      };

      inMemoryBots.set(symbol, executedState);

      appendLog(
        symbol,
        createLog(
          'success',
          `Demo entry placed for ${symbol}. Entry order #${executionRecord.entryOrderId}, TP algo orders ${executionRecord.takeProfitAlgoOrderIds.join(', ') || 'n/a'}, SL algo order ${executionRecord.stopLossAlgoOrderId ?? 'n/a'}.`
        )
      );

      return executedState;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown auto bot execution error.';
      const erroredState: FuturesAutoBotState = {
        ...current,
        status: 'error',
        updatedAt: new Date().toISOString(),
      };

      inMemoryBots.set(symbol, erroredState);
      appendLog(symbol, createLog('error', `Auto bot execution failed for ${symbol}: ${errorMessage}`));

      return erroredState;
    } finally {
      inFlightProgressChecks.delete(symbol);
    }
  }

  start(input: StartFuturesAutoBotInput) {
    const now = new Date().toISOString();
    const status: FuturesAutoBotState['status'] = input.executionMode === 'demo' ? 'entry_pending' : 'watching';
    const existingLogs = inMemoryLogs.get(input.symbol) ?? [];
    const allocationLabel = input.allocationUnit === 'percent' ? `${input.allocationValue}% of wallet` : `${input.allocationValue} USDT margin`;
    const logMessage =
      input.executionMode === 'demo'
        ? `Start requested for ${input.symbol} in demo mode with ${input.executionBehavior} behavior. Armed for actual entry on ${input.direction} setup with entry ${input.entryMid ?? 'n/a'}, allocation ${allocationLabel}, leverage ${input.leverage}x.`
        : `Start requested for ${input.symbol} in paper mode with ${input.executionBehavior} behavior. Simulating ${input.direction} setup with entry ${input.entryMid ?? 'n/a'}, allocation ${allocationLabel}, leverage ${input.leverage}x.`;

    const state: FuturesAutoBotState = {
      botId: createBotId(input.symbol),
      createdAt: now,
      updatedAt: now,
      plan: input,
      status,
    };

    inMemoryBots.set(input.symbol, state);
    inMemoryLogs.set(input.symbol, [...existingLogs, createLog('success', logMessage)].slice(-50));

    return state;
  }

  async stop(symbol: string) {
    const current = inMemoryBots.get(symbol);

    if (!current) {
      appendLog(symbol, createLog('warn', `Stop requested for ${symbol}, but no active bot was found.`));
      return null;
    }

    if (current.execution || current.status === 'entry_placed') {
      try {
        await futuresAutoTradeService.cancelOpenOrders(symbol);
        appendLog(symbol, createLog('success', `Cancelled open demo orders for ${symbol}.`));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown cancellation error.';
        appendLog(symbol, createLog('error', `Failed to cancel open demo orders for ${symbol}: ${errorMessage}`));
      }
    }

    const nextState: FuturesAutoBotState = {
      ...current,
      status: 'stopped',
      updatedAt: new Date().toISOString(),
    };

    inMemoryBots.set(symbol, nextState);
    appendLog(symbol, createLog('info', `Auto bot stopped for ${symbol}. Active watch loop ended.`));

    return nextState;
  }

  clear(symbol: string) {
    inMemoryBots.delete(symbol);
    inMemoryLogs.delete(symbol);
    inFlightProgressChecks.delete(symbol);
  }
}

export const futuresAutoBotService = new FuturesAutoBotService();
