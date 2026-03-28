import { useEffect, useMemo, useRef } from "react";
import { Card, Group, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconChartLine } from "@tabler/icons-react";
import type {
  CandlestickData,
  IChartApi,
  ISeriesApi,
} from "lightweight-charts";
import type { Coin } from "@/data/coins";

type CoinChartProps = {
  coin: Coin;
};

function parseCoinPrice(price: string) {
  const numericPrice = Number(price.replace(/[^0-9.]/g, ""));

  return Number.isFinite(numericPrice) ? numericPrice : 1;
}

function toUtcDateString(unixSeconds: number) {
  return new Date(unixSeconds * 1000).toISOString().slice(0, 10);
}

function createPriceSeries(coin: Coin): CandlestickData<string>[] {
  const basePrice = parseCoinPrice(coin.price);
  const seed =
    coin.symbol.split("").reduce((sum, character) => sum + character.charCodeAt(0), 0) %
    10;
  const drift = coin.symbol === "BTC" ? 0.06 : coin.symbol === "ETH" ? 0.045 : 0.03;
  const now = Math.floor(Date.now() / 1000);
  const points = 48;

  return Array.from({ length: points }, (_, index) => {
    const progress = index / Math.max(points - 1, 1);
    const wave = Math.sin(progress * Math.PI * 3 + seed) * 0.02;
    const trend = (progress - 0.5) * drift;
    const close = basePrice * (1 + wave + trend);
    const open = close * (1 - 0.01 + progress * 0.02);
    const high = Math.max(open, close) * (1 + 0.012 + progress * 0.01);
    const low = Math.min(open, close) * (1 - 0.012 - progress * 0.008);

    return {
      time: toUtcDateString(now - (points - 1 - index) * 86400),
      open: Number(open.toFixed(basePrice < 1 ? 4 : 2)),
      high: Number(high.toFixed(basePrice < 1 ? 4 : 2)),
      low: Number(low.toFixed(basePrice < 1 ? 4 : 2)),
      close: Number(close.toFixed(basePrice < 1 ? 4 : 2)),
    };
  });
}

export default function CoinChart({ coin }: CoinChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  const chartData = useMemo(() => createPriceSeries(coin), [coin]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return undefined;
    }

    let chart: IChartApi | null = null;
    let series: ISeriesApi<"Candlestick"> | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let cancelled = false;

    const initChart = async () => {
      const { CandlestickSeries, createChart } = await import(
        "lightweight-charts"
      );

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
        rightPriceScale: {
          borderColor: "rgba(255,255,255,0.08)",
        },
        timeScale: {
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

      series.setData(chartData);
      chart.timeScale().fitContent();

      chartRef.current = chart;
      seriesRef.current = series;

      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => {
          chart?.timeScale().fitContent();
        });

        resizeObserver.observe(container);
      }
    };

    void initChart();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      seriesRef.current = null;
      chartRef.current?.remove();
      chartRef.current = null;
      chart = null;
      series = null;
    };
  }, [chartData]);

  useEffect(() => {
    seriesRef.current?.setData(chartData);
    chartRef.current?.timeScale().fitContent();
  }, [chartData]);

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
        <Group justify="space-between" align="center">
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
              Pergerakan harga historis untuk {coin.symbol}
            </Text>
          </Stack>
          <Text fw={600} c="teal">
            {coin.price}
          </Text>
        </Group>

        <div
          ref={containerRef}
          style={{
            height: 360,
            width: "100%",
          }}
        />
      </Stack>
    </Card>
  );
}
