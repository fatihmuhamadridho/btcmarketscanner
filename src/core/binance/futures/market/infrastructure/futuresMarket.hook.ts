import { useQueries, useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { WebsocketService } from '@services/websocket.service';
import { analyzeTrend, getSupportResistance } from 'btcmarketscanner-core';
import type { FuturesKlineCandle } from '../domain/futuresMarket.model';
import { FuturesMarketController } from '../domain/futuresMarket.controller';

const futuresMarketController = new FuturesMarketController();
const futuresWebsocketService = new WebsocketService();
const MARKET_TIMEFRAMES = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '30m', value: '30m' },
  { label: '1H', value: '1h' },
  { label: '4H', value: '4h' },
  { label: '1D', value: '1d' },
] as const;
const INDICATOR_LOOKBACK_LIMIT = 300;

type BinanceKlineStreamEvent = {
  e?: string;
  s?: string;
  k?: {
    t?: number;
    T?: number;
    s?: string;
    i?: string;
    o?: string;
    c?: string;
    h?: string;
    l?: string;
    v?: string;
    x?: boolean;
  };
};

function parseKlineStreamCandle(rawMessage: string, symbol: string, interval: string): FuturesKlineCandle | null {
  try {
    const parsed = JSON.parse(rawMessage) as BinanceKlineStreamEvent;
    const kline = parsed.k;

    if (
      parsed.e !== 'kline' ||
      parsed.s?.toUpperCase() !== symbol.toUpperCase() ||
      kline?.s?.toUpperCase() !== symbol.toUpperCase() ||
      kline?.i?.toLowerCase() !== interval.toLowerCase() ||
      kline?.t === undefined ||
      kline?.T === undefined ||
      kline?.o === undefined ||
      kline?.c === undefined ||
      kline?.h === undefined ||
      kline?.l === undefined ||
      kline?.v === undefined
    ) {
      return null;
    }

    return {
      openTime: kline.t,
      closeTime: kline.T,
      open: Number(kline.o),
      high: Number(kline.h),
      low: Number(kline.l),
      close: Number(kline.c),
      volume: Number(kline.v),
    };
  } catch {
    return null;
  }
}

function mergeCandlesByOpenTime(current: FuturesKlineCandle[], nextCandles: FuturesKlineCandle[]) {
  const merged = new Map<number, FuturesKlineCandle>();

  current.forEach((candle) => {
    merged.set(candle.openTime, candle);
  });

  nextCandles.forEach((candle) => {
    merged.set(candle.openTime, candle);
  });

  return Array.from(merged.values()).sort((left, right) => left.openTime - right.openTime);
}

function capCandles(candles: FuturesKlineCandle[], limit = 500) {
  if (candles.length <= limit) {
    return candles;
  }

  return candles.slice(-limit);
}

type BinanceAggTradeStreamEvent = {
  e?: string;
  s?: string;
  p?: string;
};

function parseLivePrice(rawMessage: string, symbol: string) {
  try {
    const parsed = JSON.parse(rawMessage) as BinanceAggTradeStreamEvent;

    if (parsed.e !== 'aggTrade' && parsed.e !== 'trade') {
      return null;
    }

    if (parsed.s?.toUpperCase() !== symbol.toUpperCase()) {
      return null;
    }

    const price = Number(parsed.p);

    return Number.isFinite(price) ? price : null;
  } catch {
    return null;
  }
}

export type TimeframeSupportResistance = {
  interval: string;
  label: string;
  isLoading: boolean;
  isError: boolean;
  atr14: number | null;
  ema100: number | null;
  ema20: number | null;
  ema200: number | null;
  ema50: number | null;
  supportResistance:
    | {
        averageResistance: number;
        averageSupport: number;
        resistance: number;
        support: number;
      }
    | null;
  rsi14: number | null;
  trendDirection: 'bullish' | 'bearish' | 'sideways';
  trendLabel: string;
};

