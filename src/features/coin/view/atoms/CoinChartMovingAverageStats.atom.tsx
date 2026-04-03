import { Group, Text } from '@mantine/core';
import { formatChartPrice } from '../../logic/CoinChartFormat.logic';

type CoinChartMovingAverageStatsProps = {
  ma10Value: number | null;
  ma50Value: number | null;
  ma100Value: number | null;
  ma200Value: number | null;
};

export default function CoinChartMovingAverageStats({
  ma10Value,
  ma50Value,
  ma100Value,
  ma200Value,
}: CoinChartMovingAverageStatsProps) {
  return (
    <Group gap="md" wrap="wrap" mt={4}>
      <Text size="xs">
        MA(10){' '}
        <Text component="span" c="yellow" fw={600}>
          {formatChartPrice(ma10Value)}
        </Text>
      </Text>
      <Text size="xs">
        MA(50){' '}
        <Text component="span" c="pink" fw={600}>
          {formatChartPrice(ma50Value)}
        </Text>
      </Text>
      <Text size="xs">
        MA(100){' '}
        <Text component="span" c="grape" fw={600}>
          {formatChartPrice(ma100Value)}
        </Text>
      </Text>
      <Text size="xs">
        MA(200){' '}
        <Text component="span" c="indigo" fw={600}>
          {formatChartPrice(ma200Value)}
        </Text>
      </Text>
    </Group>
  );
}
