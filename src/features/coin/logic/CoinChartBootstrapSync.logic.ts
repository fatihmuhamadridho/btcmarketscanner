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

function clampPriceRange(from: number, to: number) {
  const clampedFrom = Math.max(0, from);
  const clampedTo = Math.max(clampedFrom + Number.EPSILON, to);

  return {
    from: clampedFrom,
    to: clampedTo,
  };
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
  timeScaleWheelDeltaRef,
  timeScaleZoomRef,
  wrapperRef,
  chartRef,
  seriesRef,
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
  | 'timeScaleWheelDeltaRef'
  | 'timeScaleZoomRef'
  | 'wrapperRef'
  | 'chartRef'
  | 'seriesRef'
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
    let overlayFrameId: number | null = null;
    let attachedWrapper: HTMLDivElement | null = null;
    let attachedOverlay: HTMLDivElement | null = null;
    let wheelFrameId: number | null = null;
    let pendingNormalizedDelta = 0;
    let pendingNormalizedHorizontalDelta = 0;
    let pendingWheelEvent: WheelEvent | null = null;
    let pendingIsPriceArea = false;
    let isDraggingPriceScale = false;
    let dragStartY = 0;
    let dragStartSpan = 0;
    let dragStartCenter = 0;
    let dragPointerId: number | null = null;

    const handleOverlayPointerDown = (event: PointerEvent) => {
      const overlay = attachedOverlay;

      if (!overlay || event.button !== 0) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      isDraggingPriceScale = true;
      dragPointerId = event.pointerId;
      dragStartY = event.clientY;

      const currentRange = seriesRef.current?.priceScale().getVisibleRange();

      if (!currentRange) {
        return;
      }

      dragStartSpan = Math.max(currentRange.to - currentRange.from, Number.EPSILON);
      dragStartCenter = (currentRange.from + currentRange.to) / 2;

      try {
        overlay.setPointerCapture(event.pointerId);
      } catch {
        // Ignore pointer capture failures on transient remounts.
      }
    };

    const handleOverlayPointerMove = (event: PointerEvent) => {
      if (!isDraggingPriceScale || dragPointerId !== event.pointerId) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const overlay = attachedOverlay;

      if (!overlay) {
        return;
      }

      const deltaY = event.clientY - dragStartY;
      const ratio = deltaY / Math.max(overlay.clientHeight, 1);
      const zoomSensitivity = 1.15;
      const nextSpan = Math.max(dragStartSpan * Math.exp(ratio * zoomSensitivity), Number.EPSILON);

      const series = seriesRef.current;

      if (!series) {
        return;
      }

      const priceScale = series.priceScale();
      priceScale.applyOptions({ autoScale: false });
      priceScale.setVisibleRange(clampPriceRange(dragStartCenter - nextSpan / 2, dragStartCenter + nextSpan / 2));
    };

    const stopDrag = (event?: PointerEvent) => {
      if (event && dragPointerId !== event.pointerId) {
        return;
      }

      isDraggingPriceScale = false;
      dragPointerId = null;
      dragStartY = 0;
      dragStartSpan = 0;
      dragStartCenter = 0;
    };

    const flushWheel = () => {
      wheelFrameId = null;

      const event = pendingWheelEvent;
      const normalizedDelta = pendingNormalizedDelta;
      const normalizedHorizontalDelta = pendingNormalizedHorizontalDelta;
      const isPriceArea = pendingIsPriceArea;

      pendingWheelEvent = null;
      pendingNormalizedDelta = 0;
      pendingNormalizedHorizontalDelta = 0;
      pendingIsPriceArea = false;

      const wrapper = attachedWrapper;
      const chart = chartRef.current;

      if (!wrapper || !chart || !event) {
        return;
      }

      if (isPriceArea) {
        const series = seriesRef.current;
        const currentRange = series?.priceScale().getVisibleRange();

        if (!series || !currentRange) {
          return;
        }

        const priceScale = series.priceScale();
        priceScale.applyOptions({ autoScale: false });
        const currentSpan = Math.max(currentRange.to - currentRange.from, Number.EPSILON);
        const currentCenter = (currentRange.from + currentRange.to) / 2;
        const normalizedDeltaRatio = normalizedDelta / Math.max(wrapper.clientHeight, 1);
        const zoomSensitivity = 1.15;
        const nextSpan = Math.max(currentSpan * Math.exp(normalizedDeltaRatio * zoomSensitivity), Number.EPSILON);

        priceScale.setVisibleRange(clampPriceRange(currentCenter - nextSpan / 2, currentCenter + nextSpan / 2));

        return;
      }

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

      pendingWheelEvent = event;
      pendingNormalizedHorizontalDelta += normalizeWheelDeltaX(event, wrapper.clientWidth);
      pendingNormalizedDelta += normalizeWheelDelta(event, wrapper.clientHeight);
      pendingIsPriceArea = pendingIsPriceArea || isPriceArea;

      if (wheelFrameId === null) {
        wheelFrameId = window.requestAnimationFrame(flushWheel);
      }
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

    const attachOverlay = () => {
      const overlay = priceScaleOverlayRef.current;

      if (!overlay) {
        overlayFrameId = window.requestAnimationFrame(attachOverlay);
        return;
      }

      attachedOverlay = overlay;
      overlay.addEventListener('pointerdown', handleOverlayPointerDown);
      overlay.addEventListener('pointermove', handleOverlayPointerMove);
      overlay.addEventListener('pointerup', stopDrag);
      overlay.addEventListener('pointercancel', stopDrag);
      overlay.addEventListener('lostpointercapture', stopDrag);
    };

    frameId = window.requestAnimationFrame(attach);
    overlayFrameId = window.requestAnimationFrame(attachOverlay);

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }

      if (overlayFrameId !== null) {
        window.cancelAnimationFrame(overlayFrameId);
      }

      if (wheelFrameId !== null) {
        window.cancelAnimationFrame(wheelFrameId);
      }

      if (attachedWrapper) {
        attachedWrapper.removeEventListener('wheel', handleWheel);
      }

      if (attachedOverlay) {
        attachedOverlay.removeEventListener('pointerdown', handleOverlayPointerDown);
        attachedOverlay.removeEventListener('pointermove', handleOverlayPointerMove);
        attachedOverlay.removeEventListener('pointerup', stopDrag);
        attachedOverlay.removeEventListener('pointercancel', stopDrag);
        attachedOverlay.removeEventListener('lostpointercapture', stopDrag);
      }
    };
  }, [
    chartRef,
    priceScaleOverlayRef,
    seriesRef,
    timeScaleWheelDeltaRef,
    timeScaleZoomRef,
    wrapperRef,
  ]);
}
