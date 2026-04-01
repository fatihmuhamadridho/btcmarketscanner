import type { CoinSetupAnalysisContext } from '../interface/CoinSetup.interface';
import type { SetupInsight } from '../interface/CoinLogic.interface';
import { buildSetupPath } from './CoinSetupPath.logic';
import { getGradeFromScore, buildTakeProfitSteps, buildZone } from './CoinSetupShared.logic';

export function analyzeShortSetup(context: CoinSetupAnalysisContext): SetupInsight {
  const {
    breakdownShort,
    maScore,
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
  let score = context.scoreBase + trendBiasScore + maScore + context.structureScore + context.volumeScore;

  if (breakdownShort) {
    entryZone = buildZone(supportResistance.support - zoneBuffer * 0.8, supportResistance.support - zoneBuffer * 0.1);
    marketCondition = 'Bearish breakdown continuation';
    score += 2;
    reasons.push('Price is breaking below support');
  } else if (nearResistance) {
    const zoneHigh = Math.min(
      supportResistance.resistance - zoneBuffer * 0.15,
      (trendSummary.ma20 ?? supportResistance.resistance) + zoneBuffer * 0.2
    );
    const zoneLow = Math.max(supportResistance.support + zoneBuffer * 0.2, zoneHigh - zoneBuffer * 1.35);
    entryZone = buildZone(Math.min(zoneLow, zoneHigh), zoneHigh);
    marketCondition = 'Bearish pullback near resistance';
    score += 2;
    reasons.push('Price is pressing into resistance');
  } else {
    const zoneHigh = Math.min(
      supportResistance.resistance - zoneBuffer * 0.2,
      (trendSummary.ma20 ?? context.lastPrice) + zoneBuffer * 0.35
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
  const grade = getGradeFromScore(score);

  return {
    direction: 'short',
    entryMid,
    entryZone,
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
      `MA alignment: ${maScore}/3`,
      ...reasons.slice(0, 2),
      trendSummary.volumeRatio !== null
        ? `Volume ratio: x${trendSummary.volumeRatio.toFixed(2)}`
        : 'Volume ratio is not available',
    ],
    riskReward: risk > 0 ? (entryMid - takeProfit) / risk : null,
    stopLoss,
    takeProfit,
  };
}
