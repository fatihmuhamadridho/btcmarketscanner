import { Badge, Button, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconChartLine } from '@tabler/icons-react';
import type { CoinTimeframe } from '../../interface/CoinView.interface';

type CoinChartHeaderProps = {
  hasMoreOlderCandles: boolean;
  interval: CoinTimeframe;
  intervals: ReadonlyArray<{
    label: string;
    value: CoinTimeframe;
  }>;
  isLoadingMore: boolean;
  onIntervalChange: (interval: CoinTimeframe) => void;
  symbol: string;
};

export default function CoinChartHeader({
  hasMoreOlderCandles,
  interval,
  intervals,
  isLoadingMore,
  onIntervalChange,
  symbol,
}: CoinChartHeaderProps) {
  return (
    <>
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
            Historical price movement for {symbol}
          </Text>
        </Stack>

        <Group gap="xs" wrap="wrap">
          {intervals.map((item) => {
            const isActive = item.value === interval;

            return (
              <Button
                key={item.value}
                size="xs"
                variant={isActive ? 'filled' : 'subtle'}
                color={isActive ? 'teal' : 'gray'}
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
    </>
  );
}
