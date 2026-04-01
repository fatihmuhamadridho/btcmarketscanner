import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconArrowLeft, IconTrendingDown, IconTrendingUp, IconMinus } from '@tabler/icons-react';
import { formatDecimalString } from '@utils/format-number';
import CoinChart from './CoinChart';
import AppFooter from '../shared/AppFooter';
import AnalysisDisclaimer from '../shared/AnalysisDisclaimer';
import {
  useFuturesMarketSymbolCandles,
  useFuturesMarketSymbolInitialCandles,
  useFuturesMarketSymbolSnapshot,
  useFuturesMarketTimeframeSupportResistance,
} from '@core/binance/futures/market/infrastructure/futuresMarket.hook';

function formatDate(value?: number) {
  if (!value) return 'n/a';
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatPriceLevel(value: number | null) {
  if (value === null) {
    return 'n/a';
  }

  return formatDecimalString(value.toFixed(2));
}

function formatSignedPercent(value: number) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function formatPriceZone(zone: { high: number | null; low: number | null }) {
  if (zone.low === null || zone.high === null) {
    return 'n/a';
  }

  return `${formatPriceLevel(zone.low)} - ${formatPriceLevel(zone.high)}`;
}

const TIMEFRAMES = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '30m', value: '30m' },
  { label: '1H', value: '1h' },
  { label: '4H', value: '4h' },
  { label: '1D', value: '1d' },
] as const;
type CoinTimeframe = (typeof TIMEFRAMES)[number]['value'];

const MARKET_STRUCTURE_TERMS = [
  { label: 'Short-term', value: 'short' },
  { label: 'Medium-term', value: 'medium' },
  { label: 'Long-term', value: 'long' },
] as const;

type MarketStructureTerm = (typeof MARKET_STRUCTURE_TERMS)[number]['value'];

const MARKET_STRUCTURE_WINDOW_SIZES: Record<MarketStructureTerm, number> = {
  short: 20,
  medium: 50,
  long: 100,
};

type TrendDirection = 'bullish' | 'bearish' | 'sideways';

type TrendInsight = {
  changePercent: number;
  color: 'teal' | 'red' | 'gray';
  direction: TrendDirection;
  endPrice: number | null;
  icon: typeof IconMinus;
  label: string;
  ma20: number | null;
  ma50: number | null;
  ma200: number | null;
  reasons: string[];
  rangePercent: number;
  score: number;
  startPrice: number | null;
  structurePattern: 'HH/HL' | 'LH/LL' | 'Mixed';
  structure: string;
  volumeRatio: number | null;
};

type SetupInsight = {
  direction: 'long' | 'short';
  entryZone: {
    high: number | null;
    low: number | null;
  };
  grade: 'A+' | 'A' | 'B' | 'C';
  gradeRank: number;
  label: string;
  marketCondition: string;
  pathMode: 'breakout' | 'continuation';
  path: Array<{
    label: string;
    status: 'done' | 'current' | 'pending';
  }>;
  takeProfits: Array<{
    label: 'TP1' | 'TP2' | 'TP3';
    price: number | null;
  }>;
  reasons: string[];
  riskReward: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
};

type SetupPathStep = SetupInsight['path'][number];

function buildSetupPathStep(label: string, status: SetupPathStep['status']): SetupPathStep {
  return { label, status };
}

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

