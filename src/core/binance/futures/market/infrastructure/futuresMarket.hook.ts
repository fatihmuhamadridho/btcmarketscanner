import { useQueries, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { FuturesKlineCandle } from "../domain/models/futuresMarket.model";
import { FuturesMarketController } from "../domain/futuresMarket.controller";

const futuresMarketController = new FuturesMarketController();
const MARKET_TIMEFRAMES = [
  { label: "1m", value: "1m" },
  { label: "5m", value: "5m" },
  { label: "15m", value: "15m" },
  { label: "30m", value: "30m" },
  { label: "1H", value: "1h" },
  { label: "4H", value: "4h" },
  { label: "1D", value: "1d" },
] as const;

function getSupportResistance(candles: FuturesKlineCandle[], windowSize: number) {
  if (candles.length === 0) {
    return null;
  }

  const windowCandles = candles.slice(-windowSize);

  return {
    support: Math.min(...windowCandles.map((candle) => candle.low)),
    resistance: Math.max(...windowCandles.map((candle) => candle.high)),
  };
}

export function useFuturesMarketOverview() {
  return useQuery({
    queryKey: ["futures-market-overview"],
    queryFn: () => futuresMarketController.getMarketOverview(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useFuturesMarketSymbolDetail(
  symbol?: string,
  interval = "1d",
) {
  return useQuery({
    queryKey: ["futures-market-symbol-detail", symbol, interval],
    queryFn: () =>
      futuresMarketController.getMarketSymbolDetail(symbol ?? "", interval),
    enabled: typeof symbol === "string" && symbol.length > 0,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useFuturesMarketSymbolSnapshot(symbol?: string) {
  return useQuery({
    queryKey: ["futures-market-symbol-snapshot", symbol],
    queryFn: () => futuresMarketController.getMarketSymbolSnapshot(symbol ?? ""),
    enabled: typeof symbol === "string" && symbol.length > 0,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useFuturesMarketSymbolInitialCandles(
  symbol?: string,
  interval = "1d",
) {
  return useQuery({
    queryKey: ["futures-market-symbol-initial-candles", symbol, interval],
    queryFn: () =>
      futuresMarketController.getMarketInitialCandles(symbol ?? "", interval),
    enabled: typeof symbol === "string" && symbol.length > 0,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}

export function useFuturesMarketSymbolCandles(
  symbol?: string,
  initialCandles: FuturesKlineCandle[] = [],
  interval = "1d",
) {
  const [candles, setCandles] = useState(initialCandles);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreOlderCandles, setHasMoreOlderCandles] = useState(true);

  useEffect(() => {
    setCandles(initialCandles);
    setHasMoreOlderCandles(true);
  }, [initialCandles, interval, symbol]);

  const loadOlderCandles = async (beforeOpenTime: number, limit = 48) => {
    if (!symbol || isLoadingMore || !hasMoreOlderCandles) {
      return false;
    }

    setIsLoadingMore(true);

    try {
      const olderCandles = await futuresMarketController.getOlderMarketCandles(
        symbol,
        beforeOpenTime,
        interval,
        limit,
      );

      if (olderCandles.length === 0) {
        setHasMoreOlderCandles(false);
        return false;
      }

      setCandles((current) => {
        const existingOpenTimes = new Set(current.map((item) => item.openTime));
        const dedupedOlderCandles = olderCandles.filter(
          (item) => !existingOpenTimes.has(item.openTime),
        );

        if (dedupedOlderCandles.length === 0) {
          setHasMoreOlderCandles(false);
          return current;
        }

        return [...dedupedOlderCandles, ...current];
      });

      if (olderCandles.length < limit) {
        setHasMoreOlderCandles(false);
      }

      return true;
    } catch {
      return false;
    } finally {
      setIsLoadingMore(false);
    }
  };

  return {
    candles,
    hasMoreOlderCandles,
    isLoadingMore,
    loadOlderCandles,
  };
}

export function useFuturesMarketTimeframeSupportResistance(
  symbol?: string,
  windowSize = 20,
) {
  const queries = useQueries({
    queries: MARKET_TIMEFRAMES.map((timeframe) => ({
      queryKey: [
        "futures-market-timeframe-support-resistance",
        symbol,
        timeframe.value,
        windowSize,
      ],
      queryFn: () =>
        futuresMarketController.getMarketInitialCandles(
          symbol ?? "",
          timeframe.value,
          120,
        ),
      enabled: typeof symbol === "string" && symbol.length > 0,
      staleTime: 0,
      refetchOnWindowFocus: false,
    })),
  });

  return MARKET_TIMEFRAMES.map((timeframe, index) => {
    const query = queries[index];
    const candles = query.data?.data ?? [];

    return {
      interval: timeframe.value,
      label: timeframe.label,
      isLoading: query.isLoading,
      isError: query.isError,
      supportResistance: getSupportResistance(candles, windowSize),
    };
  });
}
