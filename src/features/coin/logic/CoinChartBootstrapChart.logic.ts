import { useEffect } from 'react';
import type { MutableRefObject, RefObject } from 'react';
import type {
  CandlestickData,
  IChartApi,
  ISeriesApi,
  ISeriesMarkersPluginApi,
  LogicalRange,
  Time,
  UTCTimestamp,
} from 'lightweight-charts';
import { LineStyle, createSeriesMarkers } from 'lightweight-charts';
import type { FuturesKlineCandle } from '@core/binance/futures/market/domain/futuresMarket.model';
import type { CoinChartActiveCandle, CoinChartCrosshairEvent } from '../interface/CoinChart.interface';

type CoinChartBootstrapChartProps = {
  candlesRef: MutableRefObject<FuturesKlineCandle[]>;
  chartRef: MutableRefObject<IChartApi | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  hasMoreOlderCandlesRef: MutableRefObject<boolean>;
  isLoadingMoreRef: MutableRefObject<boolean>;
  isProgrammaticRangeChangeRef: MutableRefObject<boolean>;
  ma100SeriesRef: MutableRefObject<ISeriesApi<'Line'> | null>;
  ma10SeriesRef: MutableRefObject<ISeriesApi<'Line'> | null>;
  ma200SeriesRef: MutableRefObject<ISeriesApi<'Line'> | null>;
  ma50SeriesRef: MutableRefObject<ISeriesApi<'Line'> | null>;
  onLoadOlderCandlesRef: MutableRefObject<(beforeOpenTime: number) => Promise<boolean>>;
  pendingRangeRef: MutableRefObject<LogicalRange | null>;
  pivotHighSeriesRef: MutableRefObject<ISeriesApi<'Line'> | null>;
  pivotLowSeriesRef: MutableRefObject<ISeriesApi<'Line'> | null>;
  requestedBeforeOpenTimeRef: MutableRefObject<number | null>;
  seriesRef: MutableRefObject<ISeriesApi<'Candlestick'> | null>;
  setHoveredCandle: (candle: CoinChartActiveCandle | null) => void;
  setIsChartReady: (value: boolean) => void;
  shouldFollowLatestRef: MutableRefObject<boolean>;
  structureMarkersRef: MutableRefObject<ISeriesMarkersPluginApi<Time> | null>;
};

