import { Group, Stack, Text } from '@mantine/core';
import { IconChartCandle } from '@tabler/icons-react';

type AppNavbarBrandProps = {
  isCoinRoute: boolean;
};

export default function AppNavbarBrand({ isCoinRoute }: AppNavbarBrandProps) {
  return (
    <Stack gap={1}>
      <Group gap={8} align="center">
        <IconChartCandle size={18} stroke={1.8} />
        <Text fw={800} lh={1.1} size="sm" style={{ fontSize: 'clamp(0.95rem, 2.4vw, 1.05rem)' }}>
          BTC Market Scanner
        </Text>
      </Group>
      <Text size="xs" c="dimmed" hiddenFrom="sm">
        {isCoinRoute ? 'Coin detail view' : 'Market overview'}
      </Text>
      <Text size="xs" c="dimmed" visibleFrom="sm">
        {isCoinRoute ? 'Coin detail view' : 'Market overview'}
      </Text>
    </Stack>
  );
}
