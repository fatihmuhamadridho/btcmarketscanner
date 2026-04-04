import type { CoinSetupAnalysisContext, CoinSetupSide } from '../interface/CoinSetup.interface';
import type { SetupCandle, SupportResistance, TrendInsight } from '../interface/CoinLogic.interface';
import { getAverageTrueRange, getRelativeStrengthIndex } from './CoinSetupShared.logic';
import { getSetupPathStatus } from './CoinSetupPath.logic';

export function buildCoinSetupAnalysisContext(
  side: CoinSetupSide,
  candles: SetupCandle[],
  trendSummary: TrendInsight,
  supportResistance: SupportResistance
): CoinSetupAnalysisContext {
  const orderedCandles = [...candles].sort((left, right) => left.openTime - right.openTime);
  const lastPrice = orderedCandles[orderedCandles.length - 1].close;
  const atr = getAverageTrueRange(orderedCandles, 14);
  const rsi14 = getRelativeStrengthIndex(orderedCandles, 14);
  const range = Math.max(supportResistance.resistance - supportResistance.support, 1);
  const zoneBuffer = Math.max(atr ?? range * 0.1, lastPrice * 0.002, 1);
  const stopBuffer = Math.max(zoneBuffer * 0.9, lastPrice * 0.003);
  const targetBuffer = Math.max(zoneBuffer * 1.2, range * 0.16);

  const bullishStructure = trendSummary.structurePattern === 'HH/HL' || trendSummary.structure.includes('Higher high');
  const bearishStructure =
    trendSummary.structurePattern === 'LH/LL' ||
    trendSummary.structure.includes('Lower high') ||
    trendSummary.structure.includes('Lower low');

  const maScore =
    (trendSummary.ma20 !== null &&
    ((side === 'long' && lastPrice > trendSummary.ma20) || (side === 'short' && lastPrice < trendSummary.ma20))
      ? 1
      : 0) +
    (trendSummary.ma50 !== null &&
    ((side === 'long' && lastPrice > trendSummary.ma50) || (side === 'short' && lastPrice < trendSummary.ma50))
      ? 1
      : 0) +
    (trendSummary.ma200 !== null &&
    ((side === 'long' && lastPrice > trendSummary.ma200) || (side === 'short' && lastPrice < trendSummary.ma200))
      ? 1
      : 0);

  const trendBiasScore =
    side === 'long'
      ? trendSummary.direction === 'bullish'
        ? 2
        : trendSummary.direction === 'sideways'
          ? 0
          : -1
      : trendSummary.direction === 'bearish'
        ? 2
        : trendSummary.direction === 'sideways'
          ? 0
          : -1;

  const structureScore =
    side === 'long'
      ? bullishStructure
        ? 2
        : bearishStructure
          ? -2
          : 0
      : bearishStructure
        ? 2
        : bullishStructure
          ? -2
          : 0;

  const volumeScore =
    trendSummary.volumeRatio !== null
      ? trendSummary.volumeRatio > 1.05
        ? 1
        : trendSummary.volumeRatio < 0.95
          ? -1
          : 0
      : 0;

  const nearSupport = lastPrice <= supportResistance.support + zoneBuffer * 1.5;
  const nearResistance = lastPrice >= supportResistance.resistance - zoneBuffer * 1.5;
  const breakoutLong = lastPrice > supportResistance.resistance * 1.01;
  const breakdownShort = lastPrice < supportResistance.support * 0.99;
  const pathStatus = getSetupPathStatus({
    candles: orderedCandles,
    direction: side,
    lastPrice,
    supportResistance,
    zoneBuffer,
  });
  const continuationMode =
    side === 'long'
      ? bullishStructure && trendSummary.direction !== 'bearish'
      : bearishStructure && trendSummary.direction !== 'bullish';
  const pathMode =
    side === 'long'
      ? breakoutLong
        ? 'breakout'
        : continuationMode
          ? 'continuation'
          : 'breakout'
      : breakdownShort
        ? 'breakout'
        : continuationMode
          ? 'continuation'
          : 'breakout';

  return {
    atr,
    atr14: atr,
    breakdownShort,
    breakoutLong,
    bearishStructure,
    bullishStructure,
    candles,
    continuationMode,
    lastPrice,
    maScore,
    nearResistance,
    nearSupport,
    orderedCandles,
    pathMode,
    pathStatus,
    range,
    side,
    scoreBase: trendSummary.score,
    structureScore,
    stopBuffer,
    supportResistance,
    targetBuffer,
    trendBiasScore,
    trendSummary,
    rsi14,
    volumeScore,
    zoneBuffer,
  };
}