export function useFuturesMarketOverview() {
  return useQuery({
    queryKey: ['futures-market-overview'],
    queryFn: () => futuresMarketController.getMarketOverview(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useFuturesMarketSymbolDetail(symbol?: string, interval = '1d') {
  return useQuery({
    queryKey: ['futures-market-symbol-detail', symbol, interval],
    queryFn: () => futuresMarketController.getMarketSymbolDetail(symbol ?? '', interval),
    enabled: typeof symbol === 'string' && symbol.length > 0,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useFuturesMarketSymbolSnapshot(symbol?: string) {
  return useQuery({
    queryKey: ['futures-market-symbol-snapshot', symbol],
    queryFn: () => futuresMarketController.getMarketSymbolSnapshot(symbol ?? ''),
    enabled: typeof symbol === 'string' && symbol.length > 0,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useFuturesMarketSymbolInitialCandles(symbol?: string, interval = '1d', limit = 200) {
  return useQuery({
    queryKey: ['futures-market-symbol-initial-candles', symbol, interval, limit],
    queryFn: () => futuresMarketController.getMarketInitialCandles(symbol ?? '', interval, limit),
    enabled: typeof symbol === 'string' && symbol.length > 0,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}

export function useFuturesMarketSymbolLivePrice(symbol?: string) {
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!symbol) {
      setLivePrice(null);
      setIsConnected(false);
      return undefined;
    }

    if (globalThis.window === undefined) {
      return undefined;
    }

    const streamPath = `${symbol.toLowerCase()}@aggTrade`;

    let socket: WebSocket | null = null;

    try {
      socket = futuresWebsocketService.connect(streamPath);
      setIsConnected(false);
    } catch {
      setIsConnected(false);
      return undefined;
    }

    socket.onopen = () => setIsConnected(true);
    socket.onerror = () => setIsConnected(false);
    socket.onclose = () => setIsConnected(false);
    socket.onmessage = (event) => {
      const nextPrice = parseLivePrice(event.data, symbol);

      if (nextPrice !== null) {
        setLivePrice(nextPrice);
      }
    };

    return () => {
      socket.onopen = null;
      socket.onerror = null;
      socket.onclose = null;
      socket.onmessage = null;
      futuresWebsocketService.close();
    };
  }, [symbol]);

  return { isConnected, livePrice };
}

export function useFuturesMarketSymbolCandles(symbol?: string, initialCandles: FuturesKlineCandle[] = [], interval = '1d') {
  const [candles, setCandles] = useState(initialCandles);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreOlderCandles, setHasMoreOlderCandles] = useState(true);
  const datasetKeyRef = useRef<string>('');

  useEffect(() => {
    const nextDatasetKey = `${symbol ?? ''}-${interval}`;

    if (datasetKeyRef.current !== nextDatasetKey) {
      datasetKeyRef.current = nextDatasetKey;
      setCandles(capCandles(initialCandles));
      setHasMoreOlderCandles(true);
      futuresWebsocketService.close();
      return;
    }

    if (initialCandles.length === 0) {
      return;
    }

    setCandles((current) => {
      if (current.length === 0) {
        return capCandles(initialCandles);
      }

      return capCandles(mergeCandlesByOpenTime(current, initialCandles));
    });
  }, [initialCandles, interval, symbol]);

  useEffect(() => {
    setHasMoreOlderCandles(true);
  }, [interval, symbol]);

  useEffect(() => {
    if (!symbol) {
      return undefined;
    }

    if (globalThis.window === undefined) {
      return undefined;
    }

    const streamPath = `${symbol.toLowerCase()}@kline_${interval}`;
    futuresWebsocketService.connect(streamPath);

    const handleMessage = (event: MessageEvent<string>) => {
      const nextCandle = parseKlineStreamCandle(event.data, symbol, interval);

      if (!nextCandle) {
        return;
      }

      setCandles((current) => {
        if (current.length === 0) {
          return [nextCandle];
        }

        const lastIndex = current.length - 1;
        const lastCandle = current[lastIndex];

        if (nextCandle.openTime < lastCandle.openTime) {
          return current;
        }

        if (nextCandle.openTime > lastCandle.openTime + 1) {
          return capCandles(mergeCandlesByOpenTime(current, [nextCandle]));
        }

        if (nextCandle.openTime === lastCandle.openTime) {
          const nextCandles = [...current];
          nextCandles[lastIndex] = nextCandle;
          return nextCandles;
        }

        const nextCandles = [...current];
        nextCandles.push(nextCandle);

        return capCandles(nextCandles);
      });
    };

    const unsubscribe = futuresWebsocketService.onMessage(handleMessage);

    return () => {
      unsubscribe();
      futuresWebsocketService.close();
    };
  }, [interval, symbol]);

  const loadOlderCandles = async (beforeOpenTime: number, limit = 48) => {
    if (!symbol || isLoadingMore || !hasMoreOlderCandles) {
      return false;
    }

    setIsLoadingMore(true);

    try {
      const olderCandles = await futuresMarketController.getOlderMarketCandles(symbol, beforeOpenTime, interval, limit);

      if (olderCandles.length === 0) {
        setHasMoreOlderCandles(false);
        return false;
      }

      setCandles((current) => {
        const existingOpenTimes = new Set(current.map((item) => item.openTime));
        const dedupedOlderCandles = olderCandles.filter((item) => !existingOpenTimes.has(item.openTime));

        if (dedupedOlderCandles.length === 0) {
          setHasMoreOlderCandles(false);
          return current;
        }

        return capCandles([...dedupedOlderCandles, ...current]);
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

export function useFuturesMarketTimeframeSupportResistance(symbol?: string, windowSize = 20) {
  const queries = useQueries({
    queries: MARKET_TIMEFRAMES.map((timeframe) => ({
      queryKey: ['futures-market-timeframe-support-resistance', symbol, timeframe.value, windowSize],
      queryFn: () => futuresMarketController.getMarketInitialCandles(symbol ?? '', timeframe.value, INDICATOR_LOOKBACK_LIMIT),
      enabled: typeof symbol === 'string' && symbol.length > 0,
      staleTime: 0,
      refetchOnWindowFocus: false,
    })),
  });

  return MARKET_TIMEFRAMES.map((timeframe, index) => {
    const query = queries[index];
    const candles = query.data?.data ?? [];
    const supportResistance = getSupportResistance(candles, windowSize);
    const trend = analyzeTrend(candles, supportResistance);

    return {
      interval: timeframe.value,
      atr14: trend.atr14,
      ema100: trend.ema100,
      ema20: trend.ema20,
      ema200: trend.ema200,
      ema50: trend.ema50,
      label: timeframe.label,
      isLoading: query.isLoading,
      isError: query.isError,
      supportResistance,
      rsi14: trend.rsi14,
      trendDirection: trend.direction,
      trendLabel: trend.label,
    };
  });
}
