import { Stack, Text } from '@mantine/core';

type CoinTrendReasonListProps = {
  reasons: string[];
};

export default function CoinTrendReasonList({ reasons }: CoinTrendReasonListProps) {
  return (
    <Stack gap={6}>
      {reasons.map((reason) => (
        <Text key={reason} size="sm" c="dimmed">
          • {reason}
        </Text>
      ))}
    </Stack>
  );
}
