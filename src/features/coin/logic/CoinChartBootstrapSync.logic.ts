import { useEffect } from 'react';
import type { CoinChartBootstrapProps } from '../interface/CoinChart.interface';

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
    const overlay = priceScaleOverlayRef.current;

    if (!overlay) {
      return undefined;
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const normalizedDelta =
        event.deltaMode === WheelEvent.DOM_DELTA_PIXEL
          ? event.deltaY
          : event.deltaMode === WheelEvent.DOM_DELTA_LINE
            ? event.deltaY * 16
            : event.deltaY * overlay.clientHeight;

      priceScaleWheelDeltaRef.current += normalizedDelta;

      const zoomStepThreshold = 10;
      const zoomStep = 1.008;
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
    };

    overlay.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      overlay.removeEventListener('wheel', handleWheel);
    };
  }, [applyPriceScaleRangeRef, priceScaleOverlayRef, priceScaleWheelDeltaRef, priceScaleZoomRef, seriesRef]);
}
