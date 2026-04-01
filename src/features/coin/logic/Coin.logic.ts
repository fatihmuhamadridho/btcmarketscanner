import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import {
  useFuturesMarketSymbolCandles,
  useFuturesMarketSymbolInitialCandles,
  useFuturesMarketSymbolSnapshot,
  useFuturesMarketTimeframeSupportResistance,
} from '@core/binance/futures/market/infrastructure/futuresMarket.hook';
import {
  MARKET_STRUCTURE_TERMS,
  TIMEFRAMES,
  formatDate,
  formatDistanceFromEntry,
  formatPriceLevel,
  formatPriceZone,
  formatSignedPercent,
} from './CoinFormat.logic';
import { analyzeSetupSide } from './CoinSetup.logic';
import { analyzeTrend } from './CoinTrend.logic';
import type { CoinTimeframe, MarketStructureTerm } from './CoinFormat.logic';
import type { CoinSetupPreferred } from '../interface/CoinView.interface';

export { MARKET_STRUCTURE_TERMS, TIMEFRAMES, formatDate, formatDistanceFromEntry, formatPriceLevel, formatPriceZone, formatSignedPercent };

const MARKET_STRUCTURE_WINDOW_SIZES: Record<MarketStructureTerm, number> = {
  short: 20,
  medium: 50,
  long: 100,
};

export function useCoinDetailPageLogic() {
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
  const preferredSetup: CoinSetupPreferred = longSetup.gradeRank >= shortSetup.gradeRank ? longSetup : shortSetup;
  const TrendIcon = trendSummary.icon;

  return {
    candles,
    candlesError,
    detail,
    formatDate,
    formatDistanceFromEntry,
    formatPriceLevel,
    formatPriceZone,
    formatSignedPercent,
    hasMoreOlderCandles,
    interval,
    isLoadingMore,
    isLoadingCandles: isFetchingInitialCandles,
    isPageLoading,
    loadOlderCandles,
    longSetup,
    marketSymbol,
    pageError,
    preferredSetup,
    selectedTimeframeSupportResistance,
    setInterval,
    setStructureTerm,
    shortSetup,
    strongSupportResistanceLevel,
    symbol,
    symbolInfo,
    timeframeSupportResistance,
    timeframes: TIMEFRAMES,
    trendSummary,
    TrendIcon,
    structureTerm,
    structureTerms: MARKET_STRUCTURE_TERMS,
  };
}

export type CoinDetailPageViewModel = ReturnType<typeof useCoinDetailPageLogic>;
