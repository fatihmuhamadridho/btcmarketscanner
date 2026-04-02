import { Stack, Text, Title } from '@mantine/core';
import type { HomeCoinsSectionHeaderProps } from '../../interface/HomeCoinsSection.interface';

export default function HomeCoinsSectionHeader({ marketItemCount }: HomeCoinsSectionHeaderProps) {
  return (
    <Stack gap={8}>
      <Title order={2} fz="h3">
        Coins
      </Title>
      <Text size="sm" c="dimmed">
        {marketItemCount} coins total · 10 per page
      </Text>
    </Stack>
  );
}
