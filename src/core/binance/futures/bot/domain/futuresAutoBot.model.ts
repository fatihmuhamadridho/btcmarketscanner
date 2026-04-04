import type { CoinAutoBotExecutionMode, CoinAutoBotStatus } from '@features/coin/interface/CoinView.interface';

export type FuturesAutoBotDirection = 'long' | 'short';
export type FuturesAutoBotExecutionBehavior = 'locked' | 're_evaluate' | 'switch_if_better';

export type FuturesAutoBotPlan = {
  allocationUnit: 'percent' | 'usdt';
  allocationValue: number;
  currentPrice: number | null;
  direction: FuturesAutoBotDirection;
  entryMid: number | null;
  entryZone: {
    high: number | null;
    low: number | null;
  };
  executionMode: CoinAutoBotExecutionMode;
  executionBehavior: FuturesAutoBotExecutionBehavior;
  leverage: number;
  notes: string[];
  riskReward: number | null;
  setupGrade: 'A+' | 'A' | 'B' | 'C';
  setupGradeRank: number;
  setupLabel: string;
  stopLoss: number | null;
  symbol: string;
  takeProfits: Array<{
    label: 'TP1' | 'TP2' | 'TP3';
    price: number | null;
  }>;
};

export type FuturesAutoBotState = {
  botId: string;
  createdAt: string;
  execution?: FuturesAutoBotExecutionRecord | null;
  lastScanPrice?: number | null;
  updatedAt: string;
  plan: FuturesAutoBotPlan;
  status: CoinAutoBotStatus;
};

export type StartFuturesAutoBotInput = FuturesAutoBotPlan;

export type FuturesAutoBotExecutionRecord = {
  entryOrderId: number;
  entryOrderStatus: string | null;
  entryPrice: number | null;
  executedAt: string;
  algoOrderClientIds: string[];
  positionSide: 'LONG' | 'SHORT' | null;
  stopLossAlgoOrderId: number | null;
  takeProfitAlgoOrderIds: number[];
  quantity: number;
};

export type FuturesAutoBotLogLevel = 'info' | 'success' | 'warn' | 'error';

export type FuturesAutoBotLogEntry = {
  id: string;
  level: FuturesAutoBotLogLevel;
  message: string;
  timestamp: string;
};
