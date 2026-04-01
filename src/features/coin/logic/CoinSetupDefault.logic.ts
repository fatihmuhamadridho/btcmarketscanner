import type { SetupInsight } from '../interface/CoinLogic.interface';
import { buildSetupPathStep } from './CoinSetupShared.logic';

export function buildEmptySetupInsight(side: 'long' | 'short'): SetupInsight {
  return {
    direction: side,
    entryMid: null,
    entryZone: { high: null, low: null },
    grade: 'C',
    gradeRank: 0,
    label: `${side === 'long' ? 'Long' : 'Short'} setup`,
    marketCondition: 'Need more market data',
    pathMode: 'breakout',
    path: [
      buildSetupPathStep('Break', 'pending'),
      buildSetupPathStep('Retest', 'pending'),
      buildSetupPathStep('Rejection', 'pending'),
    ],
    takeProfits: [
      { label: 'TP1', price: null },
      { label: 'TP2', price: null },
      { label: 'TP3', price: null },
    ],
    reasons: ['Need support / resistance data and loaded candles'],
    riskReward: null,
    stopLoss: null,
    takeProfit: null,
  };
}
