import { Divider, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import CoinMarketStructureCard from '../molecules/CoinMarketStructureCard.molecule';

type TimeframeSupportResistance = {
  interval: string;
  isLoading: boolean;
  label: string;
  supportResistance: {
    support: number;
    resistance: number;
  } | null;
};

type CoinMarketStructureSectionProps = {
  timeframeSupportResistance: ReadonlyArray<TimeframeSupportResistance>;
};

export default function CoinMarketStructureSection({ timeframeSupportResistance }: CoinMarketStructureSectionProps) {
  return (
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
    </Stack>
  );
}
