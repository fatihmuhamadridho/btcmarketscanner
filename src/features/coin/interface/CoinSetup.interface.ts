import type { SetupCandle, SetupInsight, SupportResistance, TrendInsight } from './CoinLogic.interface';

export type CoinSetupSide = 'long' | 'short';

export type CoinSetupPathStatus = {
  break: boolean;
  rejection: boolean;
  retest: boolean;
};

export type CoinSetupAnalysisContext = {
  atr: number | null;
  breakdownShort: boolean;
  breakoutLong: boolean;
  bullishStructure: boolean;
  bearishStructure: boolean;
  candles: SetupCandle[];
  continuationMode: boolean;
  lastPrice: number;
  maScore: number;
  nearResistance: boolean;
  nearSupport: boolean;
  orderedCandles: SetupCandle[];
  pathMode: SetupInsight['pathMode'];
  pathStatus: CoinSetupPathStatus;
  range: number;
  side: CoinSetupSide;
  scoreBase: number;
  structureScore: number;
  stopBuffer: number;
  supportResistance: SupportResistance;
  targetBuffer: number;
  trendBiasScore: number;
  trendSummary: TrendInsight;
  volumeScore: number;
  zoneBuffer: number;
};
