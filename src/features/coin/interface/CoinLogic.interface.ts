export type TrendDirection = 'bullish' | 'bearish' | 'sideways';

export type SupportResistance = {
  resistance: number;
  support: number;
};

export type TrendCandle = {
  close: number;
  high: number;
  low: number;
  openTime: number;
  volume: number;
};

export type TrendInsight = {
  changePercent: number;
  color: 'teal' | 'red' | 'gray';
  direction: TrendDirection;
  endPrice: number | null;
  icon: import('@tabler/icons-react').TablerIcon;
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

export type SetupPathStep = {
  label: string;
  status: 'done' | 'current' | 'pending';
};

export type SetupCandle = TrendCandle;

export type SetupInsight = {
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
  path: SetupPathStep[];
  takeProfits: Array<{
    label: 'TP1' | 'TP2' | 'TP3';
    price: number | null;
  }>;
  reasons: string[];
  riskReward: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
};
