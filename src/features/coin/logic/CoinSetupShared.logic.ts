import type { SetupInsight, SetupPathStep, SupportResistance } from '../interface/CoinLogic.interface';

export function buildSetupPathStep(label: string, status: SetupPathStep['status']): SetupPathStep {
  return { label, status };
}

export function getGradeFromScore(score: number): SetupInsight['grade'] {
  if (score >= 8) {
    return 'A+';
  }

  if (score >= 6) {
    return 'A';
  }

  if (score >= 4) {
    return 'B';
  }

  return 'C';
}

export function buildZone(low: number, high: number) {
  return low <= high ? { low, high } : { low: high, high: low };
}

export function getAverageTrueRange(candles: Array<{ close: number; high: number; low: number }>, period = 14) {
  if (candles.length < 2) {
    return null;
  }

  const startIndex = Math.max(1, candles.length - period);
  const trueRanges: number[] = [];

  for (let index = startIndex; index < candles.length; index += 1) {
    const current = candles[index];
    const previous = candles[index - 1];
    const highLow = current.high - current.low;
    const highClose = Math.abs(current.high - previous.close);
    const lowClose = Math.abs(current.low - previous.close);

    trueRanges.push(Math.max(highLow, highClose, lowClose));
  }

  if (trueRanges.length === 0) {
    return null;
  }

  return trueRanges.reduce((sum, value) => sum + value, 0) / trueRanges.length;
}

export function buildTakeProfitSteps(
  direction: 'long' | 'short',
  entryMid: number,
  risk: number,
  supportResistance: SupportResistance,
  targetBuffer: number
) {
  if (direction === 'long') {
    const tp1 = Math.max(entryMid + risk * 1, supportResistance.resistance + targetBuffer * 0.25);
    const tp2 = Math.max(entryMid + risk * 2, supportResistance.resistance + targetBuffer * 0.75);
    const tp3 = Math.max(entryMid + risk * 3, supportResistance.resistance + targetBuffer * 1.5);

    return [
      { label: 'TP1' as const, price: tp1 },
      { label: 'TP2' as const, price: tp2 },
      { label: 'TP3' as const, price: tp3 },
    ];
  }

  const tp1 = Math.min(entryMid - risk * 1, supportResistance.support - targetBuffer * 0.25);
  const tp2 = Math.min(entryMid - risk * 2, supportResistance.support - targetBuffer * 0.75);
  const tp3 = Math.min(entryMid - risk * 3, supportResistance.support - targetBuffer * 1.5);

  return [
    { label: 'TP1' as const, price: tp1 },
    { label: 'TP2' as const, price: tp2 },
    { label: 'TP3' as const, price: tp3 },
  ];
}