function getAverageTrueRange(
  candles: Array<{
    close: number;
    high: number;
    low: number;
  }>,
  period = 14
) {
  if (candles.length < 2) {
    return null;
  }

  const startIndex = Math.max(1, candles.length - period);
  const trueRanges: number[] = [];

  for (let index = startIndex; index < candles.length; index += 1) {
    const current = candles[index];
    const previous = candles[index - 1];
    const highLow = current.high - current.low;
    const highClose = Math.abs(current.high - previous.close);
    const lowClose = Math.abs(current.low - previous.close);

    trueRanges.push(Math.max(highLow, highClose, lowClose));
  }

  if (trueRanges.length === 0) {
    return null;
  }

  return trueRanges.reduce((sum, value) => sum + value, 0) / trueRanges.length;
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

function analyzeTrend(
  candles: Array<{
    close: number;
    high: number;
    low: number;
    openTime: number;
    volume: number;
  }>,
  supportResistance: { support: number; resistance: number } | null
): TrendInsight {
  if (candles.length < 2) {
    return {
      changePercent: 0,
      color: 'gray',
      direction: 'sideways',
      endPrice: null,
      icon: IconMinus,
      label: 'Sideways',
      ma20: null,
      ma50: null,
      ma200: null,
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
  const ma20 = getSimpleMovingAverage(closes, 20, lastIndex);
  const ma50 = getSimpleMovingAverage(closes, 50, lastIndex);
  const ma200 = getSimpleMovingAverage(closes, 200, lastIndex);
  const ma20Prev = getSimpleMovingAverage(closes, 20, lastIndex - 5);
  const ma50Prev = getSimpleMovingAverage(closes, 50, lastIndex - 5);
  const ma200Prev = getSimpleMovingAverage(closes, 200, lastIndex - 5);
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

  const priceAboveMa20 = ma20 !== null && lastPrice > ma20;
  const priceAboveMa50 = ma50 !== null && lastPrice > ma50;
  const priceAboveMa200 = ma200 !== null && lastPrice > ma200;
  const priceBelowMa20 = ma20 !== null && lastPrice < ma20;
  const priceBelowMa50 = ma50 !== null && lastPrice < ma50;
  const priceBelowMa200 = ma200 !== null && lastPrice < ma200;

  if (ma20 !== null && ma50 !== null) {
    if (priceAboveMa20 && priceAboveMa50) {
      score += 1;
      reasons.push('Price is above MA20 and MA50');
    } else if (priceBelowMa20 && priceBelowMa50) {
      score -= 1;
      reasons.push('Price is below MA20 and MA50');
    }
  }

  if (ma200 !== null) {
    if (priceAboveMa200) {
      score += 1;
      reasons.push('Price is holding above MA200');
    } else if (priceBelowMa200) {
      score -= 1;
      reasons.push('Price is trading below MA200');
    }
  }

  if (ma20 !== null && ma20Prev !== null) {
    if (ma20 > ma20Prev) {
      score += 1;
      reasons.push('MA20 is sloping up');
    } else if (ma20 < ma20Prev) {
      score -= 1;
      reasons.push('MA20 is sloping down');
    }
  }

  if (ma50 !== null && ma50Prev !== null) {
    if (ma50 > ma50Prev) {
      score += 1;
      reasons.push('MA50 is sloping up');
    } else if (ma50 < ma50Prev) {
      score -= 1;
      reasons.push('MA50 is sloping down');
    }
  }

  if (ma200 !== null && ma200Prev !== null) {
    if (ma200 > ma200Prev) {
      score += 1;
      reasons.push('MA200 is sloping up');
    } else if (ma200 < ma200Prev) {
      score -= 1;
      reasons.push('MA200 is sloping down');
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

  let direction: TrendDirection = 'sideways';
  let label = 'Sideways';
  let color: 'teal' | 'red' | 'gray' = 'gray';
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
    label,
    ma20,
    ma50,
    ma200,
    reasons: reasons.slice(0, 4),
    rangePercent,
    score,
    startPrice: firstPrice,
    structurePattern,
    structure,
    volumeRatio,
  };
}

function getGradeFromScore(score: number): SetupInsight['grade'] {
  if (score >= 8) {
    return 'A+';
  }

  if (score >= 6) {
    return 'A';
  }

  if (score >= 4) {
    return 'B';
  }

  return 'C';
}

function buildZone(low: number, high: number) {
  return low <= high ? { low, high } : { low: high, high: low };
}

function buildTakeProfitSteps(
  direction: 'long' | 'short',
  entryMid: number,
  risk: number,
  supportResistance: { support: number; resistance: number },
  targetBuffer: number
) {
  if (direction === 'long') {
    const tp1 = Math.max(entryMid + risk * 1, supportResistance.resistance + targetBuffer * 0.25);
    const tp2 = Math.max(entryMid + risk * 2, supportResistance.resistance + targetBuffer * 0.75);
    const tp3 = Math.max(entryMid + risk * 3, supportResistance.resistance + targetBuffer * 1.5);

    return [
      { label: 'TP1' as const, price: tp1 },
      { label: 'TP2' as const, price: tp2 },
      { label: 'TP3' as const, price: tp3 },
    ];
  }

  const tp1 = Math.min(entryMid - risk * 1, supportResistance.support - targetBuffer * 0.25);
  const tp2 = Math.min(entryMid - risk * 2, supportResistance.support - targetBuffer * 0.75);
  const tp3 = Math.min(entryMid - risk * 3, supportResistance.support - targetBuffer * 1.5);

  return [
    { label: 'TP1' as const, price: tp1 },
    { label: 'TP2' as const, price: tp2 },
    { label: 'TP3' as const, price: tp3 },
  ];
}

function getSetupPathStatus({
  direction,
  lastPrice,
  supportResistance,
  candles,
  zoneBuffer,
}: {
  candles: Array<{
    close: number;
    high: number;
    low: number;
    openTime: number;
    volume: number;
  }>;
  direction: 'long' | 'short';
  lastPrice: number;
  supportResistance: { support: number; resistance: number };
  zoneBuffer: number;
}) {
  const recentCandles = candles.slice(-6);

  if (direction === 'long') {
    const brokenAbove = lastPrice > supportResistance.resistance + zoneBuffer * 0.35;
    const retested = recentCandles.some((candle) => {
      const touchedResistance =
        candle.low <= supportResistance.resistance + zoneBuffer * 0.5 &&
        candle.high >= supportResistance.resistance - zoneBuffer * 0.35;
      const closedAbove = candle.close >= supportResistance.resistance;
      return brokenAbove && touchedResistance && closedAbove;
    });
    const rejection =
      retested &&
      recentCandles.at(-1) !== undefined &&
      recentCandles.length >= 2 &&
      recentCandles.at(-1)!.close > recentCandles.at(-2)!.close &&
      recentCandles.at(-1)!.close >= supportResistance.resistance;

    return {
      break: brokenAbove,
      retest: retested,
      rejection,
    };
  }

  const brokenBelow = lastPrice < supportResistance.support - zoneBuffer * 0.35;
  const retested = recentCandles.some((candle) => {
    const touchedSupport =
      candle.high >= supportResistance.support - zoneBuffer * 0.5 &&
      candle.low <= supportResistance.support + zoneBuffer * 0.35;
    const closedBelow = candle.close <= supportResistance.support;
    return brokenBelow && touchedSupport && closedBelow;
  });
  const rejection =
    retested &&
    recentCandles.at(-1) !== undefined &&
    recentCandles.length >= 2 &&
    recentCandles.at(-1)!.close < recentCandles.at(-2)!.close &&
    recentCandles.at(-1)!.close <= supportResistance.support;

  return {
    break: brokenBelow,
    retest: retested,
    rejection,
  };
}

function analyzeSetupSide(
  side: 'long' | 'short',
  candles: Array<{
    close: number;
    high: number;
    low: number;
    openTime: number;
    volume: number;
  }>,
  trendSummary: TrendInsight,
  supportResistance: { support: number; resistance: number } | null
): SetupInsight {
  if (candles.length < 2 || !supportResistance) {
    return {
      direction: side,
      entryZone: { high: null, low: null },
      grade: 'C',
      gradeRank: 0,
      label: `${side === 'long' ? 'Long' : 'Short'} setup`,
      marketCondition: 'Need more market data',
      pathMode: 'breakout',
      path: [
        buildSetupPathStep('Break', 'pending'),
        buildSetupPathStep('Retest', 'pending'),
        buildSetupPathStep('Rejection', 'pending'),
      ],
      takeProfits: [
        { label: 'TP1', price: null },
        { label: 'TP2', price: null },
        { label: 'TP3', price: null },
      ],
      reasons: ['Need support / resistance data and loaded candles'],
      riskReward: null,
      stopLoss: null,
      takeProfit: null,
    };
  }

  const orderedCandles = [...candles].sort((left, right) => left.openTime - right.openTime);
  const lastPrice = orderedCandles[orderedCandles.length - 1].close;
  const atr = getAverageTrueRange(orderedCandles, 14);
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
  const pathMode: 'breakout' | 'continuation' =
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

  const path =
    pathMode === 'breakout'
      ? [
          buildSetupPathStep(
            side === 'long' ? 'Break above resistance' : 'Break below support',
            pathStatus.break ? 'done' : 'current'
          ),
          buildSetupPathStep(
            'Retest the broken level',
            pathStatus.break ? (pathStatus.retest ? 'done' : 'current') : 'pending'
          ),
          buildSetupPathStep(
            'Rejection in breakout direction',
            pathStatus.break && pathStatus.retest ? (pathStatus.rejection ? 'done' : 'current') : 'pending'
          ),
        ]
      : [
          buildSetupPathStep('Trend structure holds', continuationMode ? 'done' : 'current'),
          buildSetupPathStep(
            side === 'long' ? 'Pullback to support / MA' : 'Pullback to resistance / MA',
            side === 'long' ? (nearSupport ? 'done' : 'current') : nearResistance ? 'done' : 'current'
          ),
          buildSetupPathStep(
            side === 'long' ? 'Bullish rejection / bounce' : 'Bearish rejection / drop',
            side === 'long'
              ? lastPrice > (trendSummary.ma20 ?? supportResistance.support)
                ? 'done'
                : 'current'
              : lastPrice < (trendSummary.ma20 ?? supportResistance.resistance)
                ? 'done'
                : 'current'
          ),
        ];

  let entryZone = buildZone(supportResistance.support + zoneBuffer * 0.2, supportResistance.support + zoneBuffer * 0.8);
  let marketCondition = 'Range-bound setup';
  const reasons: string[] = [];
  let score = trendSummary.score + trendBiasScore + maScore + structureScore + volumeScore;

  if (side === 'long') {
    if (breakoutLong) {
      entryZone = buildZone(
        supportResistance.resistance + zoneBuffer * 0.1,
        supportResistance.resistance + zoneBuffer * 0.8
      );
      marketCondition = 'Bullish breakout continuation';
      score += 2;
      reasons.push('Price is breaking above resistance');
    } else if (nearSupport) {
      const zoneLow = Math.max(
        supportResistance.support + zoneBuffer * 0.15,
        (trendSummary.ma20 ?? supportResistance.support) - zoneBuffer * 0.2
      );
      const zoneHigh = Math.min(
        supportResistance.support + zoneBuffer * 1.35,
        supportResistance.resistance - zoneBuffer * 0.2
      );
      entryZone = buildZone(zoneLow, Math.max(zoneLow + zoneBuffer * 0.5, zoneHigh));
      marketCondition = 'Bullish pullback near support';
      score += 2;
      reasons.push('Price is holding close to support');
    } else {
      const zoneLow = Math.max(
        supportResistance.support + zoneBuffer * 0.2,
        (trendSummary.ma20 ?? lastPrice) - zoneBuffer * 0.35
      );
      const zoneHigh = Math.min(supportResistance.resistance - zoneBuffer * 0.2, zoneLow + zoneBuffer * 1.2);
      entryZone = buildZone(zoneLow, Math.max(zoneLow + zoneBuffer * 0.6, zoneHigh));
      marketCondition = 'Bullish continuation';
      score += 1;
      reasons.push('Long is favored while price holds above support');
    }

    const entryMid = (entryZone.low + entryZone.high) / 2;
    const stopLoss = Math.min(supportResistance.support - stopBuffer, entryZone.low - stopBuffer * 0.75);
    const risk = Math.max(entryMid - stopLoss, zoneBuffer);
    const takeProfits = buildTakeProfitSteps('long', entryMid, risk, supportResistance, targetBuffer);
    const takeProfit = takeProfits[2].price;
    const grade = getGradeFromScore(score);

    return {
      direction: 'long',
      entryZone,
      grade,
      gradeRank: score,
      label: `${grade} Long Setup`,
      marketCondition,
      pathMode,
      path: path.map((item) => ({
        ...item,
        status: grade === 'A+' && item.status === 'current' ? 'done' : item.status,
      })),
      takeProfits,
      reasons: [
        'Trend bias is bullish',
        `MA alignment: ${maScore}/3`,
        ...reasons.slice(0, 2),
        trendSummary.volumeRatio !== null
          ? `Volume ratio: x${trendSummary.volumeRatio.toFixed(2)}`
          : 'Volume ratio is not available',
      ],
      riskReward: risk > 0 ? (takeProfit - entryMid) / risk : null,
      stopLoss,
      takeProfit,
    };
  }

  if (breakdownShort) {
    entryZone = buildZone(supportResistance.support - zoneBuffer * 0.8, supportResistance.support - zoneBuffer * 0.1);
    marketCondition = 'Bearish breakdown continuation';
    score += 2;
    reasons.push('Price is breaking below support');
  } else if (nearResistance) {
    const zoneHigh = Math.min(
      supportResistance.resistance - zoneBuffer * 0.15,
      (trendSummary.ma20 ?? supportResistance.resistance) + zoneBuffer * 0.2
    );
    const zoneLow = Math.max(supportResistance.support + zoneBuffer * 0.2, zoneHigh - zoneBuffer * 1.35);
    entryZone = buildZone(Math.min(zoneLow, zoneHigh), zoneHigh);
    marketCondition = 'Bearish pullback near resistance';
    score += 2;
    reasons.push('Price is pressing into resistance');
  } else {
    const zoneHigh = Math.min(
      supportResistance.resistance - zoneBuffer * 0.2,
      (trendSummary.ma20 ?? lastPrice) + zoneBuffer * 0.35
    );
    const zoneLow = Math.max(supportResistance.support + zoneBuffer * 0.2, zoneHigh - zoneBuffer * 1.2);
    entryZone = buildZone(Math.min(zoneLow, zoneHigh), zoneHigh);
    marketCondition = 'Bearish continuation';
    score += 1;
    reasons.push('Short is favored while price stays below resistance');
  }

  const entryMid = (entryZone.low + entryZone.high) / 2;
  const stopLoss = Math.max(supportResistance.resistance + stopBuffer, entryZone.high + stopBuffer * 0.75);
  const risk = Math.max(stopLoss - entryMid, zoneBuffer);
  const takeProfits = buildTakeProfitSteps('short', entryMid, risk, supportResistance, targetBuffer);
  const takeProfit = takeProfits[2].price;
  const grade = getGradeFromScore(score);

  return {
    direction: 'short',
    entryZone,
    grade,
    gradeRank: score,
    label: `${grade} Short Setup`,
    marketCondition,
    pathMode,
    path: path.map((item) => ({
      ...item,
      status: grade === 'A+' && item.status === 'current' ? 'done' : item.status,
    })),
    takeProfits,
    reasons: [
      'Trend bias is bearish',
      `MA alignment: ${maScore}/3`,
      ...reasons.slice(0, 2),
      trendSummary.volumeRatio !== null
        ? `Volume ratio: x${trendSummary.volumeRatio.toFixed(2)}`
        : 'Volume ratio is not available',
    ],
    riskReward: risk > 0 ? (entryMid - takeProfit) / risk : null,
    stopLoss,
    takeProfit,
  };
}

export default function CoinDetailPage() {
  const router = useRouter();
  const symbolParam = router.query.symbol;
  const symbol = typeof symbolParam === 'string' ? symbolParam : undefined;
  const [interval, setInterval] = useState<CoinTimeframe>('1d');
  const [structureTerm, setStructureTerm] = useState<MarketStructureTerm>('short');
  const {
    data: snapshotData,
    isLoading: isLoadingSnapshot,
    error: snapshotError,
  } = useFuturesMarketSymbolSnapshot(symbol);
  const {
    data: initialCandlesData,
    isFetching: isFetchingInitialCandles,
    error: candlesError,
  } = useFuturesMarketSymbolInitialCandles(symbol, interval);
  const detail = snapshotData?.data;
  const marketSymbol = detail?.symbol;
  const symbolInfo = detail?.symbolInfo;
  const chartInitialCandles = useMemo(
    () => (isFetchingInitialCandles ? [] : (initialCandlesData?.data ?? [])),
    [initialCandlesData?.data, isFetchingInitialCandles]
  );
  const analysisCandles = chartInitialCandles;
  const { candles, hasMoreOlderCandles, isLoadingMore, loadOlderCandles } = useFuturesMarketSymbolCandles(
    symbol,
    chartInitialCandles,
    interval
  );
  const pageError = snapshotError;
  const isPageLoading = isLoadingSnapshot;
  const structureWindowSize = MARKET_STRUCTURE_WINDOW_SIZES[structureTerm];
  const timeframeSupportResistance = useFuturesMarketTimeframeSupportResistance(symbol, structureWindowSize);
  const strongSupportResistanceLevel = useMemo(() => {
    const intervalPriority: Record<CoinTimeframe, number> = {
      '1m': 1,
      '5m': 2,
      '15m': 3,
      '30m': 4,
      '1h': 5,
      '4h': 6,
      '1d': 7,
    };

    const candidates = timeframeSupportResistance
      .filter((item) => item.interval !== interval && item.supportResistance !== null)
      .sort(
        (left, right) =>
          intervalPriority[right.interval as CoinTimeframe] - intervalPriority[left.interval as CoinTimeframe]
      );

    return candidates[0] ?? null;
  }, [interval, timeframeSupportResistance]);
  const selectedTimeframeSupportResistance = useMemo(
    () => timeframeSupportResistance.find((item) => item.interval === interval) ?? null,
    [interval, timeframeSupportResistance]
  );
  const trendSummary = useMemo(
    () => analyzeTrend(analysisCandles, selectedTimeframeSupportResistance?.supportResistance ?? null),
    [analysisCandles, selectedTimeframeSupportResistance?.supportResistance]
  );
  const longSetup = useMemo(
    () =>
      analyzeSetupSide(
        'long',
        analysisCandles,
        trendSummary,
        selectedTimeframeSupportResistance?.supportResistance ?? null
      ),
    [analysisCandles, selectedTimeframeSupportResistance?.supportResistance, trendSummary]
  );
  const shortSetup = useMemo(
    () =>
      analyzeSetupSide(
        'short',
        analysisCandles,
        trendSummary,
        selectedTimeframeSupportResistance?.supportResistance ?? null
      ),
    [analysisCandles, selectedTimeframeSupportResistance?.supportResistance, trendSummary]
  );
  const preferredSetup = longSetup.gradeRank >= shortSetup.gradeRank ? longSetup : shortSetup;
  const TrendIcon = trendSummary.icon;

  return (
    <>
      <Head>
        <title>{`${symbol ?? 'Coin'} | BTC Market Scanner`}</title>
        <meta name="description" content="Market detail view for futures contracts." />
      </Head>

      <Box
        mih="100vh"
        py={{ base: 24, sm: 36, lg: 56 }}
        px={{ base: 16, sm: 24 }}
        style={{ backgroundColor: 'transparent' }}
      >
        <Container size="lg">
          <Stack gap="xl">
            <Button
              component={Link}
              href="/"
              variant="subtle"
              color="gray"
              leftSection={<IconArrowLeft size={16} />}
              w="fit-content"
              px={0}
            >
              Back to homepage
            </Button>

            {isPageLoading ? (
              <Paper
                radius="xl"
                p={{ base: 20, sm: 28 }}
                withBorder
                style={{
                  backgroundColor: 'rgba(9, 18, 33, 0.88)',
                  borderColor: 'rgba(255,255,255,0.08)',
                }}
              >
                <Text c="dimmed" size="sm">
                  Loading symbol detail...
                </Text>
              </Paper>
            ) : pageError ? (
              <Paper
                radius="xl"
                p={{ base: 20, sm: 28 }}
                withBorder
                style={{
                  backgroundColor: 'rgba(9, 18, 33, 0.88)',
                  borderColor: 'rgba(255,255,255,0.08)',
                }}
              >
                <Text c="dimmed" size="sm">
                  Failed to load market detail.
                </Text>
              </Paper>
            ) : detail && marketSymbol ? (
              <>
                <Paper
                  radius="xl"
                  p={{ base: 20, sm: 28 }}
                  withBorder
                  shadow="xl"
                  style={{
                    backgroundColor: 'rgba(9, 18, 33, 0.88)',
                    backdropFilter: 'blur(18px)',
                  }}
                >
                  <Group justify="space-between" align="flex-start" gap="xl">
                    <Stack gap="md" maw={720}>
                      <Group gap="sm">
                        <Badge color="teal" variant="light" size="lg" tt="uppercase">
                          {symbolInfo?.contractType ?? marketSymbol.contractType ?? 'FUTURES'}
                        </Badge>
                        <Badge variant="light" color="gray" size="lg">
                          {marketSymbol.symbol}
                        </Badge>
                      </Group>
                      <Title order={1} lh={0.95} fw={700}>
                        {marketSymbol.displayName}
                      </Title>
                      <Text c="dimmed" fz="lg" lh={1.7}>
                        Pair: {marketSymbol.pair ?? 'n/a'} · Base asset: {marketSymbol.baseAsset ?? 'n/a'} · Quote
                        asset: {marketSymbol.quoteAsset ?? 'n/a'}
                      </Text>
                      <Text fz="md" lh={1.7}>
                        Status: {marketSymbol.status ?? 'n/a'} · Onboard: {formatDate(symbolInfo?.onboardDate)}
                      </Text>
                    </Stack>

                    <Stack gap="sm" miw={260}>
                      <Text c="dimmed" size="sm">
                        Latest snapshot
                      </Text>
                      <Card
                        radius="lg"
                        p="lg"
                        withBorder
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.03)',
                          borderColor: 'rgba(255,255,255,0.08)',
                        }}
                      >
                        <Stack gap="sm">
                          <Group gap="sm" align="center">
                            <ThemeIcon size={44} radius="xl" variant="light" color="teal">
                              {marketSymbol.symbol.slice(0, 1)}
                            </ThemeIcon>
                            <Stack gap={0}>
                              <Text fw={700} fz="xl">
                                {marketSymbol.ticker.displayLastPrice}
                              </Text>
                              <Text c="teal" fw={600}>
                                {marketSymbol.ticker.displayChange}
                              </Text>
                            </Stack>
                          </Group>
                          <Divider color="rgba(255,255,255,0.08)" />
                          <Text size="sm" c="dimmed">
                            24h quote volume
                          </Text>
                          <Text fw={600}>{marketSymbol.ticker.displayVolume}</Text>
                        </Stack>
                      </Card>
                    </Stack>
                  </Group>
                </Paper>

                <Paper
                  radius="xl"
                  p={{ base: 16, sm: 20 }}
                  withBorder
                  style={{
                    backgroundColor: 'rgba(9, 18, 33, 0.88)',
                    borderColor: 'rgba(255,255,255,0.08)',
                  }}
                >
                  <SegmentedControl
                    data={MARKET_STRUCTURE_TERMS.map((item) => ({
                      label: item.label,
                      value: item.value,
                    }))}
                    value={structureTerm}
                    onChange={(value) => setStructureTerm(value as MarketStructureTerm)}
                    fullWidth
                    radius="xl"
                    size="sm"
                    styles={{
                      root: {
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        padding: 4,
                      },
                      indicator: {
                        backgroundColor: 'rgba(87, 199, 166, 0.18)',
                        boxShadow: '0 0 0 1px rgba(87, 199, 166, 0.18)',
                      },
                      label: {
                        color: 'rgba(255,255,255,0.7)',
                        fontWeight: 600,
                      },
                    }}
                  />
                </Paper>

                <Paper
                  radius="xl"
                  p={{ base: 20, sm: 28 }}
                  withBorder
                  style={{
                    backgroundColor: 'rgba(9, 18, 33, 0.88)',
                    borderColor: 'rgba(255,255,255,0.08)',
                  }}
                >
                  <Group justify="space-between" align="center" wrap="wrap">
                    <Stack gap={4}>
                      <Text c="dimmed" size="sm" tt="uppercase">
                        Trend overview
                      </Text>
                      <Title order={2} fz="h3">
                        {trendSummary.label} trend
                      </Title>
                      <Text c="dimmed" size="sm">
                        Based on all loaded candles in the current detail view.
                      </Text>
                    </Stack>

                    <Group gap="sm" wrap="nowrap">
                      <ThemeIcon size={44} radius="xl" variant="light" color={trendSummary.color}>
                        <TrendIcon size={20} />
                      </ThemeIcon>
                      <Stack gap={0} align="flex-end">
                        <Text fw={700} fz="xl" c={trendSummary.color}>
                          {trendSummary.label}
                        </Text>
                        <Text c="dimmed" size="sm">
                          {trendSummary.changePercent >= 0 ? '+' : ''}
                          {trendSummary.changePercent.toFixed(2)}% from the first candle
                        </Text>
                      </Stack>
                    </Group>
                  </Group>

                  <Divider color="rgba(255,255,255,0.08)" my="md" />

                  <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                    <Card
                      radius="lg"
                      p="md"
                      withBorder
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        borderColor: 'rgba(255,255,255,0.08)',
                      }}
                    >
                      <Stack gap={4}>
                        <Text c="dimmed" size="sm">
                          Start price
                        </Text>
                        <Text fw={700}>
                          {trendSummary.startPrice !== null
                            ? formatDecimalString(trendSummary.startPrice.toFixed(2))
                            : 'n/a'}
                        </Text>
                      </Stack>
                    </Card>

                    <Card
                      radius="lg"
                      p="md"
                      withBorder
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        borderColor: 'rgba(255,255,255,0.08)',
                      }}
                    >
                      <Stack gap={4}>
                        <Text c="dimmed" size="sm">
                          Latest price
                        </Text>
                        <Text fw={700}>
                          {trendSummary.endPrice !== null
                            ? formatDecimalString(trendSummary.endPrice.toFixed(2))
                            : 'n/a'}
                        </Text>
                      </Stack>
                    </Card>

                    <Card
                      radius="lg"
                      p="md"
                      withBorder
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        borderColor: 'rgba(255,255,255,0.08)',
                      }}
                    >
                      <Stack gap={4}>
                        <Text c="dimmed" size="sm">
                          Range
                        </Text>
                        <Text fw={700}>{trendSummary.rangePercent.toFixed(2)}%</Text>
                      </Stack>
                    </Card>
                  </SimpleGrid>

                  <Divider color="rgba(255,255,255,0.08)" my="md" />

                  <Stack gap="sm">
                    <Group gap="xs" wrap="wrap">
                      <Badge variant="light" color={trendSummary.color}>
                        Score {trendSummary.score > 0 ? '+' : ''}
                        {trendSummary.score}
                      </Badge>
                      <Badge variant="light" color="gray">
                        {trendSummary.structurePattern}
                      </Badge>
                      <Badge variant="light" color="gray">
                        {trendSummary.structure}
                      </Badge>
                      <Badge variant="light" color="gray">
                        MA20 {trendSummary.ma20 !== null ? formatDecimalString(trendSummary.ma20.toFixed(2)) : 'n/a'}
                      </Badge>
                      <Badge variant="light" color="gray">
                        MA50 {trendSummary.ma50 !== null ? formatDecimalString(trendSummary.ma50.toFixed(2)) : 'n/a'}
                      </Badge>
                      <Badge variant="light" color="gray">
                        MA200 {trendSummary.ma200 !== null ? formatDecimalString(trendSummary.ma200.toFixed(2)) : 'n/a'}
                      </Badge>
                      <Badge variant="light" color="gray">
                        Volume {trendSummary.volumeRatio !== null ? `x${trendSummary.volumeRatio.toFixed(2)}` : 'n/a'}
                      </Badge>
                    </Group>

                    <Stack gap={6}>
                      {trendSummary.reasons.map((reason) => (
                        <Text key={reason} size="sm" c="dimmed">
                          • {reason}
                        </Text>
                      ))}
                    </Stack>
                  </Stack>
                </Paper>

                <Paper
                  radius="xl"
                  p={{ base: 20, sm: 28 }}
                  withBorder
                  style={{
                    backgroundColor: 'rgba(9, 18, 33, 0.88)',
                    borderColor: 'rgba(255,255,255,0.08)',
                  }}
                >
                  <Group justify="space-between" align="center" wrap="wrap">
                    <Stack gap={4}>
                      <Text c="dimmed" size="sm" tt="uppercase">
                        Setup levels
                      </Text>
                      <Title order={2} fz="h3">
                        Long and short setups
                      </Title>
                      <Text c="dimmed" size="sm">
                        A+ is the highest grade. Entry is shown as a zone, not a single price. The ideal flow is break,
                        retest, then rejection.
                      </Text>
                    </Stack>

                    <Group gap="sm" wrap="nowrap">
                      <ThemeIcon
                        size={44}
                        radius="xl"
                        variant="light"
                        color={preferredSetup.direction === 'long' ? 'teal' : 'red'}
                      >
                        <TrendIcon size={20} />
                      </ThemeIcon>
                      <Stack gap={0} align="flex-end">
                        <Badge variant="light" color={preferredSetup.direction === 'long' ? 'teal' : 'red'}>
                          Preferred {preferredSetup.grade}
                        </Badge>
                        <Text c="dimmed" size="sm">
                          {preferredSetup.direction === 'long' ? 'Long bias' : 'Short bias'}
                        </Text>
                      </Stack>
                    </Group>
                  </Group>

                  <Divider color="rgba(255,255,255,0.08)" my="md" />

                  <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
                    {[longSetup, shortSetup].map((setup) => {
                      const isLong = setup.direction === 'long';
                      const tone = isLong ? 'teal' : 'red';
                      const takeProfitColor = isLong ? 'teal' : 'orange';
                      const stopLossColor = 'red';
                      const entryPrice =
                        setup.entryZone.low !== null && setup.entryZone.high !== null
                          ? (setup.entryZone.low + setup.entryZone.high) / 2
                          : null;
                      const formatDistanceFromEntry = (price: number | null) => {
                        if (entryPrice === null || price === null || entryPrice === 0) {
                          return 'n/a';
                        }

                        return formatSignedPercent(((price - entryPrice) / entryPrice) * 100);
                      };

                      return (
                        <Card
                          key={setup.direction}
                          radius="lg"
                          p="lg"
                          withBorder
                          style={{
                            backgroundColor: 'rgba(255,255,255,0.03)',
                            borderColor: 'rgba(255,255,255,0.08)',
                          }}
                        >
                          <Stack gap="md">
                            <Group justify="space-between" align="center">
                              <Stack gap={2}>
                                <Text fw={700} fz="lg">
                                  {isLong ? 'Long Setup' : 'Short Setup'}
                                </Text>
                                <Text c="dimmed" size="sm">
                                  {setup.marketCondition}
                                </Text>
                              </Stack>
                              <Badge variant="light" color={tone}>
                                {setup.grade}
                              </Badge>
                            </Group>

                            <Group gap="xs" wrap="wrap">
                              <Badge variant="light" color={tone}>
                                {isLong ? 'Long bias' : 'Short bias'}
                              </Badge>
                              <Badge variant="light" color="gray">
                                Entry zone {formatPriceZone(setup.entryZone)}
                              </Badge>
                            </Group>

                            <Stack gap={8}>
                              <Text c="dimmed" size="xs" tt="uppercase">
                                {setup.pathMode === 'breakout' ? 'A+ breakout path' : 'A+ continuation path'}
                              </Text>
                              <SimpleGrid cols={3} spacing="xs">
                                {setup.path.map((step) => {
                                  const stepColor =
                                    step.status === 'done' ? tone : step.status === 'current' ? 'yellow' : 'gray';

                                  return (
                                    <Card
                                      key={step.label}
                                      radius="md"
                                      p="xs"
                                      withBorder
                                      style={{
                                        backgroundColor:
                                          step.status === 'done' ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                                        borderColor: 'rgba(255,255,255,0.08)',
                                      }}
                                    >
                                      <Stack gap={4}>
                                        <Badge variant="light" color={stepColor}>
                                          {step.status === 'done' ? 'Done' : step.status === 'current' ? 'Now' : 'Wait'}
                                        </Badge>
                                        <Text size="xs" c="dimmed" lh={1.3}>
                                          {step.label}
                                        </Text>
                                      </Stack>
                                    </Card>
                                  );
                                })}
                              </SimpleGrid>
                            </Stack>

                            <SimpleGrid cols={4} spacing="sm">
                              <Card
                                radius="md"
                                p="sm"
                                withBorder
                                style={{
                                  backgroundColor: 'rgba(255,255,255,0.02)',
                                  borderColor: 'rgba(255,255,255,0.06)',
                                }}
                              >
                                <Stack gap={2}>
                                  <Text c="dimmed" size="xs">
                                    TP1
                                  </Text>
                                  <Text fw={700} c={takeProfitColor}>
                                    {formatPriceLevel(setup.takeProfits[0].price)}
                                  </Text>
                                  <Text c={takeProfitColor} size="xs" fw={600}>
                                    {formatDistanceFromEntry(setup.takeProfits[0].price)} from entry
                                  </Text>
                                </Stack>
                              </Card>
                              <Card
                                radius="md"
                                p="sm"
                                withBorder
                                style={{
                                  backgroundColor: 'rgba(255,255,255,0.02)',
                                  borderColor: 'rgba(255,255,255,0.06)',
                                }}
                              >
                                <Stack gap={2}>
                                  <Text c="dimmed" size="xs">
                                    TP2
                                  </Text>
                                  <Text fw={700} c={takeProfitColor}>
                                    {formatPriceLevel(setup.takeProfits[1].price)}
                                  </Text>
                                  <Text c={takeProfitColor} size="xs" fw={600}>
                                    {formatDistanceFromEntry(setup.takeProfits[1].price)} from entry
                                  </Text>
                                </Stack>
                              </Card>
                              <Card
                                radius="md"
                                p="sm"
                                withBorder
                                style={{
                                  backgroundColor: 'rgba(255,255,255,0.02)',
                                  borderColor: 'rgba(255,255,255,0.06)',
                                }}
                              >
                                <Stack gap={2}>
                                  <Text c="dimmed" size="xs">
                                    TP3
                                  </Text>
                                  <Text fw={700} c={takeProfitColor}>
                                    {formatPriceLevel(setup.takeProfits[2].price)}
                                  </Text>
                                  <Text c={takeProfitColor} size="xs" fw={600}>
                                    {formatDistanceFromEntry(setup.takeProfits[2].price)} from entry
                                  </Text>
                                </Stack>
                              </Card>
                              <Card
                                radius="md"
                                p="sm"
                                withBorder
                                style={{
                                  backgroundColor: 'rgba(255,255,255,0.02)',
                                  borderColor: 'rgba(255,255,255,0.06)',
                                }}
                              >
                                <Stack gap={2}>
                                  <Text c="dimmed" size="xs">
                                    Stop loss
                                  </Text>
                                  <Text fw={700} c={stopLossColor}>
                                    {formatPriceLevel(setup.stopLoss)}
                                  </Text>
                                  <Text c={stopLossColor} size="xs" fw={600}>
                                    {formatDistanceFromEntry(setup.stopLoss)} from entry
                                  </Text>
                                </Stack>
                              </Card>
                            </SimpleGrid>

                            <Group gap="xs" wrap="wrap">
                              <Badge variant="light" color="gray">
                                RR {setup.riskReward !== null ? `1:${setup.riskReward.toFixed(2)}` : 'n/a'}
                              </Badge>
                              <Badge variant="light" color="gray">
                                Grade rank {setup.gradeRank}
                              </Badge>
                            </Group>

                            <Stack gap={6}>
                              {setup.reasons.map((reason) => (
                                <Text key={reason} size="sm" c="dimmed">
                                  • {reason}
                                </Text>
                              ))}
                            </Stack>
                          </Stack>
                        </Card>
                      );
                    })}
                  </SimpleGrid>
                </Paper>

                <CoinChart
                  key={`${symbol ?? 'unknown'}-${interval}`}
                  symbol={marketSymbol.symbol}
                  candles={candles}
                  hasMoreOlderCandles={hasMoreOlderCandles}
                  isLoadingMore={isLoadingMore}
                  isLoadingCandles={isFetchingInitialCandles}
                  chartError={candlesError ? 'Failed to load candles.' : null}
                  onLoadOlderCandles={loadOlderCandles}
                  interval={interval}
                  intervals={TIMEFRAMES}
                  onIntervalChange={setInterval}
                  supportResistance={selectedTimeframeSupportResistance?.supportResistance ?? null}
                  strongSupportResistanceLevel={strongSupportResistanceLevel}
                />

                <Paper
                  radius="xl"
                  p={{ base: 20, sm: 28 }}
                  withBorder
                  style={{
                    backgroundColor: 'rgba(9, 18, 33, 0.88)',
                    borderColor: 'rgba(255,255,255,0.08)',
                  }}
                >
                  <Stack gap="lg">
                    <Group justify="space-between" align="center" wrap="wrap">
                      <Stack gap={4}>
                        <Title order={2} fz="h3">
                          Market Structure
                        </Title>
                        <Text c="dimmed" size="sm">
                          Short-term, medium-term, and long-term support structure
                        </Text>
                      </Stack>
                    </Group>

                    <Divider color="rgba(255,255,255,0.08)" />
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
                      {timeframeSupportResistance.map((item) => (
                        <Card
                          key={item.interval}
                          radius="lg"
                          p="lg"
                          withBorder
                          style={{
                            backgroundColor: 'rgba(255,255,255,0.03)',
                            borderColor: 'rgba(255,255,255,0.08)',
                          }}
                        >
                          <Stack gap={10}>
                            <Group justify="space-between" align="center">
                              <Text fw={700}>{item.label}</Text>
                              {item.isLoading ? (
                                <Badge variant="light" color="gray">
                                  Loading
                                </Badge>
                              ) : null}
                            </Group>

                            <Stack gap={4}>
                              <Text c="dimmed" size="sm">
                                Support
                              </Text>
                              <Text fw={700}>{formatDecimalString(item.supportResistance?.support?.toString())}</Text>
                            </Stack>

                            <Stack gap={4}>
                              <Text c="dimmed" size="sm">
                                Resistance
                              </Text>
                              <Text fw={700}>
                                {formatDecimalString(item.supportResistance?.resistance?.toString())}
                              </Text>
                            </Stack>
                          </Stack>
                        </Card>
                      ))}
                    </SimpleGrid>
                  </Stack>
                </Paper>

                <AnalysisDisclaimer />

                <AppFooter />
              </>
            ) : null}
          </Stack>
        </Container>
      </Box>
    </>
  );
}
