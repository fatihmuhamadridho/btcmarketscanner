import { Group, Stack, Text } from '@mantine/core';
import { IconChartCandle } from '@tabler/icons-react';

type AppNavbarBrandProps = {
  isCoinRoute: boolean;
};

export default function AppNavbarBrand({ isCoinRoute }: AppNavbarBrandProps) {
  return (
    <Stack gap={2}>
      <Group gap={8} align="center">
        <IconChartCandle size={18} stroke={1.8} />
        <Text fw={800} lh={1.1}>
          BTC Market Scanner
        </Text>
      </Group>
      <Text size="xs" c="dimmed">
        {isCoinRoute ? 'Coin detail view' : 'Market overview'}
      </Text>
    </Stack>
  );
}
