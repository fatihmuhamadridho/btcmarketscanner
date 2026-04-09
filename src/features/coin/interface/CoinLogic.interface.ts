import type { TablerIcon } from '@tabler/icons-react';
import type {
  SetupCandle,
  SetupInsight,
  SetupPathStep,
  SupportResistance,
  TrendCandle,
  TrendDirection,
  TrendInsight as CoreTrendInsight,
} from 'btcmarketscanner-core';

export type { SetupCandle, SetupInsight, SetupPathStep, SupportResistance, TrendCandle, TrendDirection };

export type TrendInsight = CoreTrendInsight & {
  icon: TablerIcon;
};
