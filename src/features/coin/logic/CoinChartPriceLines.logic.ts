import { useEffect } from 'react';
import { LineStyle } from 'lightweight-charts';
import type { MutableRefObject } from 'react';
import type { IPriceLine, ISeriesApi } from 'lightweight-charts';
import type { TimeframeSupportResistance } from '@core/binance/futures/market/infrastructure/futuresMarket.hook';
import type { CoinTimeframe } from '../interface/CoinView.interface';

type CoinChartPriceLinesProps = {
  interval: CoinTimeframe;
  isChartReady: boolean;
  seriesRef: MutableRefObject<ISeriesApi<'Candlestick'> | null>;
  supportResistance: {
    support: number;
    resistance: number;
  } | null;
  strongSupportResistanceLevel: TimeframeSupportResistance | null;
  supportPriceLineRef: MutableRefObject<IPriceLine | null>;
  resistancePriceLineRef: MutableRefObject<IPriceLine | null>;
  strongSupportPriceLineRef: MutableRefObject<IPriceLine | null>;
  strongResistancePriceLineRef: MutableRefObject<IPriceLine | null>;
};

export function useCoinChartPriceLines({
  interval,
  isChartReady,
  seriesRef,
  supportResistance,
  strongSupportResistanceLevel,
  supportPriceLineRef,
  resistancePriceLineRef,
  strongSupportPriceLineRef,
  strongResistancePriceLineRef,
}: CoinChartPriceLinesProps) {
  useEffect(() => {
    const series = seriesRef.current;

    if (!isChartReady || !series) {
      return undefined;
    }

    const removeExistingPriceLines = () => {
      if (supportPriceLineRef.current) {
        try {
          series.removePriceLine(supportPriceLineRef.current);
        } catch {
          // The chart can already be disposed during interval remounts.
        }
        supportPriceLineRef.current = null;
      }

      if (resistancePriceLineRef.current) {
        try {
          series.removePriceLine(resistancePriceLineRef.current);
        } catch {
          // The chart can already be disposed during interval remounts.
        }
        resistancePriceLineRef.current = null;
      }
    };

    const removeStrongPriceLines = () => {
      if (strongSupportPriceLineRef.current) {
        try {
          series.removePriceLine(strongSupportPriceLineRef.current);
        } catch {
          // Ignore disposed series during interval remounts.
        }
        strongSupportPriceLineRef.current = null;
      }

      if (strongResistancePriceLineRef.current) {
        try {
          series.removePriceLine(strongResistancePriceLineRef.current);
        } catch {
          // Ignore disposed series during interval remounts.
        }
        strongResistancePriceLineRef.current = null;
      }
    };

    removeExistingPriceLines();
    removeStrongPriceLines();

    if (
      !supportResistance ||
      !Number.isFinite(supportResistance.support) ||
      !Number.isFinite(supportResistance.resistance)
    ) {
      return undefined;
    }

    const supportColor = 'rgba(87, 199, 166, 0.95)';
    const resistanceColor = 'rgba(237, 85, 101, 0.95)';

    try {
      supportPriceLineRef.current = series.createPriceLine({
        price: supportResistance.support,
        color: supportColor,
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        lineVisible: true,
        axisLabelVisible: true,
        title: 'Support',
        axisLabelColor: supportColor,
        axisLabelTextColor: '#ffffff',
      });

      resistancePriceLineRef.current = series.createPriceLine({
        price: supportResistance.resistance,
        color: resistanceColor,
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        lineVisible: true,
        axisLabelVisible: true,
        title: 'Resistance',
        axisLabelColor: resistanceColor,
        axisLabelTextColor: '#ffffff',
      });
    } catch {
      supportPriceLineRef.current = null;
      resistancePriceLineRef.current = null;
    }

    if (
      strongSupportResistanceLevel &&
      strongSupportResistanceLevel.interval !== interval &&
      strongSupportResistanceLevel.supportResistance &&
      Number.isFinite(strongSupportResistanceLevel.supportResistance.support) &&
      Number.isFinite(strongSupportResistanceLevel.supportResistance.resistance)
    ) {
      const level = strongSupportResistanceLevel.supportResistance;
      const supportColor = 'rgba(103, 232, 249, 0.68)';
      const resistanceColor = 'rgba(251, 146, 60, 0.68)';

      try {
        strongSupportPriceLineRef.current = series.createPriceLine({
          price: level.support,
          color: supportColor,
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          lineVisible: true,
          axisLabelVisible: true,
          title: 'Strong Support',
          axisLabelColor: supportColor,
          axisLabelTextColor: '#ffffff',
        });

        strongResistancePriceLineRef.current = series.createPriceLine({
          price: level.resistance,
          color: resistanceColor,
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          lineVisible: true,
          axisLabelVisible: true,
          title: 'Strong Resistance',
          axisLabelColor: resistanceColor,
          axisLabelTextColor: '#ffffff',
        });
      } catch {
        // Ignore line creation failures on transient remounts.
      }
    }

  }, [
    interval,
    isChartReady,
    seriesRef,
    strongResistancePriceLineRef,
    strongSupportPriceLineRef,
    strongSupportResistanceLevel,
    resistancePriceLineRef,
    supportPriceLineRef,
    supportResistance,
  ]);
}
