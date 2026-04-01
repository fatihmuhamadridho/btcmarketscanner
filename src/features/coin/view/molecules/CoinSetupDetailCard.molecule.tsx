import { Badge, Card, Group, Stack, Text } from '@mantine/core';
import CoinSetupPathGrid from './CoinSetupPathGrid.molecule';
import CoinSetupTargetGrid from './CoinSetupTargetGrid.molecule';
import type {
  CoinDistanceFromEntryFormatter,
  CoinPriceLevelFormatter,
  CoinPriceZoneFormatter,
  CoinSetupDetail,
} from '../../interface/CoinView.interface';

type CoinSetupDetailCardProps = {
  formatDistanceFromEntry: CoinDistanceFromEntryFormatter;
  formatPriceLevel: CoinPriceLevelFormatter;
  setup: CoinSetupDetail;
  formatPriceZone: CoinPriceZoneFormatter;
};

export default function CoinSetupDetailCard({
  formatDistanceFromEntry,
  formatPriceLevel,
  setup,
  formatPriceZone,
}: CoinSetupDetailCardProps) {
  const setupColor = setup.direction === 'long' ? 'teal' : 'red';
  const takeProfitColor = setup.direction === 'long' ? 'teal' : 'red';
  const stopLossColor = setup.direction === 'long' ? 'red' : 'teal';
  const targets = [
    { label: 'TP1' as const, price: setup.takeProfits[0].price },
    { label: 'TP2' as const, price: setup.takeProfits[1].price },
    { label: 'TP3' as const, price: setup.takeProfits[2].price },
    { label: 'Stop loss' as const, price: setup.stopLoss },
  ];

  return (
    <Card
      radius="xl"
      p="lg"
      withBorder
      h="100%"
      style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <Stack gap={4}>
            <Badge color={setupColor} variant="light" size="lg">
              {setup.label}
            </Badge>
            <Text c="dimmed" size="sm">
              {setup.marketCondition}
            </Text>
          </Stack>
          <Badge variant="light" color="gray">
            {setup.grade}
          </Badge>
        </Group>

        <Group gap="xs" wrap="wrap">
          <Badge variant="light" color="gray">
            Entry zone {formatPriceZone(setup.entryZone)}
          </Badge>
          <Badge variant="light" color="gray">
            {setup.pathMode}
          </Badge>
          <Badge variant="light" color="gray">
            RR {setup.riskReward !== null ? `1:${setup.riskReward.toFixed(2)}` : 'n/a'}
          </Badge>
        </Group>

        <CoinSetupPathGrid path={setup.path} setupColor={setupColor} />

        <CoinSetupTargetGrid
          entryMid={setup.entryMid}
          stopLossColor={stopLossColor}
          takeProfitColor={takeProfitColor}
          formatDistanceFromEntry={formatDistanceFromEntry}
          formatPriceLevel={formatPriceLevel}
          targets={targets}
        />

        <Group gap="xs" wrap="wrap">
          <Badge variant="light" color="gray">
            Grade rank {setup.gradeRank}
          </Badge>
        </Group>

        <Stack gap={6}>
          {setup.reasons.map((reason) => (
            <Text key={reason} size="sm" c="dimmed">
              • {reason}
            </Text>
          ))}
        </Stack>
      </Stack>
    </Card>
  );
}