export function useCoinChartBootstrapChart({
  candlesRef,
  chartRef,
  containerRef,
  hasMoreOlderCandlesRef,
  isLoadingMoreRef,
  isProgrammaticRangeChangeRef,
  ma100SeriesRef,
  ma10SeriesRef,
  ma200SeriesRef,
  ma50SeriesRef,
  onLoadOlderCandlesRef,
  pendingRangeRef,
  pivotHighSeriesRef,
  pivotLowSeriesRef,
  requestedBeforeOpenTimeRef,
  seriesRef,
  setHoveredCandle,
  setIsChartReady,
  shouldFollowLatestRef,
  structureMarkersRef,
}: CoinChartBootstrapChartProps) {
  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return undefined;
    }

    let chart: IChartApi | null = null;
    let series: ISeriesApi<'Candlestick'> | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let cancelled = false;
    let handleCrosshairMove: ((param: CoinChartCrosshairEvent) => void) | null = null;

    const handleVisibleRangeChange = (range: LogicalRange | null) => {
      if (!range || !chartRef.current) {
        return;
      }

      if (isProgrammaticRangeChangeRef.current) {
        return;
      }

      const isAtLatest = chartRef.current.timeScale().scrollPosition() <= 0.5;
      if (!isAtLatest) {
        shouldFollowLatestRef.current = false;
      }

      if (!isAtLatest) {
        return;
      }

      if (range.from > 8) {
        return;
      }

      if (isLoadingMoreRef.current || !hasMoreOlderCandlesRef.current) {
        return;
      }

      const firstCandle = candlesRef.current[0];

      if (!firstCandle) {
        return;
      }

      if (requestedBeforeOpenTimeRef.current === firstCandle.openTime) {
        return;
      }

      requestedBeforeOpenTimeRef.current = firstCandle.openTime;
      pendingRangeRef.current = range;

      void (async () => {
        const loaded = await onLoadOlderCandlesRef.current(firstCandle.openTime);

        if (!loaded) {
          requestedBeforeOpenTimeRef.current = null;
          pendingRangeRef.current = null;
        }
      })();
    };

    const initChart = async () => {
      const { CandlestickSeries, LineSeries, createChart } = await import('lightweight-charts');

      if (cancelled || !container) {
        return;
      }

      chart = createChart(container, {
        autoSize: true,
        layout: {
          background: { color: 'transparent' },
          textColor: 'rgba(255,255,255,0.7)',
        },
        grid: {
          vertLines: { color: 'rgba(255,255,255,0.06)' },
          horzLines: { color: 'rgba(255,255,255,0.06)' },
        },
        handleScale: {
          mouseWheel: true,
          pinch: true,
          axisPressedMouseMove: false,
          axisDoubleClickReset: false,
        },
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
          horzTouchDrag: true,
          vertTouchDrag: true,
        },
        rightPriceScale: {
          autoScale: true,
          borderColor: 'rgba(255,255,255,0.08)',
        },
        timeScale: {
          rightOffset: 0,
          borderColor: 'rgba(255,255,255,0.08)',
          timeVisible: true,
          secondsVisible: false,
        },
        crosshair: {
          vertLine: {
            color: 'rgba(87, 199, 166, 0.45)',
          },
          horzLine: {
            color: 'rgba(87, 199, 166, 0.45)',
          },
        },
      });

      series = chart.addSeries(CandlestickSeries, {
        upColor: 'rgba(87, 199, 166, 1)',
        downColor: 'rgba(237, 85, 101, 1)',
        borderVisible: false,
        wickVisible: true,
      });

      ma10SeriesRef.current = chart.addSeries(LineSeries, {
        color: 'rgba(255, 189, 90, 1)',
        lineWidth: 1,
        lastValueVisible: true,
        priceLineVisible: false,
      });
      ma50SeriesRef.current = chart.addSeries(LineSeries, {
        color: 'rgba(255, 92, 168, 1)',
        lineWidth: 1,
        lastValueVisible: true,
        priceLineVisible: false,
      });
      ma100SeriesRef.current = chart.addSeries(LineSeries, {
        color: 'rgba(159, 122, 234, 1)',
        lineWidth: 1,
        lastValueVisible: true,
        priceLineVisible: false,
      });
      ma200SeriesRef.current = chart.addSeries(LineSeries, {
        color: 'rgba(119, 110, 255, 1)',
        lineWidth: 1,
        lastValueVisible: true,
        priceLineVisible: false,
      });
      pivotHighSeriesRef.current = chart.addSeries(LineSeries, {
        color: 'rgba(251, 146, 60, 0.95)',
        lineWidth: 3,
        lineStyle: LineStyle.Solid,
        lastValueVisible: false,
        priceLineVisible: false,
      });
      pivotLowSeriesRef.current = chart.addSeries(LineSeries, {
        color: 'rgba(103, 232, 249, 0.95)',
        lineWidth: 3,
        lineStyle: LineStyle.Solid,
        lastValueVisible: false,
        priceLineVisible: false,
      });
      structureMarkersRef.current = createSeriesMarkers(series, [], {
        autoScale: true,
        zOrder: 'top',
      });

      handleCrosshairMove = ({ seriesData }) => {
        const candleSeries = series;

        if (!candleSeries) {
          return;
        }

        const hoveredData = seriesData.get(candleSeries) as CandlestickData<UTCTimestamp> | undefined;

        if (
          !hoveredData ||
          hoveredData.open === undefined ||
          hoveredData.high === undefined ||
          hoveredData.low === undefined ||
          hoveredData.close === undefined
        ) {
          setHoveredCandle(null);
          return;
        }

        setHoveredCandle({
          time: Number(hoveredData.time),
          open: hoveredData.open,
          high: hoveredData.high,
          low: hoveredData.low,
          close: hoveredData.close,
        });
      };

      chart.timeScale().subscribeVisibleLogicalRangeChange(handleVisibleRangeChange);
      chart.subscribeCrosshairMove(handleCrosshairMove);

      chartRef.current = chart;
      seriesRef.current = series;

      setIsChartReady(true);

      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          chart?.applyOptions({ width: container.clientWidth });
        });

        resizeObserver.observe(container);
      }
    };

    void initChart();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      if (chart) {
        chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleVisibleRangeChange);
        if (handleCrosshairMove) {
          chart.unsubscribeCrosshairMove(handleCrosshairMove);
        }
      }
      setIsChartReady(false);
      seriesRef.current = null;
      ma10SeriesRef.current = null;
      ma50SeriesRef.current = null;
      ma100SeriesRef.current = null;
      ma200SeriesRef.current = null;
      pivotHighSeriesRef.current = null;
      pivotLowSeriesRef.current = null;
      structureMarkersRef.current = null;
      chartRef.current?.remove();
      chartRef.current = null;
      chart = null;
      series = null;
    };
  }, [
    candlesRef,
    chartRef,
    containerRef,
    hasMoreOlderCandlesRef,
    isLoadingMoreRef,
    isProgrammaticRangeChangeRef,
    ma100SeriesRef,
    ma10SeriesRef,
    ma200SeriesRef,
    ma50SeriesRef,
    onLoadOlderCandlesRef,
    pendingRangeRef,
    pivotHighSeriesRef,
    pivotLowSeriesRef,
    requestedBeforeOpenTimeRef,
    seriesRef,
    setHoveredCandle,
    setIsChartReady,
    shouldFollowLatestRef,
    structureMarkersRef,
  ]);
}
