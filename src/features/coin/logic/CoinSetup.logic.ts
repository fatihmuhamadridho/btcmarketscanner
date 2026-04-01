import type { SetupCandle, SetupInsight, SupportResistance, TrendInsight } from '../interface/CoinLogic.interface';
import { buildEmptySetupInsight } from './CoinSetupDefault.logic';
import { buildCoinSetupAnalysisContext } from './CoinSetupContext.logic';
import { analyzeLongSetup } from './CoinSetupLong.logic';
import { analyzeShortSetup } from './CoinSetupShort.logic';

export function analyzeSetupSide(
  side: 'long' | 'short',
  candles: SetupCandle[],
  trendSummary: TrendInsight,
  supportResistance: SupportResistance | null
): SetupInsight {
  if (candles.length < 2 || !supportResistance) {
    return buildEmptySetupInsight(side);
  }

  const context = buildCoinSetupAnalysisContext(side, candles, trendSummary, supportResistance);

  return side === 'long' ? analyzeLongSetup(context) : analyzeShortSetup(context);
}
