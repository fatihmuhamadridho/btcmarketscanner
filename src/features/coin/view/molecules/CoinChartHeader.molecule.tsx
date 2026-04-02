import { ActionIcon, Badge, Button, Group, Stack, Text, ThemeIcon, Tooltip } from '@mantine/core';
import { IconChartLine, IconMaximize, IconMinimize } from '@tabler/icons-react';
import type { CoinTimeframe } from '../../interface/CoinView.interface';

type CoinChartHeaderProps = {
  hasMoreOlderCandles: boolean;
  isFullscreen: boolean;
  interval: CoinTimeframe;
  intervals: ReadonlyArray<{
    label: string;
    value: CoinTimeframe;
  }>;
  isLoadingMore: boolean;
  onIntervalChange: (interval: CoinTimeframe) => void;
  onToggleFullscreen: () => void;
  symbol: string;
};

export default function CoinChartHeader({
  hasMoreOlderCandles,
  isFullscreen,
  interval,
  intervals,
  isLoadingMore,
  onIntervalChange,
  onToggleFullscreen,
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

          <Tooltip label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'} withArrow>
            <ActionIcon
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              color="cyan"
              onClick={onToggleFullscreen}
              radius="xl"
              size="lg"
              variant="light"
            >
              {isFullscreen ? <IconMinimize size={16} /> : <IconMaximize size={16} />}
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      {isLoadingMore || !hasMoreOlderCandles ? (
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
      ) : null}
    </>
  );
}
