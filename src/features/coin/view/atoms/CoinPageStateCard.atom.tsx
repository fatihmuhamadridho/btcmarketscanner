import { Paper, Text } from '@mantine/core';

type CoinPageStateCardProps = {
  message: string;
};

export default function CoinPageStateCard({ message }: CoinPageStateCardProps) {
  return (
    <Paper
      radius="xl"
      p={{ base: 20, sm: 28 }}
      withBorder
      style={{
        backgroundColor: 'rgba(9, 18, 33, 0.88)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <Text c="dimmed" size="sm">
        {message}
      </Text>
    </Paper>
  );
}
