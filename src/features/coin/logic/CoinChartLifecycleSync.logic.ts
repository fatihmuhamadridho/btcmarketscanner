import { useEffect } from 'react';
import type { LineData, SeriesMarker, Time, UTCTimestamp } from 'lightweight-charts';
import type { MutableRefObject as ReactMutableRefObject } from 'react';

type CoinChartLifecycleSyncProps = {
  chartData: Array<{
    close: number;
    high: number;
    low: number;
    open: number;
    time: UTCTimestamp;
  }>;
  isChartReady: boolean;
  ma10Data: LineData<UTCTimestamp>[];
  ma50Data: LineData<UTCTimestamp>[];
  ma100Data: LineData<UTCTimestamp>[];
  ma200Data: LineData<UTCTimestamp>[];
  structureSeries: {
    markers: Array<SeriesMarker<Time>>;
    pivotHighSeries: LineData<UTCTimestamp>[];
    pivotLowSeries: LineData<UTCTimestamp>[];
  };
  chartRef: ReactMutableRefObject<{ timeScale: () => { scrollPosition: () => number; setVisibleLogicalRange: (range: { from: number; to: number }) => void } } | null>;
  seriesRef: ReactMutableRefObject<{ setData: (data: Array<{ close: number; high: number; low: number; open: number; time: UTCTimestamp }>) => void; priceScale: () => { applyOptions: (options: { autoScale: boolean }) => void } } | null>;
  ma10SeriesRef: ReactMutableRefObject<{ setData: (data: LineData<UTCTimestamp>[]) => void } | null>;
  ma50SeriesRef: ReactMutableRefObject<{ setData: (data: LineData<UTCTimestamp>[]) => void } | null>;
  ma100SeriesRef: ReactMutableRefObject<{ setData: (data: LineData<UTCTimestamp>[]) => void } | null>;
  ma200SeriesRef: ReactMutableRefObject<{ setData: (data: LineData<UTCTimestamp>[]) => void } | null>;
  pivotHighSeriesRef: ReactMutableRefObject<{ setData: (data: LineData<UTCTimestamp>[]) => void } | null>;
  pivotLowSeriesRef: ReactMutableRefObject<{ setData: (data: LineData<UTCTimestamp>[]) => void } | null>;
  structureMarkersRef: ReactMutableRefObject<{ setMarkers: (data: Array<SeriesMarker<Time>>) => void } | null>;
  syncPriceScaleRangeRef: ReactMutableRefObject<(data?: Array<{ close: number; high: number; low: number; open: number; time: UTCTimestamp }>) => void>;
  scrollToLatestRef: ReactMutableRefObject<(() => void) | null>;
  previousDataLengthRef: ReactMutableRefObject<number>;
  didSetInitialDataRef: ReactMutableRefObject<boolean>;
  isProgrammaticRangeChangeRef: ReactMutableRefObject<boolean>;
  pendingRangeRef: ReactMutableRefObject<{ from: number; to: number } | null>;
  shouldResetPriceScaleRef: ReactMutableRefObject<boolean>;
  shouldFollowLatestRef: ReactMutableRefObject<boolean>;
};

export function useCoinChartLifecycleSync({
  chartData,
  isChartReady,
  ma10Data,
  ma50Data,
  ma100Data,
  ma200Data,
  structureSeries,
  chartRef,
  seriesRef,
  ma10SeriesRef,
  ma50SeriesRef,
  ma100SeriesRef,
  ma200SeriesRef,
  pivotHighSeriesRef,
  pivotLowSeriesRef,
  structureMarkersRef,
  syncPriceScaleRangeRef,
  scrollToLatestRef,
  previousDataLengthRef,
  didSetInitialDataRef,
  isProgrammaticRangeChangeRef,
  pendingRangeRef,
  shouldResetPriceScaleRef,
  shouldFollowLatestRef,
}: CoinChartLifecycleSyncProps) {
  useEffect(() => {
    if (!chartRef.current || !seriesRef.current || !isChartReady) {
      return;
    }

    if (chartData.length === 0) {
      seriesRef.current.setData([]);
      ma10SeriesRef.current?.setData([]);
      ma50SeriesRef.current?.setData([]);
      ma100SeriesRef.current?.setData([]);
      ma200SeriesRef.current?.setData([]);
      pivotHighSeriesRef.current?.setData([]);
      pivotLowSeriesRef.current?.setData([]);
      structureMarkersRef.current?.setMarkers([]);
      previousDataLengthRef.current = 0;
      return;
    }

    seriesRef.current.setData(chartData);
    ma10SeriesRef.current?.setData(ma10Data);
    ma50SeriesRef.current?.setData(ma50Data);
    ma100SeriesRef.current?.setData(ma100Data);
    ma200SeriesRef.current?.setData(ma200Data);
    pivotHighSeriesRef.current?.setData(structureSeries.pivotHighSeries);
    pivotLowSeriesRef.current?.setData(structureSeries.pivotLowSeries);
    structureMarkersRef.current?.setMarkers(structureSeries.markers);
    syncPriceScaleRangeRef.current(chartData);

    const shouldResetPriceScale = shouldResetPriceScaleRef.current || !didSetInitialDataRef.current;

    if (shouldResetPriceScale) {
      shouldResetPriceScaleRef.current = false;
      seriesRef.current.priceScale().applyOptions({ autoScale: true });
      scrollToLatestRef.current?.();

      if (!didSetInitialDataRef.current) {
        didSetInitialDataRef.current = true;
        isProgrammaticRangeChangeRef.current = true;
        setTimeout(() => {
          isProgrammaticRangeChangeRef.current = false;
        }, 0);
      }

      previousDataLengthRef.current = chartData.length;
      return;
    }

    const pendingRange = pendingRangeRef.current;

    if (pendingRange) {
      const addedCount = chartData.length - previousDataLengthRef.current;

      if (addedCount > 0) {
        isProgrammaticRangeChangeRef.current = true;
        chartRef.current.timeScale().setVisibleLogicalRange({
          from: pendingRange.from + addedCount,
          to: pendingRange.to + addedCount,
        });
        setTimeout(() => {
          isProgrammaticRangeChangeRef.current = false;
        }, 0);
      }

      pendingRangeRef.current = null;
    }

    const isStillAtLatest = chartRef.current.timeScale().scrollPosition() <= 0.5;

    if (shouldFollowLatestRef.current && isStillAtLatest) {
      scrollToLatestRef.current?.();
    }

    previousDataLengthRef.current = chartData.length;
  }, [
    chartData,
    isChartReady,
    ma10Data,
    ma50Data,
    ma100Data,
    ma200Data,
    structureSeries.markers,
    structureSeries.pivotHighSeries,
    structureSeries.pivotLowSeries,
    chartRef,
    didSetInitialDataRef,
    isProgrammaticRangeChangeRef,
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
    syncPriceScaleRangeRef,
  ]);
}
