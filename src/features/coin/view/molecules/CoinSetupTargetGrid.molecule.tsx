import { Card, SimpleGrid, Stack, Text } from '@mantine/core';
import type {
  CoinDistanceFromEntryFormatter,
  CoinPriceLevelFormatter,
  CoinSetupTarget,
} from '../../interface/CoinView.interface';

type CoinSetupTargetGridProps = {
  entryMid: number | null;
  formatDistanceFromEntry: CoinDistanceFromEntryFormatter;
  formatPriceLevel: CoinPriceLevelFormatter;
  stopLossColor: 'teal' | 'red';
  takeProfitColor: 'teal' | 'red';
  targets: CoinSetupTarget[];
};

export default function CoinSetupTargetGrid({
  entryMid,
  formatDistanceFromEntry,
  formatPriceLevel,
  stopLossColor,
  takeProfitColor,
  targets,
}: CoinSetupTargetGridProps) {
  return (
    <SimpleGrid cols={4} spacing="sm">
      {targets.map((target) => {
        const color = target.label === 'Stop loss' ? stopLossColor : takeProfitColor;

        return (
          <Card
            key={target.label}
            radius="md"
            p="sm"
            withBorder
            style={{
              backgroundColor: 'rgba(255,255,255,0.02)',
              borderColor: 'rgba(255,255,255,0.06)',
            }}
          >
            <Stack gap={2}>
              <Text c="dimmed" size="xs">
                {target.label}
              </Text>
              <Text fw={700} c={color}>
                {formatPriceLevel(target.price)}
              </Text>
              <Text c={color} size="xs" fw={600}>
                {formatDistanceFromEntry(target.price, entryMid)} from entry
              </Text>
            </Stack>
          </Card>
        );
      })}
    </SimpleGrid>
  );
}
