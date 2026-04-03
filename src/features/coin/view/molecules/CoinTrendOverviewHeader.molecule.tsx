import type { ComponentType } from 'react';
import { Group, Stack, Text, ThemeIcon, Title } from '@mantine/core';

type CoinTrendOverviewHeaderProps = {
  color: 'teal' | 'red' | 'gray';
  changePercent: number;
  label: string;
  TrendIcon: ComponentType<{ size?: number }>;
};

export default function CoinTrendOverviewHeader({
  color,
  changePercent,
  label,
  TrendIcon,
}: CoinTrendOverviewHeaderProps) {
  return (
    <Group justify="space-between" align="center" wrap="wrap">
      <Stack gap={4}>
        <Text c="dimmed" size="sm" tt="uppercase">
          Trend overview
        </Text>
        <Title order={2} fz="h3">
          {label} trend
        </Title>
        <Text c="dimmed" size="sm">
          Based on all loaded candles in the current detail view.
        </Text>
      </Stack>

      <Group gap="sm" wrap="nowrap">
        <ThemeIcon size={44} radius="xl" variant="light" color={color}>
          <TrendIcon size={20} />
        </ThemeIcon>
        <Stack gap={0} align="flex-end">
          <Text fw={700} fz="xl" c={color}>
            {label}
          </Text>
          <Text c="dimmed" size="sm">
            {changePercent >= 0 ? '+' : ''}
            {changePercent.toFixed(2)}% from the first candle
          </Text>
        </Stack>
      </Group>
    </Group>
  );
}
