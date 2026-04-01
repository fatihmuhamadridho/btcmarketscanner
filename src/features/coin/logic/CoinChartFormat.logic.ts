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
