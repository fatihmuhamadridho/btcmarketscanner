import { formatDecimalString } from '@utils/format-number.util';
import type { CoinTimeframe } from '../interface/CoinView.interface';

export function formatChartTime(value?: number) {
  if (!value) {
    return 'n/a';
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

export function formatPercent(value: number) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatSignedDecimal(value: number) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatDecimalString(Math.abs(value).toFixed(2))}`;
}

export function getChartPriceDecimals(value: number) {
  if (!Number.isFinite(value)) {
    return 2;
  }

  if (value >= 1) {
    return 2;
  }

  if (value >= 0.1) {
    return 4;
  }

  if (value >= 0.01) {
    return 5;
  }

  return 6;
}

export function formatChartPrice(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'n/a';
  }

  return formatDecimalString(value.toFixed(getChartPriceDecimals(value)));
}

export function formatChartSignedPrice(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'n/a';
  }

  const sign = value > 0 ? '+' : '';

  return `${sign}${formatChartPrice(Math.abs(value))}`;
}

export function getDefaultVisibleBars(interval: CoinTimeframe) {
  switch (interval) {
    case '1m':
      return 120;
    case '5m':
      return 120;
    case '15m':
      return 110;
    case '30m':
      return 100;
    case '1h':
      return 90;
    case '4h':
      return 80;
    case '1d':
    default:
      return 70;
  }
}

export function getDefaultRightOffset(interval: CoinTimeframe) {
  switch (interval) {
    case '1m':
      return 120;
    case '5m':
      return 96;
    case '15m':
      return 84;
    case '30m':
      return 72;
    case '1h':
      return 60;
    case '4h':
      return 48;
    case '1d':
    default:
      return 36;
  }
}

export function getDefaultPriceScaleConfig(interval: CoinTimeframe) {
  switch (interval) {
    case '1m':
      return { bars: 180, padding: 0.18, candleRangeMultiplier: 26 };
    case '5m':
      return { bars: 150, padding: 0.16, candleRangeMultiplier: 22 };
    case '15m':
      return { bars: 120, padding: 0.15, candleRangeMultiplier: 18 };
    case '30m':
      return { bars: 100, padding: 0.14, candleRangeMultiplier: 16 };
    case '1h':
      return { bars: 80, padding: 0.13, candleRangeMultiplier: 12 };
    case '4h':
      return { bars: 60, padding: 0.11, candleRangeMultiplier: 10 };
    case '1d':
    default:
      return { bars: 20, padding: 0.08, candleRangeMultiplier: 6 };
  }
}

export function getPriceScaleWheelProfile(latestPrice: number | null, averageCandleRange: number | null) {
  const safeLatestPrice = latestPrice !== null && Number.isFinite(latestPrice) ? latestPrice : null;
  const safeAverageRange = averageCandleRange !== null && Number.isFinite(averageCandleRange) ? averageCandleRange : 0;

  if (safeLatestPrice === null || safeLatestPrice <= 0) {
    return {
      baseStep: 1,
      maxSpan: 100,
      minSpan: 1,
      magnitudeMultiplier: 2,
    };
  }

  if (safeLatestPrice < 1) {
    const baseStep = Math.max(safeAverageRange * 0.2, safeLatestPrice * 0.0001, 0.00001);

    return {
      baseStep,
      maxSpan: baseStep * 120,
      minSpan: baseStep * 6,
      magnitudeMultiplier: 4,
    };
  }

  if (safeLatestPrice < 1000) {
    const baseStep = Math.max(safeAverageRange * 0.16, safeLatestPrice * 0.00008, 0.05);

    return {
      baseStep,
      maxSpan: baseStep * 140,
      minSpan: baseStep * 6,
      magnitudeMultiplier: 3.2,
    };
  }

  const baseStep = Math.max(safeAverageRange * 0.12, safeLatestPrice * 0.00005, 1);

  return {
    baseStep,
    maxSpan: baseStep * 140,
    minSpan: baseStep * 6,
    magnitudeMultiplier: 3,
  };
}
