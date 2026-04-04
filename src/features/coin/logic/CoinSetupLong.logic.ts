import type { CoinSetupAnalysisContext } from '../interface/CoinSetup.interface';
import type { SetupInsight } from '../interface/CoinLogic.interface';
import { buildSetupPath } from './CoinSetupPath.logic';
import { getGradeFromScore, buildTakeProfitSteps, buildZone } from './CoinSetupShared.logic';

export function analyzeLongSetup(context: CoinSetupAnalysisContext): SetupInsight {
  const {
    breakoutLong,
    rsi14,
    maScore,
    nearSupport,
    pathMode,
    supportResistance,
    targetBuffer,
    trendBiasScore,
    trendSummary,
    zoneBuffer,
  } = context;

  let entryZone = buildZone(supportResistance.support + zoneBuffer * 0.2, supportResistance.support + zoneBuffer * 0.8);
  let marketCondition = 'Range-bound setup';
  const reasons: string[] = [];
  let score = context.scoreBase + trendBiasScore + maScore + context.structureScore + context.volumeScore;

  if (breakoutLong) {
    entryZone = buildZone(
      supportResistance.resistance + zoneBuffer * 0.1,
      supportResistance.resistance + zoneBuffer * 0.8
    );
    marketCondition = 'Bullish breakout continuation';
    score += 2;
    reasons.push('Price is breaking above resistance');
  } else if (nearSupport) {
    const zoneLow = Math.max(
      supportResistance.support + zoneBuffer * 0.15,
      (trendSummary.ma20 ?? supportResistance.support) - zoneBuffer * 0.2
    );
    const zoneHigh = Math.min(
      supportResistance.support + zoneBuffer * 1.35,
      supportResistance.resistance - zoneBuffer * 0.2
    );
    entryZone = buildZone(zoneLow, Math.max(zoneLow + zoneBuffer * 0.5, zoneHigh));
    marketCondition = 'Bullish pullback near support';
    score += 2;
    reasons.push('Price is holding close to support');
  } else {
    const zoneLow = Math.max(
      supportResistance.support + zoneBuffer * 0.2,
      (trendSummary.ma20 ?? context.lastPrice) - zoneBuffer * 0.35
    );
    const zoneHigh = Math.min(supportResistance.resistance - zoneBuffer * 0.2, zoneLow + zoneBuffer * 1.2);
    entryZone = buildZone(zoneLow, Math.max(zoneLow + zoneBuffer * 0.6, zoneHigh));
    marketCondition = 'Bullish continuation';
    score += 1;
    reasons.push('Long is favored while price holds above support');
  }

  const entryMid = (entryZone.low + entryZone.high) / 2;
  const stopLoss = Math.min(supportResistance.support - context.stopBuffer, entryZone.low - context.stopBuffer * 0.75);
  const risk = Math.max(entryMid - stopLoss, zoneBuffer);
  const takeProfits = buildTakeProfitSteps('long', entryMid, risk, supportResistance, targetBuffer);
  const takeProfit = takeProfits[2].price;

  if (rsi14 !== null) {
    if (rsi14 <= 35) {
      score += 1;
      reasons.push(`RSI14 is oversold at ${rsi14.toFixed(2)} and supports a long rebound`);
    } else if (rsi14 >= 65) {
      score -= 1;
      reasons.push(`RSI14 is overbought at ${rsi14.toFixed(2)} and is less attractive for a long`);
    } else if (rsi14 >= 50) {
      score += 1;
      reasons.push(`RSI14 momentum is supportive at ${rsi14.toFixed(2)}`);
    } else {
      reasons.push(`RSI14 is still weak at ${rsi14.toFixed(2)} but not extreme`);
    }
  }

  const grade = getGradeFromScore(score);

  return {
    direction: 'long',
    entryMid,
    entryZone,
    atr14: context.atr14,
    grade,
    gradeRank: score,
    label: `${grade} Long Setup`,
    marketCondition,
    pathMode,
    path: buildSetupPath(context).map((item) => ({
      ...item,
      status: grade === 'A+' && item.status === 'current' ? 'done' : item.status,
    })),
    takeProfits,
    reasons: [
      'Trend bias is bullish',
      `MA alignment: ${maScore}/3`,
      context.atr14 !== null ? `ATR14 volatility: ${context.atr14.toFixed(2)}` : 'ATR14 volatility is not available',
      rsi14 !== null ? `RSI14 signal: ${rsi14.toFixed(2)}` : 'RSI14 signal is not available',
      ...reasons.slice(0, 2),
      trendSummary.volumeRatio !== null
        ? `Volume ratio: x${trendSummary.volumeRatio.toFixed(2)}`
        : 'Volume ratio is not available',
    ],
    riskReward: risk > 0 ? (takeProfit - entryMid) / risk : null,
    stopLoss,
    takeProfit,
    rsi14,
  };
}
