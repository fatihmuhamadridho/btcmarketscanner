import { useEffect } from 'react';
import type { CoinChartBootstrapProps } from '../interface/CoinChart.interface';
import { getPriceScaleWheelProfile } from './CoinChartFormat.logic';

function normalizeWheelDelta(event: WheelEvent, fallbackSize: number) {
  if (event.deltaMode === WheelEvent.DOM_DELTA_PIXEL) {
    return event.deltaY;
  }

  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    return event.deltaY * 16;
  }

  return event.deltaY * fallbackSize;
}

function normalizeWheelDeltaX(event: WheelEvent, fallbackSize: number) {
  if (event.deltaMode === WheelEvent.DOM_DELTA_PIXEL) {
    return event.deltaX;
  }

  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    return event.deltaX * 16;
  }

  return event.deltaX * fallbackSize;
}

export function useCoinChartBootstrapSync({
  candles,
  candlesRef,
  hasMoreOlderCandles,
  hasMoreOlderCandlesRef,
  isLoadingMore,
  isLoadingMoreRef,
  onLoadOlderCandles,
  onLoadOlderCandlesRef,
  priceScaleOverlayRef,
  priceScaleLatestPriceRef,
  priceScaleAverageCandleRangeRef,
  timeScaleWheelDeltaRef,
  timeScaleZoomRef,
  wrapperRef,
  chartRef,
  seriesRef,
  applyPriceScaleRangeRef,
}: Pick<
  CoinChartBootstrapProps,
  | 'candles'
  | 'candlesRef'
  | 'hasMoreOlderCandles'
  | 'hasMoreOlderCandlesRef'
  | 'isLoadingMore'
  | 'isLoadingMoreRef'
  | 'onLoadOlderCandles'
  | 'onLoadOlderCandlesRef'
  | 'priceScaleOverlayRef'
  | 'priceScaleLatestPriceRef'
  | 'priceScaleAverageCandleRangeRef'
  | 'timeScaleWheelDeltaRef'
  | 'timeScaleZoomRef'
  | 'wrapperRef'
  | 'chartRef'
  | 'seriesRef'
  | 'applyPriceScaleRangeRef'
>) {
  useEffect(() => {
    candlesRef.current = candles;
  }, [candles, candlesRef]);

  useEffect(() => {
    onLoadOlderCandlesRef.current = onLoadOlderCandles;
  }, [onLoadOlderCandles, onLoadOlderCandlesRef]);

  useEffect(() => {
    hasMoreOlderCandlesRef.current = hasMoreOlderCandles;
  }, [hasMoreOlderCandles, hasMoreOlderCandlesRef]);

  useEffect(() => {
    isLoadingMoreRef.current = isLoadingMore;
  }, [isLoadingMore, isLoadingMoreRef]);

  useEffect(() => {
    let frameId: number | null = null;
    let attachedWrapper: HTMLDivElement | null = null;

    const handleWheel = (event: WheelEvent) => {
      const wrapper = attachedWrapper;
      const chart = chartRef.current;

      if (!wrapper || !chart) {
        return;
      }

      const normalizedHorizontalDelta = normalizeWheelDeltaX(event, wrapper.clientWidth);
      const normalizedDelta = normalizeWheelDelta(event, wrapper.clientHeight);
      const overlay = priceScaleOverlayRef.current;
      const overlayRect = overlay?.getBoundingClientRect();
      const isPriceArea = overlayRect ? event.clientX >= overlayRect.left : false;

      if (isPriceArea) {
        event.preventDefault();
        event.stopPropagation();

        const series = seriesRef.current;
        const currentRange = series?.priceScale().getVisibleRange();
        if (!currentRange) {
          return;
        }

        if (!series) {
          return;
        }

        const latestPrice = priceScaleLatestPriceRef.current;
        const averageCandleRange = priceScaleAverageCandleRangeRef.current;
        const profile = getPriceScaleWheelProfile(latestPrice, averageCandleRange);
        const priceScale = series.priceScale();
        priceScale.applyOptions({ autoScale: false });
        const currentSpan = Math.max(currentRange.to - currentRange.from, profile.minSpan);
        const currentCenter = (currentRange.from + currentRange.to) / 2;
        const direction = normalizedDelta >= 0 ? 1 : -1;
        const magnitude = Math.min(
          Math.max((Math.abs(normalizedDelta) / Math.max(wrapper.clientHeight, 1)) * profile.magnitudeMultiplier, 0.15),
          3
        );
        const nextSpan = Math.min(
          Math.max(currentSpan + direction * magnitude * profile.baseStep, profile.minSpan),
          profile.maxSpan
        );

        priceScale.setVisibleRange({
          from: Math.max(0, currentCenter - nextSpan / 2),
          to: currentCenter + nextSpan / 2,
        });

        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const horizontalMagnitude = Math.abs(normalizedHorizontalDelta);
      const verticalMagnitude = Math.abs(normalizedDelta);
      const zoomStepThreshold = 10;
      const zoomStep = 1.02;

      if (horizontalMagnitude > verticalMagnitude && normalizedHorizontalDelta !== 0) {
        const visibleRange = chart.timeScale().getVisibleLogicalRange();

        if (!visibleRange) {
          return;
        }

        const currentSpan = Math.max(visibleRange.to - visibleRange.from, 1);
        const deltaBars = (normalizedHorizontalDelta / Math.max(wrapper.clientWidth, 1)) * currentSpan;

        chart.timeScale().setVisibleLogicalRange({
          from: Math.max(0, visibleRange.from + deltaBars),
          to: visibleRange.to + deltaBars,
        });

        return;
      }

      timeScaleWheelDeltaRef.current += normalizedDelta;

      let nextZoom = timeScaleZoomRef.current;
      let shouldApply = false;

      while (timeScaleWheelDeltaRef.current <= -zoomStepThreshold) {
        nextZoom = nextZoom * zoomStep;
        timeScaleWheelDeltaRef.current += zoomStepThreshold;
        shouldApply = true;
      }

      while (timeScaleWheelDeltaRef.current >= zoomStepThreshold) {
        nextZoom = nextZoom / zoomStep;
        timeScaleWheelDeltaRef.current -= zoomStepThreshold;
        shouldApply = true;
      }

      if (!shouldApply) {
        return;
      }

      const visibleRange = chart.timeScale().getVisibleLogicalRange();

      if (!visibleRange) {
        return;
      }

      const previousZoom = timeScaleZoomRef.current;
      timeScaleZoomRef.current = nextZoom;

      const currentSpan = Math.max(visibleRange.to - visibleRange.from, 1);
      const nextSpan = Math.max(currentSpan * (previousZoom / nextZoom), 1);
      const center = (visibleRange.from + visibleRange.to) / 2;
      const halfSpan = nextSpan / 2;

      chart.timeScale().setVisibleLogicalRange({
        from: Math.max(0, center - halfSpan),
        to: center + halfSpan,
      });
    };

    const attach = () => {
      const wrapper = wrapperRef.current;

      if (!wrapper) {
        frameId = window.requestAnimationFrame(attach);
        return;
      }

      attachedWrapper = wrapper;
      wrapper.addEventListener('wheel', handleWheel, { passive: false });
    };

    frameId = window.requestAnimationFrame(attach);

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }

      if (attachedWrapper) {
        attachedWrapper.removeEventListener('wheel', handleWheel);
      }
    };
  }, [
    chartRef,
    priceScaleAverageCandleRangeRef,
    priceScaleOverlayRef,
    priceScaleLatestPriceRef,
    seriesRef,
    timeScaleWheelDeltaRef,
    timeScaleZoomRef,
    wrapperRef,
  ]);
}
