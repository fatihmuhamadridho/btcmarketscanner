import { randomUUID } from 'crypto';
import { formatDecimalString } from '@utils/format-number.util';
import { HAS_REDIS_REST_CONNECTION, redisPushTrimList, redisRestCommand } from '@utils/redis.util';
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

function getLogStorageKey(symbol: string) {
  return `btcmarketscanner:auto-bot:logs:${symbol}`;
}

async function appendLog(symbol: string, log: FuturesAutoBotLogEntry) {
  if (HAS_REDIS_REST_CONNECTION) {
    try {
      await redisPushTrimList(getLogStorageKey(symbol), JSON.stringify(log), 50);
      return;
    } catch {
      // Fall back to memory in local/dev mode or if Redis is temporarily unavailable.
    }
  }

  const currentLogs = inMemoryLogs.get(symbol) ?? [];
  inMemoryLogs.set(symbol, [...currentLogs, log].slice(-50));
}

function hasBetterConsensus(currentGradeRank: number, nextGradeRank: number) {
  return nextGradeRank > currentGradeRank;
}

function formatDirectionLabel(direction: 'long' | 'short') {
  return direction === 'long' ? 'LONG' : 'SHORT';
}

function parseNumber(value?: string | null) {
  if (value === undefined || value === null || value.trim().length === 0) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatLogPrice(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'n/a';
  }

  return formatDecimalString(value.toFixed(2));
}

function formatLogPriceRange(min: number | null, max: number | null) {
  return `${formatLogPrice(min)} - ${formatLogPrice(max)}`;
}

export class FuturesAutoBotService {
  get(symbol: string) {
    return inMemoryBots.get(symbol) ?? null;
  }

