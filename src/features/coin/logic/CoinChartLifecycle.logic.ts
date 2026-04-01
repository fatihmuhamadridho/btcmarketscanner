import { useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type {
  CandlestickData,
  IChartApi,
  IPriceLine,
  ISeriesApi,
  ISeriesMarkersPluginApi,
  LineData,
  LogicalRange,
  SeriesMarker,
  Time,
  UTCTimestamp,
} from 'lightweight-charts';
import type { TimeframeSupportResistance } from '@core/binance/futures/market/infrastructure/futuresMarket.hook';
import type { FuturesKlineCandle } from '@core/binance/futures/market/domain/futuresMarket.model';
import type { CoinTimeframe } from '../interface/CoinView.interface';
import { useCoinChartBootstrap } from './CoinChartBootstrap.logic';
import { useCoinChartLifecycleSync } from './CoinChartLifecycleSync.logic';
import { useCoinChartPriceLines } from './CoinChartPriceLines.logic';

export type CoinChartLifecycleProps = {
  candles: FuturesKlineCandle[];
  chartData: CandlestickData<UTCTimestamp>[];
  hasMoreOlderCandles: boolean;
  interval: CoinTimeframe;
  isLoadingMore: boolean;
  ma10Data: LineData<UTCTimestamp>[];
  ma50Data: LineData<UTCTimestamp>[];
  ma100Data: LineData<UTCTimestamp>[];
  ma200Data: LineData<UTCTimestamp>[];
  onLoadOlderCandles: (beforeOpenTime: number) => Promise<boolean>;
  structureSeries: {
    markers: Array<SeriesMarker<Time>>;
    pivotHighSeries: LineData<UTCTimestamp>[];
    pivotLowSeries: LineData<UTCTimestamp>[];
  };
  strongSupportResistanceLevel: TimeframeSupportResistance | null;
  supportResistance: {
    support: number;
    resistance: number;
  } | null;
};

export type CoinChartLifecycleReturn = {
  chartError?: string | null;
  containerRef: RefObject<HTMLDivElement | null>;
  displayedCandle: {
    close: number;
    high: number;
    low: number;
    open: number;
    time: number;
  } | null;
  hasMoreOlderCandles: boolean;
  isChartReady: boolean;
  isLoadingCandles: boolean;
  isLoadingMore: boolean;
  priceScaleOverlayRef: RefObject<HTMLDivElement | null>;
  wrapperRef: RefObject<HTMLDivElement | null>;
  chartDataLength: number;
  chartRef: RefObject<IChartApi | null>;
  seriesRef: RefObject<ISeriesApi<'Candlestick'> | null>;
  ma10SeriesRef: RefObject<ISeriesApi<'Line'> | null>;
  ma50SeriesRef: RefObject<ISeriesApi<'Line'> | null>;
  ma100SeriesRef: RefObject<ISeriesApi<'Line'> | null>;
  ma200SeriesRef: RefObject<ISeriesApi<'Line'> | null>;
  pivotHighSeriesRef: RefObject<ISeriesApi<'Line'> | null>;
  pivotLowSeriesRef: RefObject<ISeriesApi<'Line'> | null>;
  structureMarkersRef: RefObject<ISeriesMarkersPluginApi<Time> | null>;
  supportPriceLineRef: RefObject<IPriceLine | null>;
  resistancePriceLineRef: RefObject<IPriceLine | null>;
  strongSupportPriceLineRef: RefObject<IPriceLine | null>;
  strongResistancePriceLineRef: RefObject<IPriceLine | null>;
  syncPriceScaleRangeRef: RefObject<(data?: CandlestickData<UTCTimestamp>[]) => void>;
  applyPriceScaleRangeRef: RefObject<(options?: { scale?: number }) => void>;
  scrollToLatestRef: RefObject<(() => void) | null>;
  hoveredCandleRef: RefObject<{
    close: number;
    high: number;
    low: number;
    open: number;
    time: number;
  } | null>;
};

type ActiveCandle = {
  close: number;
  high: number;
  low: number;
  open: number;
  time: number;
};

export function useCoinChartLifecycle({
  candles,
  chartData,
  hasMoreOlderCandles,
  interval,
  isLoadingMore,
  ma10Data,
  ma50Data,
  ma100Data,
  ma200Data,
  onLoadOlderCandles,
  structureSeries,
  strongSupportResistanceLevel,
  supportResistance,
}: CoinChartLifecycleProps): CoinChartLifecycleReturn {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const priceScaleOverlayRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const ma10SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ma50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ma100SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ma200SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const pivotHighSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const pivotLowSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const structureMarkersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const supportPriceLineRef = useRef<IPriceLine | null>(null);
  const resistancePriceLineRef = useRef<IPriceLine | null>(null);
  const strongSupportPriceLineRef = useRef<IPriceLine | null>(null);
  const strongResistancePriceLineRef = useRef<IPriceLine | null>(null);
  const candlesRef = useRef(candles);
  const onLoadOlderCandlesRef = useRef(onLoadOlderCandles);
  const hasMoreOlderCandlesRef = useRef(hasMoreOlderCandles);
  const isLoadingMoreRef = useRef(isLoadingMore);
  const requestedBeforeOpenTimeRef = useRef<number | null>(null);
  const pendingRangeRef = useRef<LogicalRange | null>(null);
  const previousDataLengthRef = useRef(0);
  const didSetInitialDataRef = useRef(false);
  const isProgrammaticRangeChangeRef = useRef(false);
  const priceScaleZoomRef = useRef(1);
  const priceScaleWheelDeltaRef = useRef(0);
  const shouldResetPriceScaleRef = useRef(false);
  const shouldFollowLatestRef = useRef(true);
  const [isChartReady, setIsChartReady] = useState(false);
  const syncPriceScaleRangeRef = useRef<(data?: CandlestickData<UTCTimestamp>[]) => void>(() => {});
  const applyPriceScaleRangeRef = useRef<(options?: { scale?: number }) => void>(() => {});
  const scrollToLatestRef = useRef<(() => void) | null>(null);
  const [displayedCandle, setDisplayedCandle] = useState<ActiveCandle | null>(null);
  const hoveredCandleRef = useRef<ActiveCandle | null>(displayedCandle);

  const latestCandle = useMemo(() => {
    if (chartData.length === 0) {
      return null;
    }

    const last = chartData[chartData.length - 1];

    return {
      time: Number(last.time),
      open: last.open,
      high: last.high,
      low: last.low,
      close: last.close,
    };
  }, [chartData]);

  useEffect(() => {
    setDisplayedCandle(latestCandle);
  }, [latestCandle]);

  useEffect(() => {
    hoveredCandleRef.current = displayedCandle;
  }, [displayedCandle]);

  useCoinChartBootstrap({
    candles,
    candlesRef,
    containerRef,
    hasMoreOlderCandles,
    hasMoreOlderCandlesRef,
    isLoadingMore,
    isLoadingMoreRef,
    ma100SeriesRef,
    ma10SeriesRef,
    ma200SeriesRef,
    ma50SeriesRef,
    onLoadOlderCandles,
    onLoadOlderCandlesRef,
    pendingRangeRef,
    pivotHighSeriesRef,
    pivotLowSeriesRef,
    priceScaleOverlayRef,
    priceScaleWheelDeltaRef,
    priceScaleZoomRef,
    isProgrammaticRangeChangeRef,
    requestedBeforeOpenTimeRef,
    seriesRef,
    setHoveredCandle: setDisplayedCandle,
    setIsChartReady,
    shouldFollowLatestRef,
    structureMarkersRef,
    chartRef,
    applyPriceScaleRangeRef,
  });

  useCoinChartLifecycleSync({
    chartData,
    chartRef,
    didSetInitialDataRef,
    isChartReady,
    isProgrammaticRangeChangeRef,
    ma100Data,
    ma10Data,
    ma200Data,
    ma50Data,
    ma100SeriesRef,
    ma10SeriesRef,
    ma200SeriesRef,
    ma50SeriesRef,
    pendingRangeRef,
    pivotHighSeriesRef,
    pivotLowSeriesRef,
    previousDataLengthRef,
    scrollToLatestRef,
    seriesRef,
    shouldFollowLatestRef,
    shouldResetPriceScaleRef,
    structureMarkersRef,
    structureSeries,
    syncPriceScaleRangeRef,
  });

  useCoinChartPriceLines({
    interval,
    isChartReady,
    resistancePriceLineRef,
    seriesRef,
    strongResistancePriceLineRef,
    strongSupportPriceLineRef,
    strongSupportResistanceLevel,
    supportPriceLineRef,
    supportResistance,
  });

  return {
    chartError: undefined,
    containerRef,
    displayedCandle,
    hasMoreOlderCandles,
    isChartReady,
    isLoadingCandles: false,
    isLoadingMore,
    priceScaleOverlayRef,
    wrapperRef,
    chartDataLength: chartData.length,
    chartRef,
    seriesRef,
    ma10SeriesRef,
    ma50SeriesRef,
    ma100SeriesRef,
    ma200SeriesRef,
    pivotHighSeriesRef,
    pivotLowSeriesRef,
    structureMarkersRef,
    supportPriceLineRef,
    resistancePriceLineRef,
    strongSupportPriceLineRef,
    strongResistancePriceLineRef,
    syncPriceScaleRangeRef,
    applyPriceScaleRangeRef,
    scrollToLatestRef,
    hoveredCandleRef,
  };
}
