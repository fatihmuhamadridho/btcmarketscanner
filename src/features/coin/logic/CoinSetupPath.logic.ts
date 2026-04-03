import type { CoinSetupAnalysisContext } from '../interface/CoinSetup.interface';
import type { SetupPathStep } from '../interface/CoinLogic.interface';
import { buildSetupPathStep } from './CoinSetupShared.logic';

export function getSetupPathStatus(context: {
  candles: { close: number; high: number; low: number }[];
  direction: 'long' | 'short';
  lastPrice: number;
  supportResistance: { resistance: number; support: number };
  zoneBuffer: number;
}) {
  const recentCandles = context.candles.slice(-6);

  if (context.direction === 'long') {
    const brokenAbove = context.lastPrice > context.supportResistance.resistance + context.zoneBuffer * 0.35;
    const retested = recentCandles.some((candle) => {
      const touchedResistance =
        candle.low <= context.supportResistance.resistance + context.zoneBuffer * 0.5 &&
        candle.high >= context.supportResistance.resistance - context.zoneBuffer * 0.35;
      const closedAbove = candle.close >= context.supportResistance.resistance;
      return brokenAbove && touchedResistance && closedAbove;
    });
    const rejection =
      retested &&
      recentCandles.at(-1) !== undefined &&
      recentCandles.length >= 2 &&
      recentCandles.at(-1)!.close > recentCandles.at(-2)!.close &&
      recentCandles.at(-1)!.close >= context.supportResistance.resistance;

    return {
      break: brokenAbove,
      retest: retested,
      rejection,
    };
  }

  const brokenBelow = context.lastPrice < context.supportResistance.support - context.zoneBuffer * 0.35;
  const retested = recentCandles.some((candle) => {
    const touchedSupport =
      candle.high >= context.supportResistance.support - context.zoneBuffer * 0.5 &&
      candle.low <= context.supportResistance.support + context.zoneBuffer * 0.35;
    const closedBelow = candle.close <= context.supportResistance.support;
    return brokenBelow && touchedSupport && closedBelow;
  });
  const rejection =
    retested &&
    recentCandles.at(-1) !== undefined &&
    recentCandles.length >= 2 &&
    recentCandles.at(-1)!.close < recentCandles.at(-2)!.close &&
    recentCandles.at(-1)!.close <= context.supportResistance.support;

  return {
    break: brokenBelow,
    retest: retested,
    rejection,
  };
}

export function buildSetupPath(context: CoinSetupAnalysisContext): SetupPathStep[] {
  if (context.pathMode === 'breakout') {
    return [
      buildSetupPathStep(
        context.side === 'long' ? 'Break above resistance' : 'Break below support',
        context.pathStatus.break ? 'done' : 'current'
      ),
      buildSetupPathStep(
        'Retest the broken level',
        context.pathStatus.break ? (context.pathStatus.retest ? 'done' : 'current') : 'pending'
      ),
      buildSetupPathStep(
        'Rejection in breakout direction',
        context.pathStatus.break && context.pathStatus.retest ? (context.pathStatus.rejection ? 'done' : 'current') : 'pending'
      ),
    ];
  }

  return [
    buildSetupPathStep('Trend structure holds', context.continuationMode ? 'done' : 'current'),
    buildSetupPathStep(
      context.side === 'long' ? 'Pullback to support / MA' : 'Pullback to resistance / MA',
      context.side === 'long' ? (context.nearSupport ? 'done' : 'current') : context.nearResistance ? 'done' : 'current'
    ),
    buildSetupPathStep(
      context.side === 'long' ? 'Bullish rejection / bounce' : 'Bearish rejection / drop',
      context.side === 'long'
        ? context.lastPrice > (context.trendSummary.ma20 ?? context.supportResistance.support)
          ? 'done'
          : 'current'
        : context.lastPrice < (context.trendSummary.ma20 ?? context.supportResistance.resistance)
          ? 'done'
          : 'current'
    ),
  ];
}
