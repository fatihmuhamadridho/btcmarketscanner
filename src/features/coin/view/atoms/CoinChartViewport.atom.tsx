import { Text } from '@mantine/core';
import type { RefObject } from 'react';

type CoinChartViewportProps = {
  chartDataLength: number;
  chartError?: string | null;
  containerRef: RefObject<HTMLDivElement | null>;
  interval: string;
  isLoadingCandles: boolean;
  priceScaleOverlayRef: RefObject<HTMLDivElement | null>;
  viewportHeight: number | string;
  wrapperRef: RefObject<HTMLDivElement | null>;
};

export default function CoinChartViewport({
  chartDataLength,
  chartError,
  containerRef,
  interval,
  isLoadingCandles,
  priceScaleOverlayRef,
  viewportHeight,
  wrapperRef,
}: CoinChartViewportProps) {
  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'relative',
        height: viewportHeight,
        width: '100%',
      }}
    >
      {isLoadingCandles && chartDataLength === 0 ? (
        <div
          style={{
            alignItems: 'center',
            backdropFilter: 'blur(6px)',
            backgroundColor: 'rgba(9, 18, 33, 0.65)',
            borderRadius: 16,
            display: 'flex',
            inset: 0,
            justifyContent: 'center',
            position: 'absolute',
            zIndex: 3,
          }}
        >
          <Text c="dimmed" size="sm">
            Loading chart for {interval}...
          </Text>
        </div>
      ) : chartError ? (
        <div
          style={{
            alignItems: 'center',
            backdropFilter: 'blur(6px)',
            backgroundColor: 'rgba(9, 18, 33, 0.65)',
            borderRadius: 16,
            display: 'flex',
            inset: 0,
            justifyContent: 'center',
            position: 'absolute',
            zIndex: 3,
          }}
        >
          <Text c="red" size="sm">
            {chartError}
          </Text>
        </div>
      ) : null}
      <div
        ref={containerRef}
        style={{
          height: '100%',
          width: '100%',
        }}
      />
      <div
        aria-hidden="true"
        ref={priceScaleOverlayRef}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: 80,
          pointerEvents: 'auto',
          cursor: 'ns-resize',
          background: 'transparent',
          touchAction: 'none',
          zIndex: 2,
        }}
      />
    </div>
  );
}
