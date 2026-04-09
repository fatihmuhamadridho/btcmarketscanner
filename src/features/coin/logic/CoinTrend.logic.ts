import { IconMinus, IconTrendingDown, IconTrendingUp } from '@tabler/icons-react';
import { analyzeTrend as analyzeTrendCore, getAverageTrueRange, getExponentialMovingAverage, getRelativeStrengthIndex } from 'btcmarketscanner-core';
import type { SupportResistance, TrendCandle } from 'btcmarketscanner-core';
import type { TrendInsight } from '../interface/CoinLogic.interface';

export function analyzeTrend(candles: TrendCandle[], supportResistance: SupportResistance | null): TrendInsight {
  const trend = analyzeTrendCore(candles, supportResistance);

  return {
    ...trend,
    icon: trend.direction === 'bullish' ? IconTrendingUp : trend.direction === 'bearish' ? IconTrendingDown : IconMinus,
  };
}

export { getAverageTrueRange, getExponentialMovingAverage, getRelativeStrengthIndex };
