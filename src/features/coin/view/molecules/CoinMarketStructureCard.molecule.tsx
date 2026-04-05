import { Badge, Card, SimpleGrid, Stack, Text } from '@mantine/core';
import { formatDecimalString } from '@utils/format-number.util';
import { formatPriceLevel } from '../../logic/CoinFormat.logic';

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
  function formatCompactIndicatorValue(value: number | null) {
    if (value === null) {
      return 'n/a';
    }

    return formatDecimalString(value.toFixed(Math.abs(value) < 1 ? 6 : 2));
  }

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

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          <Stack gap={2} style={{ minWidth: 0 }}>
            <Text c="dimmed" size="xs" tt="uppercase">
              Support
            </Text>
            <Text fw={700} style={{ lineHeight: 1.15, wordBreak: 'break-word', fontVariantNumeric: 'tabular-nums' }}>
              {formatPriceLevel(support)}
            </Text>
          </Stack>
          <Stack gap={2} style={{ minWidth: 0 }}>
            <Text c="dimmed" size="xs" tt="uppercase">
              Resistance
            </Text>
            <Text fw={700} style={{ lineHeight: 1.15, wordBreak: 'break-word', fontVariantNumeric: 'tabular-nums' }}>
              {formatPriceLevel(resistance)}
            </Text>
          </Stack>
          <Stack gap={2} style={{ minWidth: 0 }}>
            <Text c="dimmed" size="xs" tt="uppercase">
              ATR14
            </Text>
            <Text fw={700} style={{ lineHeight: 1.15, wordBreak: 'break-word', fontVariantNumeric: 'tabular-nums' }}>
              {formatCompactIndicatorValue(atr14)}
            </Text>
          </Stack>
          <Stack gap={2} style={{ minWidth: 0 }}>
            <Text c="dimmed" size="xs" tt="uppercase">
              RSI14
            </Text>
            <Text fw={700} style={{ lineHeight: 1.15, wordBreak: 'break-word', fontVariantNumeric: 'tabular-nums' }}>
              {rsi14 !== null ? formatDecimalString(rsi14.toFixed(2)) : 'n/a'}
            </Text>
          </Stack>
          <Stack gap={2} style={{ minWidth: 0 }}>
            <Text c="dimmed" size="xs" tt="uppercase">
              EMA20
            </Text>
            <Text fw={700} style={{ lineHeight: 1.15, wordBreak: 'break-word', fontVariantNumeric: 'tabular-nums' }}>
              {formatCompactIndicatorValue(ema20)}
            </Text>
          </Stack>
          <Stack gap={2} style={{ minWidth: 0 }}>
            <Text c="dimmed" size="xs" tt="uppercase">
              EMA50
            </Text>
            <Text fw={700} style={{ lineHeight: 1.15, wordBreak: 'break-word', fontVariantNumeric: 'tabular-nums' }}>
              {formatCompactIndicatorValue(ema50)}
            </Text>
          </Stack>
          <Stack gap={2} style={{ minWidth: 0 }}>
            <Text c="dimmed" size="xs" tt="uppercase">
              EMA100
            </Text>
            <Text fw={700} style={{ lineHeight: 1.15, wordBreak: 'break-word', fontVariantNumeric: 'tabular-nums' }}>
              {formatCompactIndicatorValue(ema100)}
            </Text>
          </Stack>
          <Stack gap={2} style={{ minWidth: 0 }}>
            <Text c="dimmed" size="xs" tt="uppercase">
              EMA200
            </Text>
            <Text fw={700} style={{ lineHeight: 1.15, wordBreak: 'break-word', fontVariantNumeric: 'tabular-nums' }}>
              {formatCompactIndicatorValue(ema200)}
            </Text>
          </Stack>
        </SimpleGrid>
      </Stack>
    </Card>
  );
}
