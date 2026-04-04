import { Card, Divider, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { formatDecimalString } from '@utils/format-number.util';
import CoinMarketStructureCard from '../molecules/CoinMarketStructureCard.molecule';
import type { CoinTimeframeSupportResistance } from '../../interface/CoinView.interface';

type CoinMarketStructureSectionProps = {
  timeframeSupportResistance: ReadonlyArray<CoinTimeframeSupportResistance>;
};

export default function CoinMarketStructureSection({ timeframeSupportResistance }: CoinMarketStructureSectionProps) {
  const availableSupportResistance = timeframeSupportResistance
    .map((item) => item.supportResistance)
    .filter((item): item is NonNullable<CoinTimeframeSupportResistance['supportResistance']> => item !== null);

  const summary = availableSupportResistance.length
    ? {
        lowestSupport: Math.min(...availableSupportResistance.map((item) => item.support)),
        highestResistance: Math.max(...availableSupportResistance.map((item) => item.resistance)),
        averageSupport:
          availableSupportResistance.reduce((sum, item) => sum + item.support, 0) / availableSupportResistance.length,
        averageResistance:
          availableSupportResistance.reduce((sum, item) => sum + item.resistance, 0) /
          availableSupportResistance.length,
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
              isLoading={item.isLoading}
              label={item.label}
              support={item.supportResistance?.support ?? null}
              resistance={item.supportResistance?.resistance ?? null}
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
              ].map((item) => (
                <Stack key={item.label} gap={4}>
                  <Text c="dimmed" size="sm">
                    {item.label}
                  </Text>
                  <Text fw={700}>{formatDecimalString(item.value?.toString())}</Text>
                </Stack>
              ))}
            </SimpleGrid>
          </Stack>
        </Card>
      </Stack>
    </Card>
  );
}
