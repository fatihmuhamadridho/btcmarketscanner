import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { formatDecimalString } from '@utils/format-number.util';
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
import type { CoinPageProps, CoinAutoBotTimeframeSummary, CoinSetupPreferred } from '../interface/CoinView.interface';
import type { TrendCandle } from '../interface/CoinLogic.interface';

export { MARKET_STRUCTURE_TERMS, TIMEFRAMES, formatDate, formatDistanceFromEntry, formatPriceLevel, formatPriceZone, formatSignedPercent };

const MARKET_STRUCTURE_WINDOW_SIZES: Record<MarketStructureTerm, number> = {
  short: 20,
  medium: 50,
  long: 100,
};

const EXECUTION_TIMEFRAMES: CoinTimeframe[] = ['1m', '5m', '15m', '30m', '1h', '4h'];
const EXECUTION_TIMEFRAME_PRIORITY: Record<CoinTimeframe, number> = {
  '1m': 1,
  '5m': 2,
  '15m': 3,
  '30m': 4,
  '1h': 5,
  '4h': 6,
  '1d': 7,
};

function formatExecutionTimeframeLabel(interval: CoinTimeframe) {
  switch (interval) {
    case '1m':
      return '1m';
    case '5m':
      return '5m';
    case '15m':
      return '15m';
    case '30m':
      return '30m';
    case '1h':
      return '1H';
    case '4h':
      return '4H';
    default:
      return interval;
  }
}

function getConsensusSetupSummaries(
  entries: Array<{
    interval: CoinTimeframe;
    longSetup: ReturnType<typeof analyzeSetupSide>;
    shortSetup: ReturnType<typeof analyzeSetupSide>;
    ema100: number | null;
    ema20: number | null;
    ema200: number | null;
    ema50: number | null;
    trendLabel: string;
    trendColor: 'teal' | 'red' | 'gray';
    trendSummary: ReturnType<typeof analyzeTrend>;
  }>
): {
  consensusSetup: ReturnType<typeof analyzeSetupSide>;
  summaries: CoinAutoBotTimeframeSummary[];
  executionConsensusLabel: string;
} {
  const rankedEntries = entries.map((item) => {
    const chosenSetup = item.longSetup.gradeRank >= item.shortSetup.gradeRank ? item.longSetup : item.shortSetup;

    return {
      chosenSetup,
      interval: item.interval,
      ema100: item.trendSummary.ema100,
      ema20: item.trendSummary.ema20,
      ema200: item.trendSummary.ema200,
      ema50: item.trendSummary.ema50,
      trendColor: item.trendColor,
      trendLabel: item.trendLabel,
    };
  });

  const consensusCandidate = [...rankedEntries].sort(
    (left, right) =>
      right.chosenSetup.gradeRank - left.chosenSetup.gradeRank ||
      EXECUTION_TIMEFRAME_PRIORITY[right.interval] - EXECUTION_TIMEFRAME_PRIORITY[left.interval]
  )[0];

  const summaries = rankedEntries.map((item) => {
    const chosenSetup = item.chosenSetup;

    return {
      direction: chosenSetup.direction,
      atrLabel: chosenSetup.atr14 !== null ? formatPriceLevel(chosenSetup.atr14) : 'n/a',
      ema20Label: item.ema20 !== null ? formatPriceLevel(item.ema20) : 'n/a',
      ema50Label: item.ema50 !== null ? formatPriceLevel(item.ema50) : 'n/a',
      ema100Label: item.ema100 !== null ? formatPriceLevel(item.ema100) : 'n/a',
      ema200Label: item.ema200 !== null ? formatPriceLevel(item.ema200) : 'n/a',
      entryZoneLabel: formatPriceZone(chosenSetup.entryZone),
      interval: item.interval,
      isConsensus:
        consensusCandidate?.interval === item.interval && consensusCandidate.chosenSetup.label === chosenSetup.label,
      marketConditionLabel: chosenSetup.marketCondition,
      rsiLabel: chosenSetup.rsi14 !== null ? chosenSetup.rsi14.toFixed(2) : 'n/a',
      riskRewardLabel: chosenSetup.riskReward !== null ? `1:${formatDecimalString(chosenSetup.riskReward.toFixed(2))}` : 'n/a',
      setupGrade: chosenSetup.grade,
      setupLabel: chosenSetup.label,
      stopLossLabel: formatPriceLevel(chosenSetup.stopLoss),
      takeProfitLabels: chosenSetup.takeProfits.map((takeProfit) => ({
        label: takeProfit.label,
        valueLabel: formatPriceLevel(takeProfit.price),
      })),
      trendColor: item.trendColor,
      trendLabel: item.trendLabel,
    };
  });

  return {
    consensusSetup: consensusCandidate?.chosenSetup ?? entries[0]?.longSetup ?? entries[0]?.shortSetup,
    executionConsensusLabel: consensusCandidate?.chosenSetup.label ?? 'Consensus setup',
    summaries,
  };
}

