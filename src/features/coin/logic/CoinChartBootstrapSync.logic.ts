import { useEffect } from 'react';
import type { CoinChartBootstrapProps } from '../interface/CoinChart.interface';

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
  priceScaleWheelDeltaRef,
  priceScaleZoomRef,
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
  | 'priceScaleWheelDeltaRef'
  | 'priceScaleZoomRef'
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

      const overlay = priceScaleOverlayRef.current;
      const overlayRect = overlay?.getBoundingClientRect();
      const isPriceArea = overlayRect ? event.clientX >= overlayRect.left : false;

      event.preventDefault();
      event.stopPropagation();

      const normalizedHorizontalDelta = normalizeWheelDeltaX(event, wrapper.clientWidth);
      const normalizedDelta = normalizeWheelDelta(event, wrapper.clientHeight);
      const horizontalMagnitude = Math.abs(normalizedHorizontalDelta);
      const verticalMagnitude = Math.abs(normalizedDelta);
      const zoomStepThreshold = 10;
      const zoomStep = 1.02;

      if (isPriceArea) {
        priceScaleWheelDeltaRef.current += normalizedDelta;

        let nextZoom = priceScaleZoomRef.current;
        let shouldApply = false;

        while (priceScaleWheelDeltaRef.current <= -zoomStepThreshold) {
          nextZoom = nextZoom * zoomStep;
          priceScaleWheelDeltaRef.current += zoomStepThreshold;
          shouldApply = true;
        }

        while (priceScaleWheelDeltaRef.current >= zoomStepThreshold) {
          nextZoom = nextZoom / zoomStep;
          priceScaleWheelDeltaRef.current -= zoomStepThreshold;
          shouldApply = true;
        }

        if (!shouldApply) {
          return;
        }

        const previousZoom = priceScaleZoomRef.current;
        priceScaleZoomRef.current = nextZoom;
        seriesRef.current?.priceScale().applyOptions({ autoScale: false });

        applyPriceScaleRangeRef.current({
          scale: previousZoom / nextZoom,
        });

        return;
      }

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
    applyPriceScaleRangeRef,
    chartRef,
    priceScaleOverlayRef,
    priceScaleWheelDeltaRef,
    priceScaleZoomRef,
    seriesRef,
    timeScaleWheelDeltaRef,
    timeScaleZoomRef,
    wrapperRef,
  ]);
}
