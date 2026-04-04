import { IconMinus, IconTrendingDown, IconTrendingUp } from '@tabler/icons-react';
import type { SupportResistance, TrendCandle, TrendInsight } from '../interface/CoinLogic.interface';
import { getAverageTrueRange, getExponentialMovingAverage, getRelativeStrengthIndex } from './CoinSetupShared.logic';

function getSimpleMovingAverage(values: number[], period: number, endIndex: number) {
  if (endIndex < 0 || values.length === 0) {
    return null;
  }

  const cappedEndIndex = Math.min(endIndex, values.length - 1);
  const startIndex = Math.max(0, cappedEndIndex - period + 1);
  const window = values.slice(startIndex, cappedEndIndex + 1);

  if (window.length === 0) {
    return null;
  }

  return window.reduce((sum, value) => sum + value, 0) / window.length;
}

function getAverage(values: number[], startIndex: number, endIndex: number) {
  if (values.length === 0 || endIndex < startIndex) {
    return null;
  }

  const window = values.slice(Math.max(0, startIndex), Math.min(values.length, endIndex + 1));

  if (window.length === 0) {
    return null;
  }

  return window.reduce((sum, value) => sum + value, 0) / window.length;
}

function getPivotCandles(candles: Array<{ close: number; openTime: number; high: number; low: number }>, lookback = 3) {
  const pivotsHigh: typeof candles = [];
  const pivotsLow: typeof candles = [];

  for (let index = lookback; index < candles.length - lookback; index += 1) {
    const candle = candles[index];
    const left = candles.slice(index - lookback, index);
    const right = candles.slice(index + 1, index + lookback + 1);

    const isPivotHigh =
      left.every((item) => item.high < candle.high) && right.every((item) => item.high <= candle.high);
    const isPivotLow = left.every((item) => item.low > candle.low) && right.every((item) => item.low >= candle.low);

    if (isPivotHigh) {
      pivotsHigh.push(candle);
    }

    if (isPivotLow) {
      pivotsLow.push(candle);
    }
  }

  return { pivotsHigh, pivotsLow };
}