export function useCoinDetailPageLogic(initialSymbol?: CoinPageProps['symbol']) {
  const router = useRouter();
  const symbolParam = router.query.symbol;
  const symbol = typeof symbolParam === 'string' ? symbolParam : initialSymbol;
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
  const executionCandles1m = useFuturesMarketSymbolInitialCandles(symbol, '1m');
  const executionCandles5m = useFuturesMarketSymbolInitialCandles(symbol, '5m');
  const executionCandles15m = useFuturesMarketSymbolInitialCandles(symbol, '15m');
  const executionCandles30m = useFuturesMarketSymbolInitialCandles(symbol, '30m');
  const executionCandles1h = useFuturesMarketSymbolInitialCandles(symbol, '1h');
  const executionCandles4h = useFuturesMarketSymbolInitialCandles(symbol, '4h');
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
  const executionSnapshots = useMemo<Array<{ candles: TrendCandle[]; interval: CoinTimeframe }>>(
    () => [
      { interval: '1m', candles: executionCandles1m.data?.data ?? [] },
      { interval: '5m', candles: executionCandles5m.data?.data ?? [] },
      { interval: '15m', candles: executionCandles15m.data?.data ?? [] },
      { interval: '30m', candles: executionCandles30m.data?.data ?? [] },
      { interval: '1h', candles: executionCandles1h.data?.data ?? [] },
      { interval: '4h', candles: executionCandles4h.data?.data ?? [] },
    ],
    [
      executionCandles1m.data?.data,
      executionCandles5m.data?.data,
      executionCandles15m.data?.data,
      executionCandles30m.data?.data,
      executionCandles1h.data?.data,
      executionCandles4h.data?.data,
    ]
  );
  const executionSummaryResult = useMemo(
    () =>
      getConsensusSetupSummaries(
        executionSnapshots.map(({ interval: executionTimeframe, candles }) => {
          const supportResistance =
            timeframeSupportResistance.find((item) => item.interval === executionTimeframe)?.supportResistance ?? null;
          const trend = analyzeTrend(candles, supportResistance);

          return {
            interval: executionTimeframe,
            longSetup: analyzeSetupSide('long', candles, trend, supportResistance),
            shortSetup: analyzeSetupSide('short', candles, trend, supportResistance),
            ema20: trend.ema20,
            ema50: trend.ema50,
            ema100: trend.ema100,
            ema200: trend.ema200,
            trendColor: trend.color,
            trendLabel: trend.label,
            trendSummary: trend,
          };
        })
      ),
    [executionSnapshots, timeframeSupportResistance]
  );

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
    executionConsensusSetup: executionSummaryResult.consensusSetup,
    executionTimeframeSummaries: executionSummaryResult.summaries,
    executionBasisLabel: EXECUTION_TIMEFRAMES.map(formatExecutionTimeframeLabel).join(' • '),
    executionConsensusLabel: executionSummaryResult.executionConsensusLabel,
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
