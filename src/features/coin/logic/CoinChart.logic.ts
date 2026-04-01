import { useMemo } from 'react';
import type { TimeframeSupportResistance } from '@core/binance/futures/market/infrastructure/futuresMarket.hook';
import type { FuturesKlineCandle } from '@core/binance/futures/market/domain/futuresMarket.model';
import type { CoinTimeframe } from '../interface/CoinView.interface';
import { formatChartTime, formatPercent, formatSignedDecimal } from './CoinChartFormat.logic';
import { createMovingAverageSeries, createPriceSeries, getMovingAverageValueAtIndex, getStructureSeries } from './CoinChartSeries.logic';
import { useCoinChartLifecycle } from './CoinChartLifecycle.logic';

export type { CoinTimeframe } from '../interface/CoinView.interface';

type CoinChartProps = {
  candles: FuturesKlineCandle[];
  chartError?: string | null;
  interval: CoinTimeframe;
  intervals: ReadonlyArray<{
    label: string;
    value: CoinTimeframe;
  }>;
  hasMoreOlderCandles: boolean;
  isLoadingCandles: boolean;
  isLoadingMore: boolean;
  onLoadOlderCandles: (beforeOpenTime: number) => Promise<boolean>;
  onIntervalChange: (interval: CoinTimeframe) => void;
  supportResistance: {
    support: number;
    resistance: number;
  } | null;
  strongSupportResistanceLevel: TimeframeSupportResistance | null;
  symbol: string;
};

export function useCoinChartLogic(props: CoinChartProps) {
  const {
    candles,
    chartError,
    interval,
    intervals,
    hasMoreOlderCandles,
    isLoadingCandles,
    isLoadingMore,
    onLoadOlderCandles,
    onIntervalChange,
    supportResistance,
    strongSupportResistanceLevel,
  } = props;

  const chartData = useMemo(() => createPriceSeries(candles), [candles]);
  const ma10Data = useMemo(() => createMovingAverageSeries(chartData, 10), [chartData]);
  const ma50Data = useMemo(() => createMovingAverageSeries(chartData, 50), [chartData]);
  const ma100Data = useMemo(() => createMovingAverageSeries(chartData, 100), [chartData]);
  const ma200Data = useMemo(() => createMovingAverageSeries(chartData, 200), [chartData]);
  const structureSeries = useMemo(() => getStructureSeries(chartData, 3), [chartData]);
  const lifecycle = useCoinChartLifecycle({
    candles,
    chartData,
    hasMoreOlderCandles,
    interval,
    isLoadingMore,
    ma100Data,
    ma10Data,
    ma200Data,
    ma50Data,
    onLoadOlderCandles,
    strongSupportResistanceLevel,
    structureSeries,
    supportResistance,
  });

  const displayedCandle = lifecycle.displayedCandle;
  const displayedCandleIndex = displayedCandle
    ? chartData.findIndex((candle) => Number(candle.time) === displayedCandle.time)
    : -1;
  const ma10Value = getMovingAverageValueAtIndex(chartData, 10, displayedCandleIndex);
  const ma50Value = getMovingAverageValueAtIndex(chartData, 50, displayedCandleIndex);
  const ma100Value = getMovingAverageValueAtIndex(chartData, 100, displayedCandleIndex);
  const ma200Value = getMovingAverageValueAtIndex(chartData, 200, displayedCandleIndex);

  return {
    chartData,
    chartError,
    containerRef: lifecycle.containerRef,
    displayedCandle,
    formatChartTime,
    formatPercent,
    formatSignedDecimal,
    hasMoreOlderCandles: lifecycle.hasMoreOlderCandles,
    interval,
    intervals,
    isLoadingCandles,
    isLoadingMore: lifecycle.isLoadingMore,
    ma10Value,
    ma50Value,
    ma100Value,
    ma200Value,
    onIntervalChange,
    priceScaleOverlayRef: lifecycle.priceScaleOverlayRef,
    wrapperRef: lifecycle.wrapperRef,
  };
}

export type CoinChartViewModel = ReturnType<typeof useCoinChartLogic>;
