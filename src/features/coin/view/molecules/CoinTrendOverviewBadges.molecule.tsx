import { Badge, Group } from '@mantine/core';
import { formatDecimalString } from '@utils/format-number.util';

type CoinTrendOverviewBadgesProps = {
  atr14: number | null;
  color: 'teal' | 'red' | 'gray';
  ema20: number | null;
  ema50: number | null;
  ema200: number | null;
  rsi14: number | null;
  score: number;
  structure: string;
  structurePattern: 'HH/HL' | 'LH/LL' | 'Mixed';
  volumeRatio: number | null;
};

export default function CoinTrendOverviewBadges({
  atr14,
  color,
  ema20,
  ema50,
  ema200,
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
        EMA20 {ema20 !== null ? formatDecimalString(ema20.toFixed(2)) : 'n/a'}
      </Badge>
      <Badge variant="light" color="gray">
        EMA50 {ema50 !== null ? formatDecimalString(ema50.toFixed(2)) : 'n/a'}
      </Badge>
      <Badge variant="light" color="gray">
        EMA200 {ema200 !== null ? formatDecimalString(ema200.toFixed(2)) : 'n/a'}
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
