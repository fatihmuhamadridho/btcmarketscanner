import { Card, Divider, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { formatPriceLevel } from '../../logic/CoinFormat.logic';
import CoinMarketStructureCard from '../molecules/CoinMarketStructureCard.molecule';
import type { CoinTimeframeSupportResistance } from '../../interface/CoinView.interface';

type CoinMarketStructureSectionProps = {
  timeframeSupportResistance: ReadonlyArray<CoinTimeframeSupportResistance>;
};

export default function CoinMarketStructureSection({ timeframeSupportResistance }: CoinMarketStructureSectionProps) {
  const availableSupportResistance = timeframeSupportResistance
    .map((item) => item.supportResistance)
    .filter((item): item is NonNullable<CoinTimeframeSupportResistance['supportResistance']> => item !== null);

  function getAverageMetric<T extends CoinTimeframeSupportResistance>(
    items: ReadonlyArray<T>,
    selector: (item: T) => number | null
  ) {
    const values = items.map(selector).filter((value): value is number => value !== null);

    if (values.length === 0) {
      return null;
    }

    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  const summary = availableSupportResistance.length
    ? {
        lowestSupport: Math.min(...availableSupportResistance.map((item) => item.support)),
        highestResistance: Math.max(...availableSupportResistance.map((item) => item.resistance)),
        averageSupport:
          availableSupportResistance.reduce((sum, item) => sum + item.support, 0) / availableSupportResistance.length,
        averageResistance:
          availableSupportResistance.reduce((sum, item) => sum + item.resistance, 0) /
          availableSupportResistance.length,
        averageAtr14: getAverageMetric(timeframeSupportResistance, (item) => item.atr14),
        averageRsi14: getAverageMetric(timeframeSupportResistance, (item) => item.rsi14),
        averageEma20: getAverageMetric(timeframeSupportResistance, (item) => item.ema20),
        averageEma50: getAverageMetric(timeframeSupportResistance, (item) => item.ema50),
        averageEma100: getAverageMetric(timeframeSupportResistance, (item) => item.ema100),
        averageEma200: getAverageMetric(timeframeSupportResistance, (item) => item.ema200),
      }
    : null;

  return (
    <Card
      radius="lg"
      p={{ base: 20, sm: 28 }}
      withBorder
      style={{
        backgroundColor: 'rgba(9, 18, 33, 0.88)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <Stack gap="lg">
        <Group justify="space-between" align="center" wrap="wrap">
          <Stack gap={4}>
            <Title order={2} fz="h3">
              Market Structure
            </Title>
            <Text c="dimmed" size="sm">
              Short-term, medium-term, and long-term support structure
            </Text>
          </Stack>
        </Group>

        <Divider color="rgba(255,255,255,0.08)" />
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
          {timeframeSupportResistance.map((item) => (
            <CoinMarketStructureCard
              key={item.interval}
              atr14={item.atr14}
              isLoading={item.isLoading}
              label={item.label}
              ema100={item.ema100}
              ema20={item.ema20}
              ema200={item.ema200}
              ema50={item.ema50}
              support={item.supportResistance?.support ?? null}
              resistance={item.supportResistance?.resistance ?? null}
              rsi14={item.rsi14}
              trendDirection={item.trendDirection}
              trendLabel={item.trendLabel}
            />
          ))}
        </SimpleGrid>

        <Card
          radius="md"
          p="md"
          withBorder
          style={{
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        >
          <Stack gap={10}>
            <Text fw={700}>Market Structure Summary</Text>
            <Text c="dimmed" size="sm">
              Aggregated from all available timeframes.
            </Text>

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
              {[
                { label: 'Lowest support', value: summary?.lowestSupport },
                { label: 'Highest resistance', value: summary?.highestResistance },
                { label: 'Average support', value: summary?.averageSupport },
                { label: 'Average resistance', value: summary?.averageResistance },
                { label: 'Average ATR14', value: summary?.averageAtr14 },
                { label: 'Average RSI14', value: summary?.averageRsi14 },
                { label: 'Average EMA20', value: summary?.averageEma20 },
                { label: 'Average EMA50', value: summary?.averageEma50 },
                { label: 'Average EMA100', value: summary?.averageEma100 },
                { label: 'Average EMA200', value: summary?.averageEma200 },
              ].map((item) => (
                <Stack key={item.label} gap={4}>
                  <Text c="dimmed" size="sm">
                    {item.label}
                  </Text>
                  <Text fw={700}>{formatPriceLevel(item.value ?? null)}</Text>
                </Stack>
              ))}
            </SimpleGrid>
          </Stack>
        </Card>
      </Stack>
    </Card>
  );
}
