import { Card, Stack, Text } from '@mantine/core';

type CoinTrendMetricCardProps = {
  label: string;
  value: string;
};

export default function CoinTrendMetricCard({ label, value }: CoinTrendMetricCardProps) {
  return (
    <Card
      radius="lg"
      p="md"
      withBorder
      style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <Stack gap={4}>
        <Text c="dimmed" size="sm">
          {label}
        </Text>
        <Text fw={700}>{value}</Text>
      </Stack>
    </Card>
  );
}
