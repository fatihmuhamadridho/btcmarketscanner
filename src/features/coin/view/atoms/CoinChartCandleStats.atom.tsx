import { Group, Text } from '@mantine/core';
import { formatChartPrice, formatChartSignedPrice } from '../../logic/CoinChartFormat.logic';

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
}: CoinChartCandleStatsProps) {
  if (!displayedCandle) {
    return null;
  }

  return (
    <Group gap="xs" wrap="wrap" align="center">
      <Text size="xs" c="dimmed">
        {formatChartTime(displayedCandle.time * 1000)}
      </Text>
      <Text size="xs">
        Open{' '}
        <Text component="span" c={candleTextColor} fw={600}>
          {formatChartPrice(displayedCandle.open)}
        </Text>
      </Text>
      <Text size="xs">
        High{' '}
        <Text component="span" c={candleTextColor} fw={600}>
          {formatChartPrice(displayedCandle.high)}
        </Text>
      </Text>
      <Text size="xs">
        Low{' '}
        <Text component="span" c={candleTextColor} fw={600}>
          {formatChartPrice(displayedCandle.low)}
        </Text>
      </Text>
      <Text size="xs">
        Close{' '}
        <Text component="span" c={candleTextColor} fw={600}>
          {formatChartPrice(displayedCandle.close)}
        </Text>
      </Text>
      <Text size="xs">
        Change{' '}
        <Text component="span" c={candleTextColor} fw={600}>
          {formatChartSignedPrice(candleChange)} ({formatPercent(candleChangePercent)})
        </Text>
      </Text>
      <Text size="xs">
        Range{' '}
        <Text component="span" c={candleTextColor} fw={600}>
          {formatChartPrice(candleRange)} ({formatPercent(candleRangePercent)})
        </Text>
      </Text>
    </Group>
  );
}
