import { Card, Stack, Text } from '@mantine/core';

type HomeStatCardProps = {
  label: string;
  value: string;
};

export default function HomeStatCard({ label, value }: HomeStatCardProps) {
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
        <Text c="dimmed" size="xs" tt="uppercase" style={{ letterSpacing: 1 }}>
          {label}
        </Text>
        <Text fw={700} fz="xl">
          {value}
        </Text>
      </Stack>
    </Card>
  );
}
