import { SimpleGrid } from '@mantine/core';
import { formatDecimalString } from '@utils/format-number.util';
import CoinTrendMetricCard from './CoinTrendMetricCard.molecule';

type CoinTrendOverviewStatsProps = {
  atr14: number | null;
  endPrice: number | null;
  rangePercent: number;
  rsi14: number | null;
  startPrice: number | null;
};

export default function CoinTrendOverviewStats({
  atr14,
  endPrice,
  rangePercent,
  rsi14,
  startPrice,
}: CoinTrendOverviewStatsProps) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, xl: 5 }} spacing="md">
      <CoinTrendMetricCard
        label="Start price"
        value={startPrice !== null ? formatDecimalString(startPrice.toFixed(2)) : 'n/a'}
      />
      <CoinTrendMetricCard
        label="Latest price"
        value={endPrice !== null ? formatDecimalString(endPrice.toFixed(2)) : 'n/a'}
      />
      <CoinTrendMetricCard label="Range" value={`${formatDecimalString(rangePercent.toFixed(2))}%`} />
      <CoinTrendMetricCard label="ATR14" value={atr14 !== null ? formatDecimalString(atr14.toFixed(2)) : 'n/a'} />
      <CoinTrendMetricCard label="RSI14" value={rsi14 !== null ? formatDecimalString(rsi14.toFixed(2)) : 'n/a'} />
    </SimpleGrid>
  );
}
