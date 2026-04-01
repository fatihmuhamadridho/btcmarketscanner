import { Badge, Group } from '@mantine/core';

type CoinTrendOverviewBadgesProps = {
  color: 'teal' | 'red' | 'gray';
  ma20: number | null;
  ma50: number | null;
  ma200: number | null;
  score: number;
  structure: string;
  structurePattern: 'HH/HL' | 'LH/LL' | 'Mixed';
  volumeRatio: number | null;
};

export default function CoinTrendOverviewBadges({
  color,
  ma20,
  ma50,
  ma200,
  score,
  structure,
  structurePattern,
  volumeRatio,
}: CoinTrendOverviewBadgesProps) {
  return (
    <Group gap="xs" wrap="wrap">
      <Badge variant="light" color={color}>
        Score {score > 0 ? '+' : ''}
        {score}
      </Badge>
      <Badge variant="light" color="gray">
        {structurePattern}
      </Badge>
      <Badge variant="light" color="gray">
        {structure}
      </Badge>
      <Badge variant="light" color="gray">
        MA20 {ma20 !== null ? ma20.toFixed(2) : 'n/a'}
      </Badge>
      <Badge variant="light" color="gray">
        MA50 {ma50 !== null ? ma50.toFixed(2) : 'n/a'}
      </Badge>
      <Badge variant="light" color="gray">
        MA200 {ma200 !== null ? ma200.toFixed(2) : 'n/a'}
      </Badge>
      <Badge variant="light" color="gray">
        Volume {volumeRatio !== null ? `x${volumeRatio.toFixed(2)}` : 'n/a'}
      </Badge>
    </Group>
  );
}
