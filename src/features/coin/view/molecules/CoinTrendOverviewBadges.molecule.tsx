import { Badge, Group } from '@mantine/core';
import { formatDecimalString } from '@utils/format-number.util';

type CoinTrendOverviewBadgesProps = {
  atr14: number | null;
  color: 'teal' | 'red' | 'gray';
  ma20: number | null;
  ma50: number | null;
  ma200: number | null;
  rsi14: number | null;
  score: number;
  structure: string;
  structurePattern: 'HH/HL' | 'LH/LL' | 'Mixed';
  volumeRatio: number | null;
};

export default function CoinTrendOverviewBadges({
  atr14,
  color,
  ma20,
  ma50,
  ma200,
  rsi14,
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
        ATR14 {atr14 !== null ? formatDecimalString(atr14.toFixed(2)) : 'n/a'}
      </Badge>
      <Badge variant="light" color="gray">
        RSI14 {rsi14 !== null ? rsi14.toFixed(2) : 'n/a'}
      </Badge>
      <Badge variant="light" color="gray">
        Volume {volumeRatio !== null ? `x${volumeRatio.toFixed(2)}` : 'n/a'}
      </Badge>
    </Group>
  );
}
