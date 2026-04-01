import { Text } from '@mantine/core';
import { formatDecimalString } from '@utils/format-number.util';

type DisplayedCandle = {
  close: number;
  high: number;
  low: number;
  open: number;
  time: number;
};

type CoinChartCandleStatsProps = {
  candleChange: number;
  candleChangePercent: number;
  candleRange: number;
  candleRangePercent: number;
  candleTextColor: 'teal' | 'red';
  displayedCandle: DisplayedCandle | null;
  formatChartTime: (value?: number) => string;
  formatPercent: (value: number) => string;
  formatSignedDecimal: (value: number) => string;
};

export default function CoinChartCandleStats({
  candleChange,
  candleChangePercent,
  candleRange,
  candleRangePercent,
  candleTextColor,
  displayedCandle,
  formatChartTime,
  formatPercent,
  formatSignedDecimal,
}: CoinChartCandleStatsProps) {
  if (!displayedCandle) {
    return null;
  }

  return (
    <>
      <Text size="xs" c="dimmed">
        {formatChartTime(displayedCandle.time * 1000)}
      </Text>
      <Text size="xs">
        Open{' '}
        <Text component="span" c={candleTextColor} fw={600}>
          {formatDecimalString(displayedCandle.open.toFixed(2))}
        </Text>
      </Text>
      <Text size="xs">
        High{' '}
        <Text component="span" c={candleTextColor} fw={600}>
          {formatDecimalString(displayedCandle.high.toFixed(2))}
        </Text>
      </Text>
      <Text size="xs">
        Low{' '}
        <Text component="span" c={candleTextColor} fw={600}>
          {formatDecimalString(displayedCandle.low.toFixed(2))}
        </Text>
      </Text>
      <Text size="xs">
        Close{' '}
        <Text component="span" c={candleTextColor} fw={600}>
          {formatDecimalString(displayedCandle.close.toFixed(2))}
        </Text>
      </Text>
      <Text size="xs">
        Change{' '}
        <Text component="span" c={candleTextColor} fw={600}>
          {formatSignedDecimal(candleChange)} ({formatPercent(candleChangePercent)})
        </Text>
      </Text>
      <Text size="xs">
        Range{' '}
        <Text component="span" c={candleTextColor} fw={600}>
          {formatDecimalString(candleRange.toFixed(2))} ({formatPercent(candleRangePercent)})
        </Text>
      </Text>
    </>
  );
}
