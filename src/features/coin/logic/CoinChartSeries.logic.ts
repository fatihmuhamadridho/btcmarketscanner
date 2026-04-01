import type {
  CandlestickData,
  LineData,
  SeriesMarker,
  Time,
  UTCTimestamp,
} from 'lightweight-charts';
import type { FuturesKlineCandle } from '@core/binance/futures/market/domain/futuresMarket.model';

export function createPriceSeries(candles: FuturesKlineCandle[]): CandlestickData<UTCTimestamp>[] {
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

export function createMovingAverageSeries(
  candles: CandlestickData<UTCTimestamp>[],
  period: number
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

export function getStructureSeries(candles: CandlestickData<UTCTimestamp>[], lookback = 3) {
  const pivotHighs: CandlestickData<UTCTimestamp>[] = [];
  const pivotLows: CandlestickData<UTCTimestamp>[] = [];

  for (let index = lookback; index < candles.length - lookback; index += 1) {
    const candle = candles[index];
    const left = candles.slice(index - lookback, index);
    const right = candles.slice(index + 1, index + lookback + 1);

    const isPivotHigh =
      left.every((item) => item.high < candle.high) && right.every((item) => item.high <= candle.high);
    const isPivotLow = left.every((item) => item.low > candle.low) && right.every((item) => item.low >= candle.low);

    if (isPivotHigh) {
      pivotHighs.push(candle);
    }

    if (isPivotLow) {
      pivotLows.push(candle);
    }
  }

  const recentPivotHighs = pivotHighs.slice(-6);
  const recentPivotLows = pivotLows.slice(-6);

  const highLinePoints = recentPivotHighs.slice(-4).map((candle) => ({
    time: candle.time,
    value: candle.high,
  }));
  const lowLinePoints = recentPivotLows.slice(-4).map((candle) => ({
    time: candle.time,
    value: candle.low,
  }));

  const markers: Array<SeriesMarker<Time>> = [];

  const pushHighMarker = (candle: CandlestickData<UTCTimestamp>, index: number, isLatest: boolean) => {
    const previous = pivotHighs[index - 1];
    const label = index === 0 ? 'H' : candle.high > previous.high ? 'HH' : 'LH';
    const accent =
      index === 0
        ? 'rgba(251, 146, 60, 0.7)'
        : candle.high > previous.high
          ? 'rgba(103, 232, 249, 0.98)'
          : 'rgba(251, 146, 60, 0.98)';

    markers.push({
      time: candle.time,
      position: 'aboveBar',
      shape: index === 0 ? 'circle' : 'arrowDown',
      color: accent,
      size: isLatest ? 2 : index === 0 ? 1.2 : 1.5,
      text: label,
    });
  };

  const pushLowMarker = (candle: CandlestickData<UTCTimestamp>, index: number, isLatest: boolean) => {
    const previous = pivotLows[index - 1];
    const label = index === 0 ? 'L' : candle.low > previous.low ? 'HL' : 'LL';
    const accent =
      index === 0
        ? 'rgba(103, 232, 249, 0.7)'
        : candle.low > previous.low
          ? 'rgba(103, 232, 249, 0.98)'
          : 'rgba(251, 146, 60, 0.98)';

    markers.push({
      time: candle.time,
      position: 'belowBar',
      shape: index === 0 ? 'circle' : isLatest ? 'square' : 'arrowUp',
      color: accent,
      size: isLatest ? 2 : index === 0 ? 1.1 : 1.6,
      text: label,
    });
  };

  pivotHighs.forEach((candle, index) => {
    pushHighMarker(candle, index, index === pivotHighs.length - 1);
  });

  pivotLows.forEach((candle, index) => {
    pushLowMarker(candle, index, index === pivotLows.length - 1);
  });

  return {
    markers,
    pivotHighSeries: highLinePoints,
    pivotLowSeries: lowLinePoints,
  };
}

export function getMovingAverageValueAtIndex(candles: CandlestickData<UTCTimestamp>[], period: number, index: number) {
  if (candles.length === 0 || index < 0) {
    return null;
  }

  const effectiveIndex = Math.min(index, candles.length - 1);
  const startIndex = Math.max(0, effectiveIndex - period + 1);
  const window = candles.slice(startIndex, effectiveIndex + 1);
  const sum = window.reduce((total, candle) => total + candle.close, 0);

  return sum / Math.max(window.length, 1);
}
