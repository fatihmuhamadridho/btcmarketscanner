import type { RefObject } from 'react';

export type CoinTimeframe = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d';

export type CoinPageProps = {
  symbol?: string;
};

export type CoinTimeframeOption = {
  label: string;
  value: CoinTimeframe;
};

export type CoinChartDisplayedCandle = {
  close: number;
  high: number;
  low: number;
  open: number;
  time: number;
};

export type CoinChartViewModel = {
  chartData: Array<{
    close: number;
    high: number;
    low: number;
    open: number;
    time: number;
  }>;
  chartError?: string | null;
  containerRef: RefObject<HTMLDivElement | null>;
  displayedCandle: CoinChartDisplayedCandle | null;
  formatChartTime: (value?: number) => string;
  formatPercent: (value: number) => string;
  formatSignedDecimal: (value: number) => string;
  hasMoreOlderCandles: boolean;
  interval: CoinTimeframe;
  intervals: ReadonlyArray<CoinTimeframeOption>;
  isLoadingCandles: boolean;
  isLoadingMore: boolean;
  ma10Value: number | null;
  ma50Value: number | null;
  ma100Value: number | null;
  ma200Value: number | null;
  onIntervalChange: (interval: CoinTimeframe) => void;
  priceScaleOverlayRef: RefObject<HTMLDivElement | null>;
  wrapperRef: RefObject<HTMLDivElement | null>;
};

export type CoinChartProps = CoinChartViewModel & {
  symbol: string;
};

export type CoinSetupPathStep = {
  label: string;
  status: 'done' | 'current' | 'pending';
};

export type CoinSetupTarget = {
  label: 'TP1' | 'TP2' | 'TP3' | 'Stop loss';
  price: number | null;
};

export type CoinSetupDetail = {
  direction: 'long' | 'short';
  entryMid: number | null;
  entryZone: {
    high: number | null;
    low: number | null;
  };
  grade: 'A+' | 'A' | 'B' | 'C';
  gradeRank: number;
  label: string;
  marketCondition: string;
  pathMode: 'breakout' | 'continuation';
  path: CoinSetupPathStep[];
  takeProfits: Array<{
    label: 'TP1' | 'TP2' | 'TP3';
    price: number | null;
  }>;
  reasons: string[];
  riskReward: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
};

export type CoinSetupPreferred = Pick<CoinSetupDetail, 'direction' | 'grade' | 'label'>;

export type CoinTrendSummary = {
  changePercent: number;
  color: 'teal' | 'red' | 'gray';
  endPrice: number | null;
  label: string;
  ma20: number | null;
  ma50: number | null;
  ma200: number | null;
  reasons: string[];
  rangePercent: number;
  score: number;
  startPrice: number | null;
  structurePattern: 'HH/HL' | 'LH/LL' | 'Mixed';
  structure: string;
  volumeRatio: number | null;
};

export type CoinMarketSymbol = {
  baseAsset?: string | null;
  contractType?: string | null;
  displayName?: string;
  pair?: string | null;
  quoteAsset?: string | null;
  status?: string | null;
  symbol?: string;
  ticker?: {
    displayChange?: string;
    displayLastPrice?: string;
    displayVolume?: string;
  };
};

export type CoinSymbolInfo = {
  contractType?: string | null;
  onboardDate?: number | null;
};

export type CoinTimeframeSupportResistance = {
  interval: string;
  isLoading: boolean;
  label: string;
  supportResistance: {
    support: number;
    resistance: number;
  } | null;
};

export type MarketStructureTerm = 'short' | 'medium' | 'long';

export type MarketStructureTermOption = {
  label: string;
  value: MarketStructureTerm;
};

export type CoinPriceLevelFormatter = (value: number | null) => string;
export type CoinPriceZoneFormatter = (zone: { high: number | null; low: number | null }) => string;
export type CoinDistanceFromEntryFormatter = (
  price: number | null,
  entryPrice: number | null,
  direction: 'long' | 'short'
) => string;
