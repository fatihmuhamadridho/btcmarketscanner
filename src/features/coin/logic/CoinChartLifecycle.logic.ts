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
import { getDefaultPriceScaleConfig, getDefaultVisibleBars } from './CoinChartFormat.logic';
import { useCoinChartBootstrap } from './CoinChartBootstrap.logic';
import { useCoinChartLifecycleSync } from './CoinChartLifecycleSync.logic';
import { useCoinChartPriceLines } from './CoinChartPriceLines.logic';

export type CoinChartLifecycleProps = {
  candles: FuturesKlineCandle[];
  chartData: CandlestickData<UTCTimestamp>[];
  chartSeriesData: Array<CandlestickData<UTCTimestamp> | { time: UTCTimestamp }>;
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
  symbol: string;
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
  chartSeriesData,
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
  symbol,
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
  const chartDataRef = useRef(chartData);
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
  const timeScaleZoomRef = useRef(1);
  const timeScaleWheelDeltaRef = useRef(0);
  const priceScaleBaseRangeRef = useRef<{ from: number; to: number } | null>(null);
  const shouldResetPriceScaleRef = useRef(false);
  const shouldSnapToLatestRef = useRef(true);
  const shouldFollowLatestRef = useRef(true);
  const isMountedRef = useRef(true);
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

  useEffect(() => {
    chartDataRef.current = chartData;
  }, [chartData]);

  syncPriceScaleRangeRef.current = (data = chartDataRef.current) => {
    if (data.length === 0) {
      priceScaleBaseRangeRef.current = null;
      return;
    }

    const config = getDefaultPriceScaleConfig(interval);
    const windowSize = Math.min(data.length, config.bars);
    const windowData = data.slice(-windowSize);

    const minPrice = windowData.reduce((min, candle) => Math.min(min, candle.low), Number.POSITIVE_INFINITY);
    const maxPrice = windowData.reduce((max, candle) => Math.max(max, candle.high), Number.NEGATIVE_INFINITY);
    const averageCandleRange =
      windowData.reduce((total, candle) => total + (candle.high - candle.low), 0) / Math.max(windowData.length, 1);
    const span = Math.max(maxPrice - minPrice, 1);
    const effectiveSpan = Math.max(span, averageCandleRange * config.candleRangeMultiplier);
    const scaledPadding = effectiveSpan * config.padding;

    priceScaleBaseRangeRef.current = {
      from: minPrice - scaledPadding,
      to: maxPrice + scaledPadding,
    };
  };

  applyPriceScaleRangeRef.current = ({ scale = 1 } = {}) => {
    if (!seriesRef.current || !priceScaleBaseRangeRef.current) {
      return;
    }

    const priceScale = seriesRef.current.priceScale();
    const baseRange = priceScaleBaseRangeRef.current;
    const currentRange = priceScale.getVisibleRange() ?? baseRange;
    const currentSpan = Math.max(currentRange.to - currentRange.from, 1);
    const nextSpan = Math.max(currentSpan * scale, 1);
    const center = (currentRange.from + currentRange.to) / 2;
    const halfSpan = nextSpan / 2;

    priceScale.setVisibleRange({
      from: center - halfSpan,
      to: center + halfSpan,
    });
  };

  scrollToLatestRef.current = () => {
    if (!chartRef.current || !isMountedRef.current) {
      return;
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!isMountedRef.current) {
          return;
        }

        const chart = chartRef.current;
        const dataLength = chartDataRef.current.length;

        if (!chart || dataLength === 0) {
          return;
        }

        const visibleBars = Math.min(getDefaultVisibleBars(interval), Math.max(dataLength - 1, 1));

        chart.timeScale().setVisibleLogicalRange({
          from: Math.max(0, dataLength - visibleBars),
          to: dataLength - 1,
        });
      });
    });
  };

  useEffect(() => {
    isMountedRef.current = true;

    didSetInitialDataRef.current = false;
    previousDataLengthRef.current = 0;
    requestedBeforeOpenTimeRef.current = null;
    pendingRangeRef.current = null;
    priceScaleZoomRef.current = 1;
    priceScaleWheelDeltaRef.current = 0;
    timeScaleZoomRef.current = 1;
    timeScaleWheelDeltaRef.current = 0;
    priceScaleBaseRangeRef.current = null;
    shouldResetPriceScaleRef.current = true;
    shouldSnapToLatestRef.current = true;
    shouldFollowLatestRef.current = true;
    setDisplayedCandle(null);

    return () => {
      isMountedRef.current = false;
    };
  }, [interval, symbol]);

  useCoinChartBootstrap({
    candles,
    candlesRef,
    containerRef,
    interval,
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
    timeScaleWheelDeltaRef,
    timeScaleZoomRef,
    wrapperRef,
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
    chartSeriesData,
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
    priceScaleZoomRef,
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
