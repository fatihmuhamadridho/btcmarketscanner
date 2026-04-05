import { formatDecimalString } from '@utils/format-number.util';
import type {
  CoinDistanceFromEntryFormatter,
  CoinPriceLevelFormatter,
  CoinPriceZoneFormatter,
  CoinTimeframe,
  CoinTimeframeOption,
  MarketStructureTerm,
  MarketStructureTermOption,
} from '../interface/CoinView.interface';

export const TIMEFRAMES: ReadonlyArray<CoinTimeframeOption> = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '30m', value: '30m' },
  { label: '1H', value: '1h' },
  { label: '4H', value: '4h' },
  { label: '1D', value: '1d' },
] as const;

export const MARKET_STRUCTURE_TERMS: ReadonlyArray<MarketStructureTermOption> = [
  { label: 'Short-term', value: 'short' },
  { label: 'Medium-term', value: 'medium' },
  { label: 'Long-term', value: 'long' },
] as const;

export type { CoinTimeframe, MarketStructureTerm };
export type { CoinDistanceFromEntryFormatter, CoinPriceLevelFormatter, CoinPriceZoneFormatter };

export function formatDate(value?: number) {
  if (!value) return 'n/a';

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatPriceLevel(value: number | null) {
  if (value === null) {
    return 'n/a';
  }

  const absoluteValue = Math.abs(value);
  const decimals =
    absoluteValue >= 1000 ? 2 :
    absoluteValue >= 100 ? 3 :
    absoluteValue >= 1 ? 4 :
    absoluteValue >= 0.1 ? 5 :
    absoluteValue >= 0.01 ? 6 :
    absoluteValue >= 0.001 ? 8 :
    10;

  return formatDecimalString(value.toFixed(decimals));
}

export function formatSignedPercent(value: number) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatPriceZone(zone: { high: number | null; low: number | null }) {
  if (zone.low === null || zone.high === null) {
    return 'n/a';
  }

  return `${formatPriceLevel(zone.low)} - ${formatPriceLevel(zone.high)}`;
}

export function formatDistanceFromEntry(
  price: number | null,
  entryPrice: number | null,
  direction: 'long' | 'short'
) {
  if (price === null || entryPrice === null || entryPrice === 0) {
    return 'n/a';
  }

  const rawPercent = ((price - entryPrice) / entryPrice) * 100;
  const signedPercent = direction === 'long' ? rawPercent : -rawPercent;

  return formatSignedPercent(signedPercent);
}