export function analyzeTrend(candles: TrendCandle[], supportResistance: SupportResistance | null): TrendInsight {
  if (candles.length < 2) {
    return {
      changePercent: 0,
      color: 'gray',
      direction: 'sideways',
      endPrice: null,
      icon: IconMinus,
      atr14: null,
      ema20: null,
      ema50: null,
      ema100: null,
      ema200: null,
      label: 'Sideways',
      ma20: null,
      ma50: null,
      ma200: null,
      rsi14: null,
      reasons: ['Not enough candles yet'],
      rangePercent: 0,
      score: 0,
      startPrice: null,
      structurePattern: 'Mixed',
      structure: 'Insufficient data',
      volumeRatio: null,
    };
  }

  const orderedCandles = [...candles].sort((left, right) => left.openTime - right.openTime);
  const closes = orderedCandles.map((candle) => candle.close);
  const volumes = orderedCandles.map((candle) => candle.volume);
  const firstPrice = closes[0];
  const lastPrice = closes[closes.length - 1];
  const highestPrice = orderedCandles.reduce((max, candle) => Math.max(max, candle.high), Number.NEGATIVE_INFINITY);
  const lowestPrice = orderedCandles.reduce((min, candle) => Math.min(min, candle.low), Number.POSITIVE_INFINITY);

  const changePercent = firstPrice !== 0 ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0;
  const rangePercent = firstPrice !== 0 ? ((highestPrice - lowestPrice) / firstPrice) * 100 : 0;
  const lastIndex = closes.length - 1;
  const atr14 = getAverageTrueRange(orderedCandles, 14);
  const rsi14 = getRelativeStrengthIndex(orderedCandles, 14);
  const ema20 = getExponentialMovingAverage(closes, 20, lastIndex);
  const ema50 = getExponentialMovingAverage(closes, 50, lastIndex);
  const ema100 = getExponentialMovingAverage(closes, 100, lastIndex);
  const ema200 = getExponentialMovingAverage(closes, 200, lastIndex);
  const ma20 = getSimpleMovingAverage(closes, 20, lastIndex);
  const ma50 = getSimpleMovingAverage(closes, 50, lastIndex);
  const ma200 = getSimpleMovingAverage(closes, 200, lastIndex);
  const ema20Prev = getExponentialMovingAverage(closes, 20, lastIndex - 5);
  const ema50Prev = getExponentialMovingAverage(closes, 50, lastIndex - 5);
  const ema200Prev = getExponentialMovingAverage(closes, 200, lastIndex - 5);
  const recentVolumeAverage = getAverage(volumes, Math.max(0, volumes.length - 20), volumes.length - 1);
  const priorVolumeAverage = getAverage(volumes, Math.max(0, volumes.length - 40), Math.max(0, volumes.length - 21));
  const volumeRatio =
    recentVolumeAverage && priorVolumeAverage && priorVolumeAverage !== 0
      ? recentVolumeAverage / priorVolumeAverage
      : null;
  const { pivotsHigh, pivotsLow } = getPivotCandles(orderedCandles, 3);
  const recentHighs = pivotsHigh.slice(-2);
  const recentLows = pivotsLow.slice(-2);

  let score = 0;
  const reasons: string[] = [];

  const priceAboveEma20 = ema20 !== null && lastPrice > ema20;
  const priceAboveEma50 = ema50 !== null && lastPrice > ema50;
  const priceAboveEma200 = ema200 !== null && lastPrice > ema200;
  const priceBelowEma20 = ema20 !== null && lastPrice < ema20;
  const priceBelowEma50 = ema50 !== null && lastPrice < ema50;
  const priceBelowEma200 = ema200 !== null && lastPrice < ema200;

  if (ema20 !== null && ema50 !== null) {
    if (priceAboveEma20 && priceAboveEma50) {
      score += 1;
      reasons.push('Price is above EMA20 and EMA50');
    } else if (priceBelowEma20 && priceBelowEma50) {
      score -= 1;
      reasons.push('Price is below EMA20 and EMA50');
    }
  }

  if (ema200 !== null) {
    if (priceAboveEma200) {
      score += 1;
      reasons.push('Price is holding above EMA200');
    } else if (priceBelowEma200) {
      score -= 1;
      reasons.push('Price is trading below EMA200');
    }
  }

  if (ema20 !== null && ema20Prev !== null) {
    if (ema20 > ema20Prev) {
      score += 1;
      reasons.push('EMA20 is sloping up');
    } else if (ema20 < ema20Prev) {
      score -= 1;
      reasons.push('EMA20 is sloping down');
    }
  }

  if (ema50 !== null && ema50Prev !== null) {
    if (ema50 > ema50Prev) {
      score += 1;
      reasons.push('EMA50 is sloping up');
    } else if (ema50 < ema50Prev) {
      score -= 1;
      reasons.push('EMA50 is sloping down');
    }
  }

  if (ema200 !== null && ema200Prev !== null) {
    if (ema200 > ema200Prev) {
      score += 1;
      reasons.push('EMA200 is sloping up');
    } else if (ema200 < ema200Prev) {
      score -= 1;
      reasons.push('EMA200 is sloping down');
    }
  }

  let structure = 'Mixed structure';
  let structurePattern: TrendInsight['structurePattern'] = 'Mixed';
  if (recentHighs.length === 2 && recentLows.length === 2) {
    const [prevHigh, lastHigh] = recentHighs;
    const [prevLow, lastLow] = recentLows;

    if (lastHigh.high > prevHigh.high && lastLow.low > prevLow.low) {
      score += 2;
      structure = 'Higher highs and higher lows';
      structurePattern = 'HH/HL';
      reasons.push('HH/HL structure is intact');
    } else if (lastHigh.high < prevHigh.high && lastLow.low < prevLow.low) {
      score -= 2;
      structure = 'Lower highs and lower lows';
      structurePattern = 'LH/LL';
      reasons.push('LH/LL structure is intact');
    } else if (lastHigh.high > prevHigh.high) {
      score += 1;
      structure = 'Higher high, mixed low';
      reasons.push('Recent highs are improving');
    } else if (lastLow.low < prevLow.low) {
      score -= 1;
      structure = 'Lower low, mixed high';
      reasons.push('Recent lows are weakening');
    }
  }

  if (volumeRatio !== null) {
    if (volumeRatio > 1.12 && changePercent > 0) {
      score += 1;
      reasons.push('Volume is expanding on the move up');
    } else if (volumeRatio < 0.88 && changePercent < 0) {
      score -= 1;
      reasons.push('Volume is fading on the move down');
    } else if (volumeRatio > 1.12) {
      reasons.push('Volume is above its recent average');
    }
  }

  if (supportResistance) {
    const { support, resistance } = supportResistance;
    const supportGapPercent = support !== 0 ? ((lastPrice - support) / support) * 100 : null;
    const resistanceGapPercent = resistance !== 0 ? ((resistance - lastPrice) / resistance) * 100 : null;

    if (lastPrice > resistance * 1.01) {
      score += 2;
      reasons.push('Price broke above resistance');
    } else if (lastPrice < support * 0.99) {
      score -= 2;
      reasons.push('Price broke below support');
    } else if (supportGapPercent !== null && supportGapPercent >= 0 && supportGapPercent <= 1.5) {
      score += 1;
      reasons.push('Price is holding close to support');
    } else if (resistanceGapPercent !== null && resistanceGapPercent >= 0 && resistanceGapPercent <= 1.5) {
      score -= 1;
      reasons.push('Price is pressing against resistance');
    }
  }

  if (atr14 !== null) {
    reasons.push(`ATR14 volatility is ${atr14.toFixed(2)}`);
  }

  if (rsi14 !== null) {
    if (rsi14 >= 70) {
      score -= 1;
      reasons.push(`RSI14 is overbought at ${rsi14.toFixed(2)}`);
    } else if (rsi14 <= 30) {
      score += 1;
      reasons.push(`RSI14 is oversold at ${rsi14.toFixed(2)}`);
    } else if (rsi14 >= 55) {
      score += 1;
      reasons.push(`RSI14 momentum is bullish at ${rsi14.toFixed(2)}`);
    } else if (rsi14 <= 45) {
      score -= 1;
      reasons.push(`RSI14 momentum is bearish at ${rsi14.toFixed(2)}`);
    } else {
      reasons.push(`RSI14 is balanced at ${rsi14.toFixed(2)}`);
    }
  }

  let direction: TrendInsight['direction'] = 'sideways';
  let label = 'Sideways';
  let color: TrendInsight['color'] = 'gray';
  let icon = IconMinus;

  if (score >= 4) {
    direction = 'bullish';
    label = 'Strong bullish';
    color = 'teal';
    icon = IconTrendingUp;
  } else if (score >= 2) {
    direction = 'bullish';
    label = 'Bullish';
    color = 'teal';
    icon = IconTrendingUp;
  } else if (score <= -4) {
    direction = 'bearish';
    label = 'Strong bearish';
    color = 'red';
    icon = IconTrendingDown;
  } else if (score <= -2) {
    direction = 'bearish';
    label = 'Bearish';
    color = 'red';
    icon = IconTrendingDown;
  }

  if (reasons.length === 0) {
    reasons.push('Not enough conviction from the current market data');
  }

  return {
    changePercent,
    color,
    direction,
    endPrice: lastPrice,
    icon,
    atr14,
    ema20,
    ema50,
    ema100,
    ema200,
    label,
    ma20,
    ma50,
    ma200,
    rsi14,
    reasons: reasons.slice(0, 6),
    rangePercent,
    score,
    startPrice: firstPrice,
    structurePattern,
    structure,
    volumeRatio,
  };
}
