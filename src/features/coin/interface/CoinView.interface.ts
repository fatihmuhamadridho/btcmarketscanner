import type { RefObject } from 'react';
import type {
  SetupInsight,
  SetupPathStep,
  SupportResistance,
  TrendCandle,
  TrendDirection,
  TrendInsight as CoreTrendInsight,
} from 'btcmarketscanner-core';

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
  isChartEnabled: boolean;
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

export type CoinSetupPathStep = SetupPathStep;

export type CoinSetupTarget = {
  label: 'TP1' | 'TP2' | 'TP3' | 'Stop loss';
  price: number | null;
};

export type CoinSetupDetail = SetupInsight;

export type CoinSetupPreferred = Pick<CoinSetupDetail, 'direction' | 'grade' | 'label'>;

export type CoinTrendSummary = {
  changePercent: number;
  color: 'teal' | 'red' | 'gray';
  endPrice: number | null;
  label: string;
  atr14: number | null;
  ema100: number | null;
  ema20: number | null;
  ema200: number | null;
  ema50: number | null;
  ma20: number | null;
  ma50: number | null;
  ma200: number | null;
  rsi14: number | null;
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
  atr14: number | null;
  supportResistance:
    | {
        averageResistance: number;
        averageSupport: number;
        resistance: number;
        support: number;
      }
    | null;
  ema100: number | null;
  ema20: number | null;
  ema200: number | null;
  ema50: number | null;
  rsi14: number | null;
  trendDirection: 'bullish' | 'bearish' | 'sideways';
  trendLabel: string;
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

export type CoinAutoBotAllocationUnit = 'percent' | 'usdt';
export type CoinAutoBotStatus = 'idle' | 'watching' | 'entry_pending' | 'entry_placed' | 'stopped' | 'error';

export type CoinAutoBotTimeframeSummary = {
  direction: 'long' | 'short';
  atrLabel: string;
  ema100Label: string;
  ema20Label: string;
  ema200Label: string;
  ema50Label: string;
  entryZoneLabel: string;
  interval: CoinTimeframe;
  isConsensus: boolean;
  marketConditionLabel: string;
  rsiLabel: string;
  riskRewardLabel: string;
  setupGrade: 'A+' | 'A' | 'B' | 'C';
  setupLabel: string;
  stopLossLabel: string;
  takeProfitLabels: Array<{
    label: 'TP1' | 'TP2' | 'TP3';
    valueLabel: string;
  }>;
  trendColor: 'teal' | 'red' | 'gray';
  trendLabel: string;
};

export type CoinAutoBotOpenPosition = {
  entryPriceLabel: string;
  isolatedMarginLabel: string;
  leverageLabel: string;
  liquidationPriceLabel: string;
  marginTypeLabel: string;
  markPriceLabel: string;
  notionalLabel: string;
  positionAmtLabel: string;
  positionSideLabel: 'BOTH' | 'LONG' | 'SHORT';
  protectionTargets: Array<{
    label: 'TP1' | 'TP2' | 'TP3' | 'SL';
    priceLabel: string;
    percentLabel: string;
  }>;
  unrealizedPnlLabel: string;
};

export type CoinAutoBotOpenOrder = {
  clientOrderId: string | null;
  algoId: number | null;
  orderEntryPriceLabel: string;
  orderEstimatedMarginLabel: string;
  orderLeverageLabel: string;
  orderModeLabel: string;
  orderId: number | null;
  orderPnLLabel: string;
  orderPnLPercentLabel: string;
  orderNotionalLabel: string;
  orderPositionSideLabel: string;
  orderPurposeLabel: 'Entry' | 'Take profit' | 'Stop loss' | 'Other';
  orderPriceMovePercentLabel: string;
  orderPriceLabel: string;
  orderQuantityLabel: string;
  orderReduceOnlyLabel: string;
  orderSideLabel: string;
  orderStatusLabel: string;
  orderTimeInForceLabel: string;
  orderTriggerPriceLabel: string;
  orderTypeLabel: string;
};

export type CoinAutoBotTransactionHistoryEntry = {
  actualMarginLabel: string;
  assetLabel: string;
  infoLabel: string;
  roiLabel: string;
  realizedPnlLabel: string;
  symbol: string;
  timeLabel: string;
  tranIdLabel: string;
};

export type CoinAutoBotTransactionHistorySummary = {
  lossCount: number;
  roiLabel: string;
  totalRealizedPnlLabel: string;
  winCount: number;
  winRateLabel: string;
};

export type CoinAutoBotSectionViewModel = {
  atr14Label: string;
  allocationLabel: string;
  allocationUnit: CoinAutoBotAllocationUnit;
  allocationValue: number;
  botStatus: CoinAutoBotStatus;
  botStatusColor: 'gray' | 'red' | 'teal' | 'cyan' | 'yellow';
  botStatusLabel: string;
  currentPriceLabel: string;
  direction: 'long' | 'short';
  entryZoneLabel: string;
  executionEndpointLabel: string;
  executionPlanDirection: 'long' | 'short';
  executionPlanEntryZoneLabel: string;
  executionPlanPreviewLabel: string;
  executionPlanRiskRewardLabel: string;
  executionPlanSetupLabel: string;
  executionPlanStopLossLabel: string;
  executionPlanTakeProfitLabels: Array<{
    label: 'TP1' | 'TP2' | 'TP3';
    valueLabel: string;
  }>;
  isActive: boolean;
  isStarting: boolean;
  isStopping: boolean;
  marketConditionLabel: string;
  notes: string[];
  logs: Array<{
    id: string;
    level: 'info' | 'success' | 'warn' | 'error';
    message: string;
    timestamp: string;
  }>;
  executionBasisLabel: string;
  executionConsensusLabel: string;
  leverage: number;
  openPositions: CoinAutoBotOpenPosition[];
  openOrders: CoinAutoBotOpenOrder[];
  transactionHistorySummary: CoinAutoBotTransactionHistorySummary;
  transactionHistory: CoinAutoBotTransactionHistoryEntry[];
  timeframeSummaries: CoinAutoBotTimeframeSummary[];
  onAllocationUnitChange: (value: CoinAutoBotAllocationUnit) => void;
  onAllocationValueChange: (value: number) => void;
  onLeverageChange: (value: number) => void;
  onClosePosition: (positionSide: 'BOTH' | 'LONG' | 'SHORT') => void;
  onCancelOrder: (order: CoinAutoBotOpenOrder) => void;
  onStart: () => void;
  onStop: () => void;
  riskRewardLabel: string;
  setupGrade: 'A+' | 'A' | 'B' | 'C';
  setupLabel: string;
  rsi14Label: string;
  stopLossLabel: string;
  symbol: string;
  takeProfitLabels: Array<{
    label: 'TP1' | 'TP2' | 'TP3';
    valueLabel: string;
  }>;
};
