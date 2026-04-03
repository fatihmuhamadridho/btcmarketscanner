import { Badge, Card, Stack, Text } from '@mantine/core';
import { formatDecimalString } from '@utils/format-number.util';

type CoinMarketStructureCardProps = {
  isLoading: boolean;
  label: string;
  resistance: number | null;
  support: number | null;
};

export default function CoinMarketStructureCard({
  isLoading,
  label,
  resistance,
  support,
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
        <Text fw={700}>{label}</Text>
        {isLoading ? (
          <Badge variant="light" color="gray">
            Loading
          </Badge>
        ) : null}

        <Stack gap={4}>
          <Text c="dimmed" size="sm">
            Support
          </Text>
          <Text fw={700}>{formatDecimalString(support?.toString())}</Text>
        </Stack>

        <Stack gap={4}>
          <Text c="dimmed" size="sm">
            Resistance
          </Text>
          <Text fw={700}>{formatDecimalString(resistance?.toString())}</Text>
        </Stack>
      </Stack>
    </Card>
  );
}
