import { randomUUID } from 'crypto';
import { BASE_API_BINANCE } from '@configs/base.config';
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

async function storeLogEntry(
  symbol: string,
  log: FuturesAutoBotLogEntry,
  persistToRedis = true
) {
  if (persistToRedis && HAS_REDIS_REST_CONNECTION) {
    try {
      await redisPushTrimList(getLogStorageKey(symbol), JSON.stringify(log), 50);
      const currentLogs = inMemoryLogs.get(symbol) ?? [];
      inMemoryLogs.set(symbol, [...currentLogs, log].slice(-50));
      return;
    } catch {
      // Fall back to memory in local/dev mode or if Redis is temporarily unavailable.
    }
  }

  const currentLogs = inMemoryLogs.get(symbol) ?? [];
  inMemoryLogs.set(symbol, [...currentLogs, log].slice(-50));
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

function isProtectionOrderType(type?: string | null) {
  return Boolean(type && (type.includes('STOP') || type.includes('TAKE_PROFIT')));
}

function matchesPositionSide(
  orderPositionSide: string | undefined,
  positionSide?: 'BOTH' | 'LONG' | 'SHORT'
) {
  if (!positionSide || positionSide === 'BOTH') {
    return true;
  }

  return orderPositionSide === positionSide || orderPositionSide === 'BOTH';
}

function getPositionSideFromAmount(positionAmt: number, fallback?: 'BOTH' | 'LONG' | 'SHORT') {
  if (fallback === 'LONG' || fallback === 'SHORT') {
    return fallback;
  }

  if (positionAmt > 0) {
    return 'LONG';
  }

  if (positionAmt < 0) {
    return 'SHORT';
  }

  return 'BOTH';
}

function hasOpenProtectionOrder(
  regularOrders: Array<{ positionSide?: string; type?: string }>,
  algoOrders: Array<{ closePosition?: boolean; positionSide?: string; reduceOnly?: boolean; type?: string }>,
  positionSide: 'BOTH' | 'LONG' | 'SHORT'
) {
  const regularHasProtection = regularOrders.some(
    (order) => isProtectionOrderType(order.type) && matchesPositionSide(order.positionSide, positionSide)
  );
  const algoHasProtection = algoOrders.some(
    (order) =>
      (order.reduceOnly === true || isProtectionOrderType(order.type) || order.closePosition === true) &&
      matchesPositionSide(order.positionSide, positionSide)
  );

  return regularHasProtection || algoHasProtection;
}

function inferFilledTakeProfitCount(params: {
  executionQuantity: number;
  currentQuantity: number;
}) {
  const { currentQuantity, executionQuantity } = params;

  if (!Number.isFinite(executionQuantity) || executionQuantity <= 0 || !Number.isFinite(currentQuantity) || currentQuantity <= 0) {
    return 0;
  }

  const remainingRatio = currentQuantity / executionQuantity;

  if (remainingRatio <= 0.18) {
    return 3;
  }

  if (remainingRatio <= 0.48) {
    return 2;
  }

  if (remainingRatio <= 0.82) {
    return 1;
  }

  return 0;
}

export class FuturesAutoBotService {
  get(symbol: string) {
    return inMemoryBots.get(symbol) ?? null;
  }

  async getLogs(symbol: string, options?: { preferMemoryOnly?: boolean }) {
    if (!options?.preferMemoryOnly && HAS_REDIS_REST_CONNECTION) {
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
      const openPositions = await futuresAutoTradeService.getOpenPositions(symbol);
      const activePosition = openPositions.find((position) => {
        if (position.symbol !== symbol) {
          return false;
        }

        const positionAmt = parseNumber(position.positionAmt) ?? 0;

        return positionAmt !== 0;
      });
      const activePositionAmt = parseNumber(activePosition?.positionAmt) ?? 0;
      const activePositionSide = activePosition ? getPositionSideFromAmount(activePositionAmt, activePosition.positionSide) : null;
      const isPositionOpen = current.status === 'entry_placed' || Boolean(activePosition);

      const shouldPersistLogs = !isPositionOpen && current.status !== 'entry_placed';

      if (!isPositionOpen && consensus.consensusSetup) {
        const consensusSetupChanged =
          current.plan.setupLabel !== consensus.consensusSetup.label || current.plan.setupGradeRank !== consensus.consensusSetup.gradeRank;

        nextState = {
          ...nextState,
          plan: {
            ...nextState.plan,
            ...consensus.consensusSetup,
            setupGradeRank: consensus.consensusSetup.gradeRank,
          },
          updatedAt: new Date().toISOString(),
        };

        if (consensusSetupChanged) {
          await storeLogEntry(
            symbol,
            createLog(
              'info',
              `Consensus updated for ${symbol}. Using ${consensus.executionConsensusLabel} from ${consensus.executionBasisLabel}.`
            )
          );
        }
      } else if (!isPositionOpen && !consensus.consensusSetup) {
        await storeLogEntry(
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
      const hasActivePosition = Boolean(activePosition);
      const scanMessage = hasActivePosition
        ? `Position open for ${symbol}: price ${formatLogPrice(currentPrice)}, tracking market bias ${consensus.consensusSetup ? formatDirectionLabel(consensus.consensusSetup.direction) : 'n/a'} from ${consensus.executionConsensusLabel}. Keeping focus on this position and making sure TP/SL stay attached.`
        : `Progress check for ${symbol}: price ${formatLogPrice(currentPrice)}, entry zone ${formatLogPriceRange(entryMin, entryMax)}, TP1 ${formatLogPrice(current.plan.takeProfits[0]?.price)}, SL ${formatLogPrice(current.plan.stopLoss)}.`;

      await storeLogEntry(symbol, createLog('info', scanMessage), shouldPersistLogs);

      const scannedState: FuturesAutoBotState = {
        ...nextState,
        lastScanPrice: currentPrice,
        updatedAt: new Date().toISOString(),
      };

      if (hasActivePosition && activePositionSide) {
        const [regularOrders, algoOrders] = await futuresAutoTradeService.getOpenOrders(symbol);
        const hasProtectionOrders = hasOpenProtectionOrder(regularOrders, algoOrders, activePositionSide);
        const protectionQuantity = Math.abs(activePositionAmt);
        const takeProfitStartIndex = Math.min(
          inferFilledTakeProfitCount({
            currentQuantity: protectionQuantity,
            executionQuantity: current.execution?.quantity ?? protectionQuantity,
          }),
          nextState.plan.takeProfits.length
        );
        const focusedState: FuturesAutoBotState = {
          ...scannedState,
          execution: nextState.execution ?? current.execution ?? undefined,
          status: 'entry_placed',
        };

        inMemoryBots.set(symbol, focusedState);

        if (!hasProtectionOrders) {
          const protectionOrders = await futuresAutoTradeService.placeProtectionOrders(nextState.plan, protectionQuantity, {
            takeProfitStartIndex,
          });
          const protectionState: FuturesAutoBotState = {
            ...focusedState,
            execution: focusedState.execution
              ? {
                  ...focusedState.execution,
                  algoOrderClientIds: protectionOrders.algoOrderClientIds,
                  positionSide: activePositionSide === 'BOTH' ? null : activePositionSide,
                  stopLossAlgoOrderId: protectionOrders.stopLossAlgoOrder?.algoId ?? null,
                  takeProfitAlgoOrderIds: protectionOrders.takeProfitAlgoOrders.map((order) => order.algoId),
                  quantity: protectionQuantity,
                }
              : null,
          };

          inMemoryBots.set(symbol, protectionState);
          await storeLogEntry(
            symbol,
            createLog(
              'success',
              `Existing position detected for ${symbol}. TP/SL were missing, so protection orders were attached from TP${takeProfitStartIndex + 1} onward and the bot will keep tracking this trade only.`
            ),
          false
        );

          return protectionState;
        }

        await storeLogEntry(
          symbol,
          createLog('info', `Existing position detected for ${symbol}. TP/SL already attached, so the bot will keep tracking this trade only.`),
          false
        );

        return focusedState;
      }

      if (nextState.execution && nextState.status === 'entry_pending') {
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
          await storeLogEntry(
            symbol,
            createLog(
              'success',
              `Entry filled for ${symbol} at ${formatLogPrice(filledState.execution?.entryPrice ?? currentPrice)}. TP/SL protection orders placed.`
            )
          );

          return filledState;
        }

        inMemoryBots.set(symbol, scannedState);
        await storeLogEntry(
          symbol,
          createLog(
            'info',
            `Limit entry for ${symbol} remains pending at ${formatLogPrice(nextState.execution.entryPrice)}. Waiting for fill before placing TP/SL.`
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

      await storeLogEntry(
        symbol,
        createLog(
          'success',
          `Entry trigger hit for ${symbol} at ${formatLogPrice(currentPrice)}. Placing limit entry at the zone edge and waiting for fill.`
        )
      );

      const execution = (await futuresAutoTradeService.executeTrade(nextState.plan, currentPrice)) as {
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

      await storeLogEntry(
        symbol,
        createLog(
          'success',
          execution.entryFilled
            ? `Entry filled for ${symbol}. Entry order #${executionRecord.entryOrderId}, TP algo orders ${executionRecord.takeProfitAlgoOrderIds.join(', ') || 'n/a'}, SL algo order ${executionRecord.stopLossAlgoOrderId ?? 'n/a'}.`
            : `Limit entry placed for ${symbol} at ${formatLogPrice(executionRecord.entryPrice)}. Waiting for fill before placing TP/SL.`
        ),
        shouldPersistLogs
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
      await storeLogEntry(
        symbol,
        createLog('error', `Auto bot execution failed for ${symbol}: ${errorMessage}`),
        current?.status !== 'entry_placed'
      );

      return erroredState;
    } finally {
      inFlightProgressChecks.delete(symbol);
    }
  }

  async start(input: StartFuturesAutoBotInput) {
    const now = new Date().toISOString();
    const status: FuturesAutoBotState['status'] = 'watching';
    const allocationLabel = input.allocationUnit === 'percent' ? `${input.allocationValue}% of wallet` : `${input.allocationValue} USDT margin`;
    const executionEndpointLabel = BASE_API_BINANCE?.includes('demo')
      ? 'Binance demo API'
      : BASE_API_BINANCE
        ? 'Binance live API'
        : 'Binance demo API';
    const logMessage = `Start requested for ${input.symbol} on ${executionEndpointLabel}. The bot will keep refreshing the best consensus until entry fills, then stay focused on the open position. Armed for actual entry on ${input.direction} setup with entry ${formatLogPrice(input.entryMid)}, allocation ${allocationLabel}, leverage ${input.leverage}x.`;

    const state: FuturesAutoBotState = {
      botId: createBotId(input.symbol),
      createdAt: now,
      updatedAt: now,
      plan: input,
      status,
    };

    inMemoryBots.set(input.symbol, state);
    await storeLogEntry(input.symbol, createLog('success', logMessage), true);

    return state;
  }

  async stop(symbol: string) {
    const current = inMemoryBots.get(symbol);

    if (!current) {
      await storeLogEntry(symbol, createLog('warn', `Stop requested for ${symbol}, but no active bot was found.`), true);
      return null;
    }

    if (current.execution || current.status === 'entry_placed') {
      try {
        await futuresAutoTradeService.cancelOpenOrders(symbol);
        await storeLogEntry(symbol, createLog('success', `Cancelled open orders for ${symbol}.`), current.status !== 'entry_placed');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown cancellation error.';
        await storeLogEntry(
          symbol,
          createLog('error', `Failed to cancel open orders for ${symbol}: ${errorMessage}`),
          current.status !== 'entry_placed'
        );
      }
    }

    const nextState: FuturesAutoBotState = {
      ...current,
      status: 'stopped',
      updatedAt: new Date().toISOString(),
    };

    inMemoryBots.set(symbol, nextState);
    await storeLogEntry(
      symbol,
      createLog('info', `Auto bot stopped for ${symbol}. Active watch loop ended.`),
      current.status !== 'entry_placed'
    );

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
