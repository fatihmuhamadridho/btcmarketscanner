import Link from 'next/link';
import { Badge, Card, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import type { FuturesMarketOverviewItem } from '@core/binance/futures/market/domain/futuresMarket.model';

type HomeCardProps = {
  coin: FuturesMarketOverviewItem;
};

export default function HomeCard({ coin }: HomeCardProps) {
  const priceChangePercent = Number(coin.ticker.priceChangePercent ?? 0);
  const changeBadgeColor = priceChangePercent > 0 ? 'green' : priceChangePercent < 0 ? 'red' : 'gray';

  return (
    <Card
      component={Link}
      href={`/coin/${coin.symbol}`}
      radius={0}
      p={{ base: 16, sm: 20 }}
      withBorder
      style={{
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'transparent',
        textDecoration: 'none',
        transition: 'transform 160ms ease, background-color 160ms ease',
      }}
    >
      <Group justify="space-between" align="center" wrap="nowrap">
        <Group gap="md" wrap="nowrap" align="center">
          <ThemeIcon size={44} radius="xl" variant="light" color="teal">
            {coin.symbol.slice(0, 1)}
          </ThemeIcon>
          <Stack gap={2}>
            <Group gap="xs" align="center">
              <Text fw={700} fz="lg" tt="uppercase" style={{ letterSpacing: 1 }}>
                {coin.symbol}
              </Text>
              <Badge variant="light" color={changeBadgeColor} size="sm">
                {coin.ticker.displayChange}
              </Badge>
            </Group>
            <Text c="dimmed" size="sm">
              {coin.displayName}
            </Text>
            <Text size="sm">{coin.contractType ?? 'Futures contract'}</Text>
          </Stack>
        </Group>
        <Group gap="xs" wrap="nowrap">
          <Text size="sm" c="dimmed">
            {coin.ticker.displayLastPrice}
          </Text>
          <ThemeIcon variant="light" color="teal" radius="xl" size="md">
            <IconArrowRight size={16} />
          </ThemeIcon>
        </Group>
      </Group>
    </Card>
  );
}
