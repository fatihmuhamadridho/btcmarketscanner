import type { CoinSetupAnalysisContext } from '../interface/CoinSetup.interface';
import type { SetupInsight } from '../interface/CoinLogic.interface';
import { buildSetupPath } from './CoinSetupPath.logic';
import { getGradeFromScore, buildTakeProfitSteps, buildZone } from './CoinSetupShared.logic';

export function analyzeShortSetup(context: CoinSetupAnalysisContext): SetupInsight {
  const {
    breakdownShort,
    rsi14,
    emaScore,
    nearResistance,
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
  let score = context.scoreBase + trendBiasScore + emaScore + context.structureScore + context.volumeScore;

  if (breakdownShort) {
    entryZone = buildZone(supportResistance.support - zoneBuffer * 0.8, supportResistance.support - zoneBuffer * 0.1);
    marketCondition = 'Bearish breakdown continuation';
    score += 2;
    reasons.push('Price is breaking below support');
  } else if (nearResistance) {
    const zoneHigh = Math.min(
      supportResistance.resistance - zoneBuffer * 0.15,
      (trendSummary.ema20 ?? supportResistance.resistance) + zoneBuffer * 0.2
    );
    const zoneLow = Math.max(supportResistance.support + zoneBuffer * 0.2, zoneHigh - zoneBuffer * 1.35);
    entryZone = buildZone(Math.min(zoneLow, zoneHigh), zoneHigh);
    marketCondition = 'Bearish pullback near resistance';
    score += 2;
    reasons.push('Price is pressing into resistance');
  } else {
    const zoneHigh = Math.min(
      supportResistance.resistance - zoneBuffer * 0.2,
      (trendSummary.ema20 ?? context.lastPrice) + zoneBuffer * 0.35
    );
    const zoneLow = Math.max(supportResistance.support + zoneBuffer * 0.2, zoneHigh - zoneBuffer * 1.2);
    entryZone = buildZone(Math.min(zoneLow, zoneHigh), zoneHigh);
    marketCondition = 'Bearish continuation';
    score += 1;
    reasons.push('Short is favored while price stays below resistance');
  }

  const entryMid = (entryZone.low + entryZone.high) / 2;
  const stopLoss = Math.max(supportResistance.resistance + context.stopBuffer, entryZone.high + context.stopBuffer * 0.75);
  const risk = Math.max(stopLoss - entryMid, zoneBuffer);
  const takeProfits = buildTakeProfitSteps('short', entryMid, risk, supportResistance, targetBuffer);
  const takeProfit = takeProfits[2].price;

  if (rsi14 !== null) {
    if (rsi14 >= 65) {
      score += 1;
      reasons.push(`RSI14 is overbought at ${rsi14.toFixed(2)} and supports a short fade`);
    } else if (rsi14 <= 35) {
      score -= 1;
      reasons.push(`RSI14 is oversold at ${rsi14.toFixed(2)} and is less attractive for a short`);
    } else if (rsi14 <= 50) {
      score += 1;
      reasons.push(`RSI14 momentum is supportive at ${rsi14.toFixed(2)}`);
    } else {
      reasons.push(`RSI14 is still firm at ${rsi14.toFixed(2)} but not extreme`);
    }
  }

  const grade = getGradeFromScore(score);

  return {
    direction: 'short',
    entryMid,
    entryZone,
    atr14: context.atr14,
    grade,
    gradeRank: score,
    label: `${grade} Short Setup`,
    marketCondition,
    pathMode,
    path: buildSetupPath(context).map((item) => ({
      ...item,
      status: grade === 'A+' && item.status === 'current' ? 'done' : item.status,
    })),
    takeProfits,
    reasons: [
      'Trend bias is bearish',
      `EMA alignment: ${emaScore}/3`,
      context.atr14 !== null ? `ATR14 volatility: ${context.atr14.toFixed(2)}` : 'ATR14 volatility is not available',
      rsi14 !== null ? `RSI14 signal: ${rsi14.toFixed(2)}` : 'RSI14 signal is not available',
      ...reasons.slice(0, 2),
      trendSummary.volumeRatio !== null
        ? `Volume ratio: x${trendSummary.volumeRatio.toFixed(2)}`
        : 'Volume ratio is not available',
    ],
    riskReward: risk > 0 ? (entryMid - takeProfit) / risk : null,
    stopLoss,
    takeProfit,
    rsi14,
  };
}
