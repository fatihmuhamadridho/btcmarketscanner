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
import type { FuturesAutoBotOpenClawValidationResult } from './futuresAutoValidation.service';
import { futuresAutoValidationService } from './futuresAutoValidation.service';
import { futuresAutoTradeService } from './futuresAutoTrade.service';

const inMemoryBots = new Map<string, FuturesAutoBotState>();
const inMemoryLogs = new Map<string, FuturesAutoBotLogEntry[]>();
const inFlightProgressChecks = new Set<string>();
const OPENCLAW_PLAN_LOCK_TTL_MS = 45 * 60 * 1000;
const OPENCLAW_REVALIDATION_COOLDOWN_MS = 15 * 60 * 1000;

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

function getStateStorageKey(symbol: string) {
  return `btcmarketscanner:auto-bot:state:${symbol}`;
}

async function persistBotState(symbol: string, state: FuturesAutoBotState | null) {
  if (!HAS_REDIS_REST_CONNECTION) {
    return;
  }

  try {
    if (state === null) {
      await redisRestCommand<number>('del', getStateStorageKey(symbol));
      return;
    }

    await redisRestCommand<string>('set', getStateStorageKey(symbol), JSON.stringify(state));
  } catch {
    // Ignore persistence failures and keep the in-memory state as source of truth for this session.
  }
}

