import { useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Group,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { IconChartLine } from "@tabler/icons-react";
import type {
  CandlestickData,
  IChartApi,
  LineData,
  ISeriesApi,
  LogicalRange,
  MouseEventParams,
  Time,
  UTCTimestamp,
} from "lightweight-charts";
import { formatDecimalString } from "@/common/utils/format-number";
import type { FuturesKlineCandle } from "@/core/binance/futures/market/domain/models/futuresMarket.model";

type CoinTimeframe = "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d";

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
  symbol: string;
};

type ActiveCandle = {
  close: number;
  high: number;
  low: number;
  open: number;
  time: number;
};

function createPriceSeries(
  candles: FuturesKlineCandle[],
): CandlestickData<UTCTimestamp>[] {
  return candles
    .slice()
    .sort((left, right) => left.openTime - right.openTime)
    .reduce<CandlestickData<UTCTimestamp>[]>((acc, candle) => {
      const time = Math.floor(candle.openTime / 1000) as UTCTimestamp;
      const previous = acc[acc.length - 1];

      if (previous?.time === time) {
        acc[acc.length - 1] = {
          time,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        };

        return acc;
      }

      acc.push({
        time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      });

      return acc;
    }, []);
}

function createMovingAverageSeries(
  candles: CandlestickData<UTCTimestamp>[],
  period: number,
): LineData<UTCTimestamp>[] {
  if (candles.length === 0) {
    return [];
  }

  const result: LineData<UTCTimestamp>[] = [];
  const window: number[] = [];
  let sum = 0;

  candles.forEach((candle) => {
    window.push(candle.close);
    sum += candle.close;

    if (window.length > period) {
      sum -= window.shift() ?? 0;
    }

    result.push({
      time: candle.time,
      value: sum / window.length,
    });
  });

  return result;
}

function getMovingAverageValueAtIndex(
  candles: CandlestickData<UTCTimestamp>[],
  period: number,
  index: number,
) {
  if (candles.length === 0 || index < 0) {
    return null;
  }

  const effectiveIndex = Math.min(index, candles.length - 1);
  const startIndex = Math.max(0, effectiveIndex - period + 1);
  const window = candles.slice(startIndex, effectiveIndex + 1);
  const sum = window.reduce((total, candle) => total + candle.close, 0);

  return sum / Math.max(window.length, 1);
}

