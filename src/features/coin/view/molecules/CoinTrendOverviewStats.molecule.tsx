import { SimpleGrid } from '@mantine/core';
import CoinTrendMetricCard from './CoinTrendMetricCard.molecule';

type CoinTrendOverviewStatsProps = {
  endPrice: number | null;
  rangePercent: number;
  startPrice: number | null;
};

export default function CoinTrendOverviewStats({
  endPrice,
  rangePercent,
  startPrice,
}: CoinTrendOverviewStatsProps) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
      <CoinTrendMetricCard
        label="Start price"
        value={startPrice !== null ? startPrice.toFixed(2) : 'n/a'}
      />
      <CoinTrendMetricCard
        label="Latest price"
        value={endPrice !== null ? endPrice.toFixed(2) : 'n/a'}
      />
      <CoinTrendMetricCard label="Range" value={`${rangePercent.toFixed(2)}%`} />
    </SimpleGrid>
  );
}
