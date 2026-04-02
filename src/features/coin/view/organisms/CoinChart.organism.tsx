import { useEffect, useState } from 'react';
import { Box, Card, Stack } from '@mantine/core';
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const candleChange = displayedCandle ? displayedCandle.close - displayedCandle.open : 0;
  const candleRange = displayedCandle ? displayedCandle.high - displayedCandle.low : 0;
  const candleChangePercent =
    displayedCandle && displayedCandle.open !== 0 ? (candleChange / displayedCandle.open) * 100 : 0;
  const candleRangePercent =
    displayedCandle && displayedCandle.open !== 0 ? (candleRange / displayedCandle.open) * 100 : 0;
  const candleTextColor = displayedCandle && displayedCandle.close >= displayedCandle.open ? 'teal' : 'red';

  useEffect(() => {
    if (!isFullscreen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  return (
    <Box
      style={{
        position: isFullscreen ? 'fixed' : 'relative',
        inset: isFullscreen ? 0 : undefined,
        zIndex: isFullscreen ? 220 : 'auto',
        background: isFullscreen ? 'rgba(6, 11, 20, 0.96)' : 'transparent',
        padding: isFullscreen ? '16px 20px' : 0,
      }}
    >
      <Card
        radius={isFullscreen ? 0 : 'lg'}
        p={{ base: 20, sm: 28 }}
        withBorder
        style={{
          backgroundColor: 'rgba(9, 18, 33, 0.88)',
          borderColor: 'rgba(255,255,255,0.08)',
          boxShadow: isFullscreen ? 'none' : undefined,
          minHeight: isFullscreen ? '100%' : undefined,
        }}
      >
      <Stack gap="md">
        <CoinChartHeader
          hasMoreOlderCandles={hasMoreOlderCandles}
          isFullscreen={isFullscreen}
          interval={interval}
          intervals={intervals}
          isLoadingMore={isLoadingMore}
          onIntervalChange={onIntervalChange}
          onToggleFullscreen={() => setIsFullscreen((value) => !value)}
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
          viewportHeight={isFullscreen ? 'calc(100vh - 220px)' : 360}
          wrapperRef={wrapperRef}
        />
      </Stack>
      </Card>
    </Box>
  );
}
