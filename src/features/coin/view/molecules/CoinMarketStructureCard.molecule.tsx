import { Badge, Card, SimpleGrid, Stack, Text } from '@mantine/core';
import { formatDecimalString } from '@utils/format-number.util';

type CoinMarketStructureCardProps = {
  isLoading: boolean;
  atr14: number | null;
  label: string;
  ema100: number | null;
  ema20: number | null;
  ema200: number | null;
  ema50: number | null;
  resistance: number | null;
  support: number | null;
  rsi14: number | null;
  trendDirection: 'bullish' | 'bearish' | 'sideways';
  trendLabel: string;
};

export default function CoinMarketStructureCard({
  isLoading,
  atr14,
  label,
  ema100,
  ema20,
  ema200,
  ema50,
  resistance,
  support,
  rsi14,
  trendDirection,
  trendLabel,
}: CoinMarketStructureCardProps) {
  return (
    <Card
      radius="md"
      p="lg"
      withBorder
      style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
      >
      <Stack gap={10}>
        <Stack gap={4}>
          <Text fw={700}>{label}</Text>
          <Badge variant="light" color={trendDirection === 'bullish' ? 'teal' : trendDirection === 'bearish' ? 'red' : 'gray'}>
            {trendLabel}
          </Badge>
          {isLoading ? (
            <Badge variant="light" color="gray">
              Loading
            </Badge>
          ) : null}
        </Stack>

        <SimpleGrid cols={2} spacing="sm">
          <Stack gap={2}>
            <Text c="dimmed" size="xs" tt="uppercase">
              Support
            </Text>
            <Text fw={700}>{formatDecimalString(support?.toString())}</Text>
          </Stack>
          <Stack gap={2}>
            <Text c="dimmed" size="xs" tt="uppercase">
              Resistance
            </Text>
            <Text fw={700}>{formatDecimalString(resistance?.toString())}</Text>
          </Stack>
          <Stack gap={2}>
            <Text c="dimmed" size="xs" tt="uppercase">
              ATR14
            </Text>
            <Text fw={700}>{atr14 !== null ? formatDecimalString(atr14.toFixed(2)) : 'n/a'}</Text>
          </Stack>
          <Stack gap={2}>
            <Text c="dimmed" size="xs" tt="uppercase">
              RSI14
            </Text>
            <Text fw={700}>{rsi14 !== null ? formatDecimalString(rsi14.toFixed(2)) : 'n/a'}</Text>
          </Stack>
          <Stack gap={2}>
            <Text c="dimmed" size="xs" tt="uppercase">
              EMA20
            </Text>
            <Text fw={700}>{ema20 !== null ? formatDecimalString(ema20.toFixed(2)) : 'n/a'}</Text>
          </Stack>
          <Stack gap={2}>
            <Text c="dimmed" size="xs" tt="uppercase">
              EMA50
            </Text>
            <Text fw={700}>{ema50 !== null ? formatDecimalString(ema50.toFixed(2)) : 'n/a'}</Text>
          </Stack>
          <Stack gap={2}>
            <Text c="dimmed" size="xs" tt="uppercase">
              EMA100
            </Text>
            <Text fw={700}>{ema100 !== null ? formatDecimalString(ema100.toFixed(2)) : 'n/a'}</Text>
          </Stack>
          <Stack gap={2}>
            <Text c="dimmed" size="xs" tt="uppercase">
              EMA200
            </Text>
            <Text fw={700}>{ema200 !== null ? formatDecimalString(ema200.toFixed(2)) : 'n/a'}</Text>
          </Stack>
        </SimpleGrid>
      </Stack>
    </Card>
  );
}
