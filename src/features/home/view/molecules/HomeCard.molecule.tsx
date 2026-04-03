import Link from 'next/link';
import { Badge, Card, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import type { HomeCardChangeBadgeColor } from '../../interface/HomeView.interface';

type HomeCardProps = {
  baseAsset?: string | null;
  changeBadgeColor: HomeCardChangeBadgeColor;
  contractType?: string | null;
  displayChange?: string | null;
  displayLastPrice?: string | null;
  displayName?: string | null;
  quoteAsset?: string | null;
  symbol: string;
};

export default function HomeCard({
  baseAsset,
  changeBadgeColor,
  contractType,
  displayChange,
  displayLastPrice,
  displayName,
  quoteAsset,
  symbol,
}: HomeCardProps) {
  return (
    <Card
      component={Link}
      href={`/coin/${symbol}`}
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
            {symbol.slice(0, 1)}
          </ThemeIcon>
          <Stack gap={2}>
            <Group gap="xs" align="center">
              <Text fw={700} fz="lg" tt="uppercase" style={{ letterSpacing: 1 }}>
                {symbol}
              </Text>
              <Badge variant="light" color={changeBadgeColor} size="sm">
                {displayChange ?? 'n/a'}
              </Badge>
            </Group>
            <Text c="dimmed" size="sm">
              {displayName ?? 'n/a'}
            </Text>
            <Text size="sm">{contractType ?? 'Futures contract'}</Text>
            <Text size="sm" c="dimmed">
              Base asset: {baseAsset ?? 'n/a'} · Quote asset: {quoteAsset ?? 'n/a'}
            </Text>
          </Stack>
        </Group>
        <Group gap="xs" wrap="nowrap">
          <Text size="sm" c="dimmed">
            {displayLastPrice ?? 'n/a'}
          </Text>
          <ThemeIcon variant="light" color="teal" radius="xl" size="md">
            <IconArrowRight size={16} />
          </ThemeIcon>
        </Group>
      </Group>
    </Card>
  );
}
