import { FuturesMarketController } from '@core/binance/futures/market/domain/futuresMarket.controller';
import { analyzeSetupSide } from '@features/coin/logic/CoinSetup.logic';
import { analyzeTrend } from '@features/coin/logic/CoinTrend.logic';
import type { CoinAutoBotTimeframeSummary } from '@features/coin/interface/CoinView.interface';
import type { SetupCandle, SupportResistance, TrendInsight } from '@features/coin/interface/CoinLogic.interface';
import type { CoinSetupDetail } from '@features/coin/interface/CoinView.interface';

type ExecutionTimeframe = '1m' | '5m' | '15m' | '30m' | '1h' | '4h';

const executionTimeframes: ExecutionTimeframe[] = ['1m', '5m', '15m', '30m', '1h', '4h'];
const timeframePriority: Record<ExecutionTimeframe, number> = {
  '1m': 1,
  '5m': 2,
  '15m': 3,
  '30m': 4,
  '1h': 5,
  '4h': 6,
};

const futuresMarketController = new FuturesMarketController();

function getSupportResistance(candles: SetupCandle[], windowSize: number): SupportResistance | null {
  if (candles.length === 0) {
    return null;
  }

  const windowCandles = candles.slice(-windowSize);
  const lows = windowCandles.map((candle) => candle.low);
  const highs = windowCandles.map((candle) => candle.high);

  return {
    support: Math.min(...lows),
    resistance: Math.max(...highs),
  };
}

function formatPrice(value: number | null) {
  return value === null ? 'n/a' : value.toFixed(2);
}

function buildSummary(interval: ExecutionTimeframe, trend: TrendInsight, setup: CoinSetupDetail): CoinAutoBotTimeframeSummary {
  return {
    direction: setup.direction,
    entryZoneLabel: `${formatPrice(setup.entryZone.low)} - ${formatPrice(setup.entryZone.high)}`,
    interval,
    isConsensus: false,
    marketConditionLabel: setup.marketCondition,
    riskRewardLabel: setup.riskReward !== null ? `1:${setup.riskReward.toFixed(2)}` : 'n/a',
    setupGrade: setup.grade,
    setupLabel: setup.label,
    stopLossLabel: formatPrice(setup.stopLoss),
    takeProfitLabels: setup.takeProfits.map((takeProfit) => ({
      label: takeProfit.label,
      valueLabel: formatPrice(takeProfit.price),
    })),
    trendColor: trend.color,
    trendLabel: trend.label,
  };
}

export class FuturesAutoConsensusService {
  async buildConsensus(symbol: string) {
    const snapshots = await Promise.all(
      executionTimeframes.map(async (interval) => {
        const candlesResponse = await futuresMarketController.getMarketInitialCandles(symbol, interval, 120);
        const candles: SetupCandle[] = candlesResponse.data.map((candle) => ({
          openTime: candle.openTime,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
          closeTime: candle.closeTime,
        }));
        const supportResistance = getSupportResistance(candles, 20);
        const trend = analyzeTrend(candles, supportResistance);
        const longSetup = analyzeSetupSide('long', candles, trend, supportResistance);
        const shortSetup = analyzeSetupSide('short', candles, trend, supportResistance);
        const setup = longSetup.gradeRank >= shortSetup.gradeRank ? longSetup : shortSetup;

        return {
          interval,
          longSetup,
          shortSetup,
          setup,
          trend,
        };
      })
    );

    const summaries = snapshots.map((snapshot) => buildSummary(snapshot.interval, snapshot.trend, snapshot.setup));

    const consensusSnapshot = [...snapshots].sort(
      (left, right) =>
        right.setup.gradeRank - left.setup.gradeRank || timeframePriority[right.interval] - timeframePriority[left.interval]
    )[0];

    const executionConsensusLabel = consensusSnapshot?.setup.label ?? 'Consensus setup';
    const consensusSetup = consensusSnapshot?.setup ?? snapshots[0]?.setup ?? null;

    if (consensusSnapshot) {
      const consensusIndex = summaries.findIndex((item) => item.interval === consensusSnapshot.interval);
      if (consensusIndex >= 0) {
        summaries[consensusIndex] = {
          ...summaries[consensusIndex],
          isConsensus: true,
        };
      }
    }

    return {
      consensusSetup,
      executionBasisLabel: executionTimeframes.join(' • ').replace('1h', '1H').replace('4h', '4H'),
      executionConsensusLabel,
      summaries,
    };
  }
}

export const futuresAutoConsensusService = new FuturesAutoConsensusService();
