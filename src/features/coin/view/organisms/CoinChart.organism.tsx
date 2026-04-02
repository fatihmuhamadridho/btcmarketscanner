import { Card, Stack } from '@mantine/core';
import type { CoinChartProps } from '../../interface/CoinView.interface';
import CoinChartHeader from '../molecules/CoinChartHeader.molecule';
import CoinChartStats from '../molecules/CoinChartStats.molecule';
import CoinChartViewport from '../atoms/CoinChartViewport.atom';

export default function CoinChart({
  chartData,
  chartError,
  containerRef,
  displayedCandle,
  formatChartTime,
  formatPercent,
  hasMoreOlderCandles,
  interval,
  intervals,
  isLoadingCandles,
  isLoadingMore,
  ma100Value,
  ma10Value,
  ma200Value,
  ma50Value,
  onIntervalChange,
  priceScaleOverlayRef,
  symbol,
  wrapperRef,
}: CoinChartProps) {
  const candleChange = displayedCandle ? displayedCandle.close - displayedCandle.open : 0;
  const candleRange = displayedCandle ? displayedCandle.high - displayedCandle.low : 0;
  const candleChangePercent =
    displayedCandle && displayedCandle.open !== 0 ? (candleChange / displayedCandle.open) * 100 : 0;
  const candleRangePercent =
    displayedCandle && displayedCandle.open !== 0 ? (candleRange / displayedCandle.open) * 100 : 0;
  const candleTextColor = displayedCandle && displayedCandle.close >= displayedCandle.open ? 'teal' : 'red';

  return (
    <Card
      radius="xl"
      p={{ base: 20, sm: 28 }}
      withBorder
      style={{
        backgroundColor: 'rgba(9, 18, 33, 0.88)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <Stack gap="md">
        <CoinChartHeader
          hasMoreOlderCandles={hasMoreOlderCandles}
          interval={interval}
          intervals={intervals}
          isLoadingMore={isLoadingMore}
          onIntervalChange={onIntervalChange}
          symbol={symbol}
        />

        <CoinChartStats
          candleChange={candleChange}
          candleChangePercent={candleChangePercent}
          candleRange={candleRange}
          candleRangePercent={candleRangePercent}
          candleTextColor={candleTextColor}
          displayedCandle={displayedCandle}
          formatChartTime={formatChartTime}
          formatPercent={formatPercent}
          ma10Value={ma10Value}
          ma50Value={ma50Value}
          ma100Value={ma100Value}
          ma200Value={ma200Value}
        />

        <CoinChartViewport
          chartDataLength={chartData.length}
          chartError={chartError}
          containerRef={containerRef}
          interval={interval}
          isLoadingCandles={isLoadingCandles}
          priceScaleOverlayRef={priceScaleOverlayRef}
          wrapperRef={wrapperRef}
        />
      </Stack>
    </Card>
  );
}