async function readPersistedBotState(symbol: string) {
  if (!HAS_REDIS_REST_CONNECTION) {
    return null;
  }

  try {
    const raw = await redisRestCommand<string | null>('get', getStateStorageKey(symbol));

    if (typeof raw !== 'string' || raw.trim().length === 0) {
      return null;
    }

    const parsed = JSON.parse(raw) as FuturesAutoBotState;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
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

function buildPlanFromOpenClawSetup(
  plan: FuturesAutoBotState['plan'],
  setup: FuturesAutoBotOpenClawValidationResult['validated_setup']
) {
  const takeProfits: FuturesAutoBotState['plan']['takeProfits'] = [
    { label: 'TP1', price: setup.take_profit.tp1 },
    { label: 'TP2', price: setup.take_profit.tp2 },
    { label: 'TP3', price: null },
  ];

  return {
    ...plan,
    direction: setup.direction,
    entryMid: setup.planned_entry,
    entryZone: {
      high: Math.max(setup.entry_zone[0], setup.entry_zone[1]),
      low: Math.min(setup.entry_zone[0], setup.entry_zone[1]),
    },
    riskReward: setup.risk_reward.tp2 ?? setup.risk_reward.tp1 ?? plan.riskReward,
    setupLabel: `OpenClaw Suggested ${setup.direction === 'long' ? 'Long' : 'Short'} Setup`,
    stopLoss: setup.stop_loss,
    takeProfits,
  };
}

function getLockedOpenClawPlan(
  current: FuturesAutoBotState,
  suggestedPlan: FuturesAutoBotState['plan'] | null
) {
  return suggestedPlan ?? current.openClawLockedPlan ?? null;
}

function buildConsensusPlan(plan: FuturesAutoBotState['plan'], consensusSetup: NonNullable<Awaited<ReturnType<typeof futuresAutoConsensusService.buildConsensus>>['consensusSetup']>) {
  return {
    ...plan,
    ...consensusSetup,
    setupGradeRank: consensusSetup.gradeRank,
  };
}

function getOpenClawUnlockReason(params: {
  current: FuturesAutoBotState;
  consensusSetup: NonNullable<Awaited<ReturnType<typeof futuresAutoConsensusService.buildConsensus>>['consensusSetup']>;
  now: number;
}) {
  const { consensusSetup, current, now } = params;

  if (current.planSource !== 'openclaw') {
    return null;
  }

  const lockedAt = current.planLockedAt ? Date.parse(current.planLockedAt) : null;
  const expiresAt = current.planLockExpiresAt ? Date.parse(current.planLockExpiresAt) : null;
  const lockAgeMs = lockedAt !== null && Number.isFinite(lockedAt) ? now - lockedAt : null;

  if ((expiresAt !== null && Number.isFinite(expiresAt) && now >= expiresAt) || (lockAgeMs !== null && lockAgeMs >= OPENCLAW_PLAN_LOCK_TTL_MS)) {
    return 'OpenClaw lock expired and needs a fresh validation.';
  }

  const lockedPlan = current.openClawLockedPlan ?? current.plan;

  if (
    consensusSetup &&
    lockedPlan &&
    consensusSetup.direction !== lockedPlan.direction &&
    consensusSetup.gradeRank >= lockedPlan.setupGradeRank + 1
  ) {
    return `Consensus shifted to a stronger ${consensusSetup.direction} setup (${consensusSetup.label}) while the locked OpenClaw plan was ${lockedPlan.direction}.`;
  }

  return null;
}

function buildOpenClawValidationFingerprint(params: {
  consensus: Awaited<ReturnType<typeof futuresAutoConsensusService.buildConsensus>>;
  plan: FuturesAutoBotState['plan'];
  currentPrice: number;
}) {
  const { consensus, currentPrice, plan } = params;
  const fingerprintPayload = {
    currentPriceBucket: Math.round(currentPrice / 25) * 25,
    direction: plan.direction,
    entryZone: [plan.entryZone.low, plan.entryZone.high],
    setupGradeRank: plan.setupGradeRank,
    setupLabel: plan.setupLabel,
    timeframes: consensus.snapshots
      .filter((snapshot) => snapshot.interval === '15m' || snapshot.interval === '1h' || snapshot.interval === '4h')
      .map((snapshot) => ({
        atr14: snapshot.trend.atr14,
        direction: snapshot.trend.direction,
        gradeRank: snapshot.setup.gradeRank,
        interval: snapshot.interval,
        label: snapshot.setup.label,
        rsi14: snapshot.trend.rsi14,
        structurePattern: snapshot.trend.structurePattern,
        support: snapshot.supportResistance?.support ?? null,
        resistance: snapshot.supportResistance?.resistance ?? null,
      })),
  };

  return JSON.stringify(fingerprintPayload);
}

function shouldSkipOpenClawValidation(current: FuturesAutoBotState, now: number, fingerprint: string) {
  if (current.planSource !== 'openclaw') {
    return false;
  }

  const lastValidationAt = current.lastOpenClawValidationAt ? Date.parse(current.lastOpenClawValidationAt) : null;

  if (lastValidationAt === null || !Number.isFinite(lastValidationAt)) {
    return false;
  }

  if (current.lastOpenClawValidationFingerprint === fingerprint) {
    return true;
  }

  return now - lastValidationAt < OPENCLAW_REVALIDATION_COOLDOWN_MS;
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

  async getResolved(symbol: string) {
    const localState = inMemoryBots.get(symbol) ?? null;

    if (localState) {
      return localState;
    }

    const persistedState = await readPersistedBotState(symbol);

    if (persistedState) {
      inMemoryBots.set(symbol, persistedState);
    }

    return persistedState;
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
    const current = inMemoryBots.get(symbol) ?? (await readPersistedBotState(symbol));

    if (current && !inMemoryBots.has(symbol)) {
      inMemoryBots.set(symbol, current);
    }

    if (!current || current.status === 'stopped') {
      return current;
    }

    if (inFlightProgressChecks.has(symbol)) {
      return current;
    }

    inFlightProgressChecks.add(symbol);

    try {
      const consensus = await futuresAutoConsensusService.buildConsensus(symbol);
      const now = Date.now();
      let nextState: FuturesAutoBotState = current;
      const isOpenClawLockedPlan = current.planSource === 'openclaw';
      const openClawUnlockReason = getOpenClawUnlockReason({
        consensusSetup: consensus.consensusSetup,
        current,
        now,
      });
      const lockedOpenClawPlan = current.openClawLockedPlan ?? null;
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

      if (isOpenClawLockedPlan && lockedOpenClawPlan) {
        nextState = {
          ...nextState,
          plan: lockedOpenClawPlan,
        };
      }

      if (!isPositionOpen && consensus.consensusSetup && (!isOpenClawLockedPlan || openClawUnlockReason !== null)) {
        const consensusSetupChanged =
          current.plan.setupLabel !== consensus.consensusSetup.label || current.plan.setupGradeRank !== consensus.consensusSetup.gradeRank;

        if (isOpenClawLockedPlan && openClawUnlockReason) {
          await storeLogEntry(
            symbol,
            createLog('info', `OpenClaw plan unlocked for ${symbol}. ${openClawUnlockReason} Switching back to consensus flow.`)
          );
        }

        nextState = {
          ...nextState,
          planSource: 'consensus',
          openClawLockedPlan: null,
          planLockedAt: null,
          planLockExpiresAt: null,
          plan: buildConsensusPlan(nextState.plan, consensus.consensusSetup),
          updatedAt: new Date().toISOString(),
        };
        inMemoryBots.set(symbol, nextState);
        await persistBotState(symbol, nextState);

        if (consensusSetupChanged) {
          await storeLogEntry(
            symbol,
            createLog(
              'info',
              `Consensus updated for ${symbol}. Using ${consensus.executionConsensusLabel} from ${consensus.executionBasisLabel}.`
            )
          );
        }
      } else if (!isPositionOpen && consensus.consensusSetup && isOpenClawLockedPlan) {
        await storeLogEntry(
          symbol,
          createLog(
            'info',
            `OpenClaw locked plan is active for ${symbol}. Revalidation will unlock after ${current.planLockExpiresAt ?? 'the TTL expires'} unless it is manually reset.`
          )
        );
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
      const openClawValidationFingerprint = buildOpenClawValidationFingerprint({
        consensus,
        currentPrice,
        plan: nextState.plan,
      });
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
        await persistBotState(symbol, focusedState);

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
          await persistBotState(symbol, protectionState);
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
          await persistBotState(symbol, filledState);
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
        await persistBotState(symbol, scannedState);
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
        await persistBotState(symbol, scannedState);
        return scannedState;
      }

      if (!inEntryZone) {
        inMemoryBots.set(symbol, scannedState);
        await persistBotState(symbol, scannedState);
        return scannedState;
      }

      if (isOpenClawLockedPlan && !openClawUnlockReason && shouldSkipOpenClawValidation(current, now, openClawValidationFingerprint)) {
        await storeLogEntry(
          symbol,
          createLog(
            'info',
            `OpenClaw validation cooldown is active for ${symbol}. Waiting before asking again so the same locked plan is not revalidated every poll.`
          ),
          shouldPersistLogs
        );

        inMemoryBots.set(symbol, scannedState);
        await persistBotState(symbol, scannedState);
        return scannedState;
      }

      await storeLogEntry(
        symbol,
        createLog(
          'success',
          `Entry trigger hit for ${symbol} at ${formatLogPrice(currentPrice)}. Placing limit entry at the zone edge and waiting for fill.`
        )
      );

      const account = await futuresAutoTradeService.getAccount();
      const validation = await futuresAutoValidationService.validateSetup({
        accountSize: parseNumber(account.availableBalance ?? account.totalWalletBalance) ?? null,
        consensusSetup: consensus.consensusSetup,
        currentPrice,
        isPerpetual: true,
        leverage: nextState.plan.leverage,
        symbol,
        timeframeSnapshots: consensus.snapshots,
      }, {
        bypassCache: openClawUnlockReason !== null,
      });

      if (validation.validation_result !== 'accepted') {
        const suggestedPlan = validation.suggested_setup ? buildPlanFromOpenClawSetup(nextState.plan, validation.suggested_setup) : null;
        const lockedPlan = getLockedOpenClawPlan(current, suggestedPlan);
        const rejectedState: FuturesAutoBotState = {
          ...scannedState,
          planSource: suggestedPlan ? 'openclaw' : scannedState.planSource ?? current.planSource ?? 'consensus',
          openClawLockedPlan: lockedPlan,
          lastOpenClawValidationAt: new Date().toISOString(),
          lastOpenClawValidationFingerprint: openClawValidationFingerprint,
          planLockedAt: lockedPlan ? new Date().toISOString() : scannedState.planLockedAt ?? current.planLockedAt ?? null,
          planLockExpiresAt: lockedPlan ? new Date(Date.now() + OPENCLAW_PLAN_LOCK_TTL_MS).toISOString() : scannedState.planLockExpiresAt ?? current.planLockExpiresAt ?? null,
          plan: lockedPlan ? { ...lockedPlan, notes: [...lockedPlan.notes, ...validation.adjustment_notes] } : scannedState.plan,
          updatedAt: new Date().toISOString(),
        };

        inMemoryBots.set(symbol, rejectedState);
        await persistBotState(symbol, rejectedState);
        await storeLogEntry(
          symbol,
          createLog(
            'warn',
            suggestedPlan
              ? `OpenClaw rejected open order for ${symbol} (${validation.confidence.toFixed(2)} confidence): ${validation.reason} Applying suggested setup and waiting for the new zone.`
              : `OpenClaw rejected open order for ${symbol} (${validation.confidence.toFixed(2)} confidence): ${validation.reason}`
          )
        );

        if (suggestedPlan) {
          await storeLogEntry(
            symbol,
            createLog(
              'info',
              `OpenClaw suggested setup for ${symbol}: ${validation.adjustment_notes.join(' ') || 'No adjustment notes provided.'}`
            )
          );
        }

        return rejectedState;
      }

      const validatedPlan = buildPlanFromOpenClawSetup(nextState.plan, validation.validated_setup);

      const execution = (await futuresAutoTradeService.executeTrade(validatedPlan, currentPrice)) as {
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
        planSource: 'openclaw',
        openClawLockedPlan: validatedPlan,
        lastOpenClawValidationAt: new Date().toISOString(),
        lastOpenClawValidationFingerprint: openClawValidationFingerprint,
        planLockedAt: new Date().toISOString(),
        planLockExpiresAt: new Date(Date.now() + OPENCLAW_PLAN_LOCK_TTL_MS).toISOString(),
        plan: validatedPlan,
        execution: executionRecord,
        status: execution.entryFilled ? 'entry_placed' : 'entry_pending',
      };

      inMemoryBots.set(symbol, executedState);
      await persistBotState(symbol, executedState);

      await storeLogEntry(
        symbol,
        createLog(
          'success',
          execution.entryFilled
            ? `OpenClaw accepted open order for ${symbol} (${validation.confidence.toFixed(2)} confidence): ${validation.reason} Entry order #${executionRecord.entryOrderId}, TP algo orders ${executionRecord.takeProfitAlgoOrderIds.join(', ') || 'n/a'}, SL algo order ${executionRecord.stopLossAlgoOrderId ?? 'n/a'}.`
            : `OpenClaw accepted open order for ${symbol} (${validation.confidence.toFixed(2)} confidence): ${validation.reason} Limit entry placed for ${symbol} at ${formatLogPrice(executionRecord.entryPrice)}. Waiting for fill before placing TP/SL.`
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
      await persistBotState(symbol, erroredState);
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
        openClawLockedPlan: null,
        lastOpenClawValidationAt: null,
        lastOpenClawValidationFingerprint: null,
        planSource: 'consensus',
        planLockedAt: null,
        planLockExpiresAt: null,
        status,
      };

    inMemoryBots.set(input.symbol, state);
    await persistBotState(input.symbol, state);
    await storeLogEntry(input.symbol, createLog('success', logMessage), true);

    return state;
  }

  async stop(symbol: string) {
    const current = inMemoryBots.get(symbol) ?? (await readPersistedBotState(symbol));

    if (current && !inMemoryBots.has(symbol)) {
      inMemoryBots.set(symbol, current);
    }

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
    await persistBotState(symbol, nextState);
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
    await persistBotState(symbol, null);
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
