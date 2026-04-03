import { Stack } from '@mantine/core';
import CoinChartCandleStats from '../atoms/CoinChartCandleStats.atom';
import CoinChartMovingAverageStats from '../atoms/CoinChartMovingAverageStats.atom';

type CoinChartStatsProps = {
  candleChange: number;
  candleChangePercent: number;
  candleRange: number;
  candleRangePercent: number;
  candleTextColor: 'teal' | 'red';
  displayedCandle: {
    close: number;
    high: number;
    low: number;
    open: number;
    time: number;
  } | null;
  formatChartTime: (value?: number) => string;
  formatPercent: (value: number) => string;
  ma10Value: number | null;
  ma50Value: number | null;
  ma100Value: number | null;
  ma200Value: number | null;
};

export default function CoinChartStats({
  candleChange,
  candleChangePercent,
  candleRange,
  candleRangePercent,
  candleTextColor,
  displayedCandle,
  formatChartTime,
  formatPercent,
  ma10Value,
  ma50Value,
  ma100Value,
  ma200Value,
}: CoinChartStatsProps) {
  if (!displayedCandle) {
    return null;
  }

  return (
    <Stack
      gap={4}
      align="flex-start"
      style={{
        borderTop: '1px solid rgba(255,255,255,0.08)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        paddingTop: 10,
        paddingBottom: 10,
        fontSize: 12,
      }}
    >
      <CoinChartCandleStats
        candleChange={candleChange}
        candleChangePercent={candleChangePercent}
        candleRange={candleRange}
        candleRangePercent={candleRangePercent}
        candleTextColor={candleTextColor}
        displayedCandle={displayedCandle}
        formatChartTime={formatChartTime}
        formatPercent={formatPercent}
      />
      <CoinChartMovingAverageStats
        ma10Value={ma10Value}
        ma50Value={ma50Value}
        ma100Value={ma100Value}
        ma200Value={ma200Value}
      />
    </Stack>
  );
}
