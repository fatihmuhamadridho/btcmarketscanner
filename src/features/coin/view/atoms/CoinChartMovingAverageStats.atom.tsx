import { Group, Text } from '@mantine/core';
import { formatDecimalString } from '@utils/format-number.util';

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
          {formatDecimalString(ma10Value?.toFixed(2))}
        </Text>
      </Text>
      <Text size="xs">
        MA(50){' '}
        <Text component="span" c="pink" fw={600}>
          {formatDecimalString(ma50Value?.toFixed(2))}
        </Text>
      </Text>
      <Text size="xs">
        MA(100){' '}
        <Text component="span" c="grape" fw={600}>
          {formatDecimalString(ma100Value?.toFixed(2))}
        </Text>
      </Text>
      <Text size="xs">
        MA(200){' '}
        <Text component="span" c="indigo" fw={600}>
          {formatDecimalString(ma200Value?.toFixed(2))}
        </Text>
      </Text>
    </Group>
  );
}