  async getLogs(symbol: string) {
    if (HAS_REDIS_REST_CONNECTION) {
      try {
        const entries = await redisRestCommand<string[]>('lrange', getLogStorageKey(symbol), 0, 49);
        const parsedEntries = entries
          .map((entry) => {
            try {
              return JSON.parse(entry) as FuturesAutoBotLogEntry;
            } catch {
              return null;
            }
          })
          .filter((entry): entry is FuturesAutoBotLogEntry => entry !== null);

        if (parsedEntries.length > 0) {
          return parsedEntries.reverse();
        }
      } catch {
        // Fallback to memory below.
      }
    }

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
        await appendLog(
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
        await appendLog(
          symbol,
          createLog(
            'success',
            `Consensus switched for ${symbol} to ${consensus.executionConsensusLabel} from ${consensus.executionBasisLabel}.`
          )
        );
      } else if (!isPositionOpen && current.plan.executionBehavior === 'locked') {
        await appendLog(
          symbol,
          createLog(
            'info',
            `Consensus locked for ${symbol}. Keeping ${current.plan.setupLabel} even if multi-timeframe score changes.`
          )
        );
      } else if (!isPositionOpen && !consensus.consensusSetup) {
        await appendLog(
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
        ? `Position open for ${symbol}: price ${formatLogPrice(currentPrice)}, tracking market bias ${consensus.consensusSetup ? formatDirectionLabel(consensus.consensusSetup.direction) : 'n/a'} from ${consensus.executionConsensusLabel}. Letting SL handle the exit.`
        : `Progress check for ${symbol}: price ${formatLogPrice(currentPrice)}, entry zone ${formatLogPriceRange(entryMin, entryMax)}, TP1 ${formatLogPrice(current.plan.takeProfits[0]?.price)}, SL ${formatLogPrice(current.plan.stopLoss)}.`;

      await appendLog(symbol, createLog('info', scanMessage));

      const scannedState: FuturesAutoBotState = {
        ...nextState,
        lastScanPrice: currentPrice,
        updatedAt: new Date().toISOString(),
      };

      if (nextState.execution && nextState.status === 'entry_pending') {
        const openPositions = await futuresAutoTradeService.getOpenPositions(symbol);
        const filledPosition = openPositions.find((position) => {
          if (position.symbol !== symbol) {
            return false;
          }

          const positionAmt = parseNumber(position.positionAmt) ?? 0;

          return nextState.plan.direction === 'long' ? positionAmt > 0 : positionAmt < 0;
        });

        if (filledPosition) {
          const protectionOrders = await futuresAutoTradeService.placeProtectionOrders(nextState.plan, nextState.execution.quantity);
          const filledState: FuturesAutoBotState = {
            ...scannedState,
            execution: {
              ...nextState.execution,
              stopLossAlgoOrderId: protectionOrders.stopLossAlgoOrder?.algoId ?? null,
              takeProfitAlgoOrderIds: protectionOrders.takeProfitAlgoOrders.map((order) => order.algoId),
              algoOrderClientIds: protectionOrders.algoOrderClientIds,
            },
            status: 'entry_placed',
          };

          inMemoryBots.set(symbol, filledState);
          await appendLog(
            symbol,
            createLog(
              'success',
              `Entry filled for ${symbol} at ${formatLogPrice(filledState.execution?.entryPrice ?? currentPrice)}. TP/SL protection orders placed.`
            )
          );

          return filledState;
        }

        inMemoryBots.set(symbol, scannedState);
        await appendLog(
          symbol,
          createLog(
            'info',
            `Limit entry for ${symbol} remains pending at ${formatLogPrice(nextState.execution.entryPrice)}. Waiting for fill before placing TP/SL.`
          )
        );

        return scannedState;
      }

      if (nextState.plan.executionMode === 'paper') {
        inMemoryBots.set(symbol, scannedState);
        await appendLog(
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

      await appendLog(
        symbol,
        createLog(
          'success',
          `Entry trigger hit for ${symbol} at ${formatLogPrice(currentPrice)}. Placing limit entry at the zone edge and waiting for fill.`
        )
      );

      const execution = (await futuresAutoTradeService.executeDemoTrade(nextState.plan, currentPrice)) as {
        entryOrder: { orderId: number; status?: string | null; avgPrice?: string | null };
        entryPrice: number | null;
        entryFilled: boolean;
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
        status: execution.entryFilled ? 'entry_placed' : 'entry_pending',
      };

      inMemoryBots.set(symbol, executedState);

      await appendLog(
        symbol,
        createLog(
          'success',
          execution.entryFilled
            ? `Demo entry filled for ${symbol}. Entry order #${executionRecord.entryOrderId}, TP algo orders ${executionRecord.takeProfitAlgoOrderIds.join(', ') || 'n/a'}, SL algo order ${executionRecord.stopLossAlgoOrderId ?? 'n/a'}.`
            : `Demo limit entry placed for ${symbol} at ${formatLogPrice(executionRecord.entryPrice)}. Waiting for fill before placing TP/SL.`
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
      await appendLog(symbol, createLog('error', `Auto bot execution failed for ${symbol}: ${errorMessage}`));

      return erroredState;
    } finally {
      inFlightProgressChecks.delete(symbol);
    }
  }

  async start(input: StartFuturesAutoBotInput) {
    const now = new Date().toISOString();
    const status: FuturesAutoBotState['status'] = input.executionMode === 'demo' ? 'entry_pending' : 'watching';
    const allocationLabel = input.allocationUnit === 'percent' ? `${input.allocationValue}% of wallet` : `${input.allocationValue} USDT margin`;
    const logMessage =
      input.executionMode === 'demo'
        ? `Start requested for ${input.symbol} in demo mode with ${input.executionBehavior} behavior. Armed for actual entry on ${input.direction} setup with entry ${formatLogPrice(input.entryMid)}, allocation ${allocationLabel}, leverage ${input.leverage}x.`
        : `Start requested for ${input.symbol} in paper mode with ${input.executionBehavior} behavior. Simulating ${input.direction} setup with entry ${formatLogPrice(input.entryMid)}, allocation ${allocationLabel}, leverage ${input.leverage}x.`;

    const state: FuturesAutoBotState = {
      botId: createBotId(input.symbol),
      createdAt: now,
      updatedAt: now,
      plan: input,
      status,
    };

    inMemoryBots.set(input.symbol, state);
    await appendLog(input.symbol, createLog('success', logMessage));

    return state;
  }

  async stop(symbol: string) {
    const current = inMemoryBots.get(symbol);

    if (!current) {
      await appendLog(symbol, createLog('warn', `Stop requested for ${symbol}, but no active bot was found.`));
      return null;
    }

    if (current.execution || current.status === 'entry_placed') {
      try {
        await futuresAutoTradeService.cancelOpenOrders(symbol);
        await appendLog(symbol, createLog('success', `Cancelled open demo orders for ${symbol}.`));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown cancellation error.';
        await appendLog(symbol, createLog('error', `Failed to cancel open demo orders for ${symbol}: ${errorMessage}`));
      }
    }

    const nextState: FuturesAutoBotState = {
      ...current,
      status: 'stopped',
      updatedAt: new Date().toISOString(),
    };

    inMemoryBots.set(symbol, nextState);
    await appendLog(symbol, createLog('info', `Auto bot stopped for ${symbol}. Active watch loop ended.`));

    return nextState;
  }

  async clear(symbol: string) {
    inMemoryBots.delete(symbol);
    inMemoryLogs.delete(symbol);
    inFlightProgressChecks.delete(symbol);
    if (HAS_REDIS_REST_CONNECTION) {
      try {
        await redisRestCommand<number>('del', getLogStorageKey(symbol));
      } catch {
        // ignore cleanup failures
      }
    }
  }
}

export const futuresAutoBotService = new FuturesAutoBotService();
