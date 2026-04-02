import type { MutableRefObject, RefObject } from 'react';
import type {
  IChartApi,
  ISeriesApi,
  ISeriesMarkersPluginApi,
  LogicalRange,
  MouseEventParams,
  Time,
} from 'lightweight-charts';
import type { FuturesKlineCandle } from '@core/binance/futures/market/domain/futuresMarket.model';
import type { CoinTimeframe } from './CoinView.interface';

export type CoinChartActiveCandle = {
  close: number;
  high: number;
  low: number;
  open: number;
  time: number;
};

export type CoinChartBootstrapProps = {
  candles: FuturesKlineCandle[];
  containerRef: RefObject<HTMLDivElement | null>;
  interval: CoinTimeframe;
  priceScaleOverlayRef: RefObject<HTMLDivElement | null>;
  priceScaleLatestPriceRef: MutableRefObject<number | null>;
  priceScaleAverageCandleRangeRef: MutableRefObject<number | null>;
  wrapperRef: RefObject<HTMLDivElement | null>;
  isLoadingMore: boolean;
  hasMoreOlderCandles: boolean;
  onLoadOlderCandles: (beforeOpenTime: number) => Promise<boolean>;
  chartRef: MutableRefObject<IChartApi | null>;
  seriesRef: MutableRefObject<ISeriesApi<'Candlestick'> | null>;
  ma10SeriesRef: MutableRefObject<ISeriesApi<'Line'> | null>;
  ma50SeriesRef: MutableRefObject<ISeriesApi<'Line'> | null>;
  ma100SeriesRef: MutableRefObject<ISeriesApi<'Line'> | null>;
  ma200SeriesRef: MutableRefObject<ISeriesApi<'Line'> | null>;
  pivotHighSeriesRef: MutableRefObject<ISeriesApi<'Line'> | null>;
  pivotLowSeriesRef: MutableRefObject<ISeriesApi<'Line'> | null>;
  structureMarkersRef: MutableRefObject<ISeriesMarkersPluginApi<Time> | null>;
  setHoveredCandle: (candle: CoinChartActiveCandle | null) => void;
  setIsChartReady: (value: boolean) => void;
  candlesRef: MutableRefObject<FuturesKlineCandle[]>;
  onLoadOlderCandlesRef: MutableRefObject<(beforeOpenTime: number) => Promise<boolean>>;
  hasMoreOlderCandlesRef: MutableRefObject<boolean>;
  isLoadingMoreRef: MutableRefObject<boolean>;
  requestedBeforeOpenTimeRef: MutableRefObject<number | null>;
  pendingRangeRef: MutableRefObject<LogicalRange | null>;
  isProgrammaticRangeChangeRef: MutableRefObject<boolean>;
  priceScaleZoomRef: MutableRefObject<number>;
  priceScaleWheelDeltaRef: MutableRefObject<number>;
  timeScaleWheelDeltaRef: MutableRefObject<number>;
  timeScaleZoomRef: MutableRefObject<number>;
  applyPriceScaleRangeRef: MutableRefObject<(options?: { scale?: number }) => void>;
  shouldFollowLatestRef: MutableRefObject<boolean>;
};

export type CoinChartCrosshairEvent = MouseEventParams<Time>;