function formatChartTime(value?: number) {
  if (!value) {
    return "n/a";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function formatPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function formatSignedDecimal(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatDecimalString(Math.abs(value).toFixed(2))}`;
}

function getDefaultVisibleBars(interval: CoinTimeframe) {
  switch (interval) {
    case "1m":
      return 120;
    case "5m":
      return 120;
    case "15m":
      return 110;
    case "30m":
      return 100;
    case "1h":
      return 90;
    case "4h":
      return 80;
    case "1d":
    default:
      return 70;
  }
}

function getDefaultPriceScaleConfig(interval: CoinTimeframe) {
  switch (interval) {
    case "1m":
      return { bars: 180, padding: 0.18, candleRangeMultiplier: 26 };
    case "5m":
      return { bars: 150, padding: 0.16, candleRangeMultiplier: 22 };
    case "15m":
      return { bars: 120, padding: 0.15, candleRangeMultiplier: 18 };
    case "30m":
      return { bars: 100, padding: 0.14, candleRangeMultiplier: 16 };
    case "1h":
      return { bars: 80, padding: 0.13, candleRangeMultiplier: 12 };
    case "4h":
      return { bars: 60, padding: 0.11, candleRangeMultiplier: 10 };
    case "1d":
    default:
      return { bars: 20, padding: 0.08, candleRangeMultiplier: 6 };
  }
}

export default function CoinChart({
  candles,
  chartError,
  interval,
  intervals,
  hasMoreOlderCandles,
  isLoadingCandles,
  isLoadingMore,
  onLoadOlderCandles,
  onIntervalChange,
  symbol,
}: CoinChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const priceScaleOverlayRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const ma10SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ma50SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ma100SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ma200SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
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
  const priceScaleBaseRangeRef = useRef<{ from: number; to: number } | null>(
    null,
  );
  const shouldResetPriceScaleRef = useRef(false);
  const shouldSnapToLatestRef = useRef(true);
  const [hoveredCandle, setHoveredCandle] = useState<ActiveCandle | null>(
    null,
  );
  const syncPriceScaleRangeRef = useRef<
    (data?: CandlestickData<UTCTimestamp>[]) => void
  >(() => {});
  const applyPriceScaleRangeRef = useRef<
    (options?: { scale?: number }) => void
  >(() => {});
  const scrollToLatestRef = useRef<(() => void) | null>(null);

  const chartData = useMemo(() => createPriceSeries(candles), [candles]);
  const [isChartReady, setIsChartReady] = useState(false);
  const ma10Data = useMemo(() => createMovingAverageSeries(chartData, 10), [chartData]);
  const ma50Data = useMemo(() => createMovingAverageSeries(chartData, 50), [chartData]);
  const ma100Data = useMemo(() => createMovingAverageSeries(chartData, 100), [chartData]);
  const ma200Data = useMemo(() => createMovingAverageSeries(chartData, 200), [chartData]);
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

  syncPriceScaleRangeRef.current = (data = chartData) => {
    if (data.length === 0) {
      priceScaleBaseRangeRef.current = null;
      return;
    }

    const config = getDefaultPriceScaleConfig(interval);
    const windowSize = Math.min(data.length, config.bars);
    const windowData = data.slice(-windowSize);

    const minPrice = windowData.reduce(
      (min, candle) => Math.min(min, candle.low),
      Number.POSITIVE_INFINITY,
    );
    const maxPrice = windowData.reduce(
      (max, candle) => Math.max(max, candle.high),
      Number.NEGATIVE_INFINITY,
    );
    const averageCandleRange =
      windowData.reduce(
        (total, candle) => total + (candle.high - candle.low),
        0,
      ) / Math.max(windowData.length, 1);
    const span = Math.max(maxPrice - minPrice, 1);
    const effectiveSpan = Math.max(
      span,
      averageCandleRange * config.candleRangeMultiplier,
    );
    const scaledPadding = effectiveSpan * config.padding;

    priceScaleBaseRangeRef.current = {
      from: minPrice - scaledPadding,
      to: maxPrice + scaledPadding,
    };
  };

  applyPriceScaleRangeRef.current = ({ scale = 1 } = {}) => {
    if (!seriesRef.current) {
      return;
    }

    const priceScale = seriesRef.current.priceScale();
    const currentRange = priceScale.getVisibleRange();

    if (!currentRange) {
      return;
    }

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
    if (!chartRef.current) {
      return;
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const chart = chartRef.current;
        const dataLength = chartData.length;

        if (!chart || dataLength === 0) {
          return;
        }

        const visibleBars = Math.min(
          getDefaultVisibleBars(interval),
          Math.max(dataLength - 1, 1),
        );

        chart.timeScale().setVisibleLogicalRange({
          from: Math.max(0, dataLength - visibleBars),
          to: dataLength - 1,
        });
      });
    });
  };

  useEffect(() => {
    candlesRef.current = candles;
  }, [candles]);

  useEffect(() => {
    onLoadOlderCandlesRef.current = onLoadOlderCandles;
  }, [onLoadOlderCandles]);

  useEffect(() => {
    hasMoreOlderCandlesRef.current = hasMoreOlderCandles;
  }, [hasMoreOlderCandles]);

  useEffect(() => {
    isLoadingMoreRef.current = isLoadingMore;
  }, [isLoadingMore]);

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

    overlay.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      overlay.removeEventListener("wheel", handleWheel);
    };
  }, []);

  useEffect(() => {
    didSetInitialDataRef.current = false;
    previousDataLengthRef.current = 0;
    requestedBeforeOpenTimeRef.current = null;
    pendingRangeRef.current = null;
    priceScaleZoomRef.current = 1;
    priceScaleWheelDeltaRef.current = 0;
    priceScaleBaseRangeRef.current = null;
    shouldResetPriceScaleRef.current = true;
    shouldSnapToLatestRef.current = true;
    setHoveredCandle(null);
  }, [interval, symbol]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return undefined;
    }

    let chart: IChartApi | null = null;
    let series: ISeriesApi<"Candlestick"> | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let cancelled = false;
    let handleCrosshairMove: ((param: MouseEventParams<Time>) => void) | null =
      null;

    const handleVisibleRangeChange = (range: LogicalRange | null) => {
      if (!range || !chartRef.current) {
        return;
      }

      if (isProgrammaticRangeChangeRef.current) {
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
        const loaded = await onLoadOlderCandlesRef.current(
          firstCandle.openTime,
        );

        if (!loaded) {
          requestedBeforeOpenTimeRef.current = null;
          pendingRangeRef.current = null;
        }
      })();
    };

    const initChart = async () => {
      const { CandlestickSeries, LineSeries, createChart } =
        await import("lightweight-charts");

      if (cancelled || !container) {
        return;
      }

      chart = createChart(container, {
        autoSize: true,
        layout: {
          background: { color: "transparent" },
          textColor: "rgba(255,255,255,0.7)",
        },
        grid: {
          vertLines: { color: "rgba(255,255,255,0.06)" },
          horzLines: { color: "rgba(255,255,255,0.06)" },
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
          borderColor: "rgba(255,255,255,0.08)",
        },
        timeScale: {
          rightOffset: 0,
          borderColor: "rgba(255,255,255,0.08)",
          timeVisible: true,
          secondsVisible: false,
        },
        crosshair: {
          vertLine: {
            color: "rgba(87, 199, 166, 0.45)",
          },
          horzLine: {
            color: "rgba(87, 199, 166, 0.45)",
          },
        },
      });

      series = chart.addSeries(CandlestickSeries, {
        upColor: "rgba(87, 199, 166, 1)",
        downColor: "rgba(237, 85, 101, 1)",
        borderVisible: false,
        wickVisible: true,
      });

      ma10SeriesRef.current = chart.addSeries(LineSeries, {
        color: "rgba(255, 189, 90, 1)",
        lineWidth: 1,
        lastValueVisible: true,
        priceLineVisible: false,
      });
      ma50SeriesRef.current = chart.addSeries(LineSeries, {
        color: "rgba(255, 92, 168, 1)",
        lineWidth: 1,
        lastValueVisible: true,
        priceLineVisible: false,
      });
      ma100SeriesRef.current = chart.addSeries(LineSeries, {
        color: "rgba(159, 122, 234, 1)",
        lineWidth: 1,
        lastValueVisible: true,
        priceLineVisible: false,
      });
      ma200SeriesRef.current = chart.addSeries(LineSeries, {
        color: "rgba(119, 110, 255, 1)",
        lineWidth: 1,
        lastValueVisible: true,
        priceLineVisible: false,
      });

      handleCrosshairMove = ({ seriesData }) => {
        const candleSeries = series;

        if (!candleSeries) {
          return;
        }

        const hoveredData = seriesData.get(
          candleSeries,
        ) as CandlestickData<UTCTimestamp> | undefined;

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

      chart
        .timeScale()
        .subscribeVisibleLogicalRangeChange(handleVisibleRangeChange);
      chart.subscribeCrosshairMove(handleCrosshairMove);

      chartRef.current = chart;
      seriesRef.current = series;

      setIsChartReady(true);

      if (typeof ResizeObserver !== "undefined") {
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
        chart
          .timeScale()
          .unsubscribeVisibleLogicalRangeChange(handleVisibleRangeChange);
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
      chartRef.current?.remove();
      chartRef.current = null;
      chart = null;
      series = null;
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current || !seriesRef.current || !isChartReady) {
      return;
    }

    const previousLength = previousDataLengthRef.current;

    if (chartData.length === 0) {
      seriesRef.current.setData([]);
      ma10SeriesRef.current?.setData([]);
      ma50SeriesRef.current?.setData([]);
      ma100SeriesRef.current?.setData([]);
      ma200SeriesRef.current?.setData([]);
      previousDataLengthRef.current = 0;
      return;
    }

    seriesRef.current.setData(chartData);
    ma10SeriesRef.current?.setData(ma10Data);
    ma50SeriesRef.current?.setData(ma50Data);
    ma100SeriesRef.current?.setData(ma100Data);
    ma200SeriesRef.current?.setData(ma200Data);
    syncPriceScaleRangeRef.current(chartData);

    const shouldResetPriceScale =
      shouldResetPriceScaleRef.current || !didSetInitialDataRef.current;

    if (shouldResetPriceScale) {
      shouldResetPriceScaleRef.current = false;
      priceScaleZoomRef.current = 1;
      priceScaleWheelDeltaRef.current = 0;
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
      const addedCount = chartData.length - previousLength;

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

    previousDataLengthRef.current = chartData.length;

  }, [
    chartData,
    interval,
    isChartReady,
    ma10Data,
    ma50Data,
    ma100Data,
    ma200Data,
  ]);

  useEffect(() => {
    if (
      !isChartReady ||
      !chartRef.current ||
      chartData.length === 0 ||
      !shouldSnapToLatestRef.current
    ) {
      return;
    }

    const chart = chartRef.current;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!chartRef.current || chartRef.current !== chart) {
          return;
        }

        const visibleBars = Math.min(
          getDefaultVisibleBars(interval),
          Math.max(chartData.length - 1, 1),
        );

        chart.timeScale().setVisibleLogicalRange({
          from: Math.max(0, chartData.length - visibleBars),
          to: chartData.length - 1,
        });
        shouldSnapToLatestRef.current = false;
      });
    });
  }, [chartData.length, interval, isChartReady]);

  const displayedCandle = hoveredCandle ?? latestCandle;
  const candleChange = displayedCandle
    ? displayedCandle.close - displayedCandle.open
    : 0;
  const candleRange = displayedCandle
    ? displayedCandle.high - displayedCandle.low
    : 0;
  const candleChangePercent =
    displayedCandle && displayedCandle.open !== 0
      ? (candleChange / displayedCandle.open) * 100
      : 0;
  const candleRangePercent =
    displayedCandle && displayedCandle.open !== 0
      ? (candleRange / displayedCandle.open) * 100
      : 0;
  const candleTextColor =
    displayedCandle && displayedCandle.close >= displayedCandle.open
      ? "teal"
      : "red";
  const displayedCandleIndex = displayedCandle
    ? chartData.findIndex(
        (candle) => Number(candle.time) === displayedCandle.time,
      )
    : -1;
  const ma10Value = getMovingAverageValueAtIndex(
    chartData,
    10,
    displayedCandleIndex,
  );
  const ma50Value = getMovingAverageValueAtIndex(
    chartData,
    50,
    displayedCandleIndex,
  );
  const ma100Value = getMovingAverageValueAtIndex(
    chartData,
    100,
    displayedCandleIndex,
  );
  const ma200Value = getMovingAverageValueAtIndex(
    chartData,
    200,
    displayedCandleIndex,
  );

  return (
    <Card
      radius="xl"
      p={{ base: 20, sm: 28 }}
      withBorder
      style={{
        backgroundColor: "rgba(9, 18, 33, 0.88)",
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      <Stack gap="md">
        <Group justify="space-between" align="center" wrap="wrap">
          <Stack gap={4}>
            <Group gap="xs" align="center">
              <ThemeIcon variant="light" color="teal" radius="xl" size="lg">
                <IconChartLine size={18} />
              </ThemeIcon>
              <Text fw={700} fz="lg">
                Price chart
              </Text>
            </Group>
            <Text c="dimmed" size="sm">
              Pergerakan harga historis untuk {symbol}
            </Text>
          </Stack>

          <Group gap="xs" wrap="wrap">
            {intervals.map((item) => {
              const isActive = item.value === interval;

              return (
                <Button
                  key={item.value}
                  size="xs"
                  variant={isActive ? "filled" : "subtle"}
                  color={isActive ? "teal" : "gray"}
                  onClick={() => onIntervalChange(item.value)}
                  radius="xl"
                >
                  {item.label}
                </Button>
              );
            })}
          </Group>
        </Group>

        <Group justify="space-between" align="center" wrap="wrap">
          <Group gap="xs">
            {isLoadingMore ? (
              <Badge variant="light" color="teal">
                Loading older candles
              </Badge>
            ) : null}
            {!hasMoreOlderCandles ? (
              <Badge variant="light" color="gray">
                No older candles
              </Badge>
            ) : null}
          </Group>
        </Group>

        {displayedCandle ? (
          <Group
            gap="xs"
            wrap="wrap"
            style={{
              borderTop: "1px solid rgba(255,255,255,0.08)",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              paddingTop: 10,
              paddingBottom: 10,
              fontSize: 12,
            }}
          >
            <Text size="xs" c="dimmed">
              {formatChartTime(displayedCandle.time * 1000)}
            </Text>
            <Text size="xs">
              Open <Text component="span" c={candleTextColor} fw={600}>
                {formatDecimalString(displayedCandle.open.toFixed(2))}
              </Text>
            </Text>
            <Text size="xs">
              High <Text component="span" c={candleTextColor} fw={600}>
                {formatDecimalString(displayedCandle.high.toFixed(2))}
              </Text>
            </Text>
            <Text size="xs">
              Low <Text component="span" c={candleTextColor} fw={600}>
                {formatDecimalString(displayedCandle.low.toFixed(2))}
              </Text>
            </Text>
            <Text size="xs">
              Close <Text component="span" c={candleTextColor} fw={600}>
                {formatDecimalString(displayedCandle.close.toFixed(2))}
              </Text>
            </Text>
            <Text size="xs">
              Change <Text component="span" c={candleTextColor} fw={600}>
                {formatSignedDecimal(candleChange)} ({formatPercent(candleChangePercent)})
              </Text>
            </Text>
            <Text size="xs">
              Range <Text component="span" c={candleTextColor} fw={600}>
                {formatDecimalString(candleRange.toFixed(2))} ({formatPercent(candleRangePercent)})
              </Text>
            </Text>
            <Group gap="md" wrap="wrap" mt={4}>
              <Text size="xs">
                MA(10) <Text component="span" c="yellow" fw={600}>
                  {formatDecimalString(ma10Value?.toFixed(2))}
                </Text>
              </Text>
              <Text size="xs">
                MA(50) <Text component="span" c="pink" fw={600}>
                  {formatDecimalString(ma50Value?.toFixed(2))}
                </Text>
              </Text>
              <Text size="xs">
                MA(100) <Text component="span" c="grape" fw={600}>
                  {formatDecimalString(ma100Value?.toFixed(2))}
                </Text>
              </Text>
              <Text size="xs">
                MA(200) <Text component="span" c="indigo" fw={600}>
                  {formatDecimalString(ma200Value?.toFixed(2))}
                </Text>
              </Text>
            </Group>
          </Group>
        ) : null}

        <div
          ref={wrapperRef}
          style={{
            position: "relative",
            height: 360,
            width: "100%",
          }}
        >
          {isLoadingCandles && chartData.length === 0 ? (
            <div
              style={{
                alignItems: "center",
                backdropFilter: "blur(6px)",
                backgroundColor: "rgba(9, 18, 33, 0.65)",
                borderRadius: 16,
                display: "flex",
                inset: 0,
                justifyContent: "center",
                position: "absolute",
                zIndex: 3,
              }}
            >
              <Text c="dimmed" size="sm">
                Loading chart for {interval}...
              </Text>
            </div>
          ) : chartError ? (
            <div
              style={{
                alignItems: "center",
                backdropFilter: "blur(6px)",
                backgroundColor: "rgba(9, 18, 33, 0.65)",
                borderRadius: 16,
                display: "flex",
                inset: 0,
                justifyContent: "center",
                position: "absolute",
                zIndex: 3,
              }}
            >
              <Text c="red" size="sm">
                {chartError}
              </Text>
            </div>
          ) : null}
          <div
            ref={containerRef}
            style={{
              height: "100%",
              width: "100%",
            }}
          />
          <div
            aria-hidden="true"
            ref={priceScaleOverlayRef}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: 80,
              cursor: "ns-resize",
              background: "transparent",
              zIndex: 2,
            }}
          />
        </div>
      </Stack>
    </Card>
  );
}
