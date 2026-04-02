import type { ReactNode } from 'react';
import { Card, Stack, Text, ThemeIcon } from '@mantine/core';

type CoinMetricCardProps = {
  icon: ReactNode;
  label: string;
  value: string;
};

export default function CoinMetricCard({ icon, label, value }: CoinMetricCardProps) {
  return (
    <Card
      radius="md"
      p="lg"
      withBorder
      style={{
        backgroundColor: 'rgba(9, 18, 33, 0.72)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <Stack gap="xs">
        <ThemeIcon variant="light" color="teal" radius="xl" size="lg">
          {icon}
        </ThemeIcon>
        <Text c="dimmed" size="sm">
          {label}
        </Text>
        <Text fw={700} fz="xl">
          {value}
        </Text>
      </Stack>
    </Card>
  );
}
