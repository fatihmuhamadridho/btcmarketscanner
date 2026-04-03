import { Card, SimpleGrid, Stack, Text } from '@mantine/core';
import type {
  CoinDistanceFromEntryFormatter,
  CoinPriceLevelFormatter,
  CoinSetupTarget,
} from '../../interface/CoinView.interface';

type CoinSetupTargetGridProps = {
  entryMid: number | null;
  direction: 'long' | 'short';
  formatDistanceFromEntry: CoinDistanceFromEntryFormatter;
  formatPriceLevel: CoinPriceLevelFormatter;
  stopLossColor: 'teal' | 'red';
  takeProfitColor: 'teal' | 'red';
  targets: CoinSetupTarget[];
};

export default function CoinSetupTargetGrid({
  entryMid,
  direction,
  formatDistanceFromEntry,
  formatPriceLevel,
  stopLossColor,
  takeProfitColor,
  targets,
}: CoinSetupTargetGridProps) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="sm">
      {targets.map((target) => {
        const color = target.label === 'Stop loss' ? stopLossColor : takeProfitColor;

        return (
          <Card
            key={target.label}
            radius="md"
            p={{ base: 'xs', sm: 'sm' }}
            withBorder
            style={{
              backgroundColor: 'rgba(255,255,255,0.02)',
              borderColor: 'rgba(255,255,255,0.06)',
            }}
          >
            <Stack gap={4}>
              <Text c="dimmed" size="xs">
                {target.label}
              </Text>
              <Text fw={700} c={color} lh={1.2}>
                {formatPriceLevel(target.price)}
              </Text>
              <Text c={color} size="xs" fw={600} lh={1.25}>
                {formatDistanceFromEntry(target.price, entryMid, direction)} from entry
              </Text>
            </Stack>
          </Card>
        );
      })}
    </SimpleGrid>
  );
}
