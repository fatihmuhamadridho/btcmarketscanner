import CoinTemplate from '../templates/CoinTemplate.template';
import { formatDate, useCoinDetailPageLogic } from '../../logic/Coin.logic';
import { useCoinAutoBotLogic } from '../../logic/CoinAutoBot.logic';
import { useCoinChartLogic } from '../../logic/CoinChart.logic';
import type { CoinPageProps } from '../../interface/CoinView.interface';

export default function CoinPage({ symbol: initialSymbol }: CoinPageProps) {
  const {
    candles,
    candlesError,
    detail,
    hasMoreOlderCandles,
    interval,
    isLoadingMore,
    isLoadingCandles,
    isPageLoading,
    loadOlderCandles,
    longSetup,
    marketSymbol,
    pageError,
    formatDistanceFromEntry,
    formatPriceLevel,
    formatPriceZone,
    executionBasisLabel,
    executionConsensusLabel,
    executionConsensusSetup,
    executionTimeframeSummaries,
    preferredSetup,
    selectedTimeframeSupportResistance,
    setInterval,
    setStructureTerm,
    shortSetup,
    strongSupportResistanceLevel,
    structureTerm,
    structureTerms,
    symbol,
    symbolInfo,
    timeframeSupportResistance,
    timeframes,
    trendSummary,
    TrendIcon,
  } = useCoinDetailPageLogic(initialSymbol);

  const activeSetup = executionConsensusSetup;
  const coinAutoBot = useCoinAutoBotLogic({
    activeSetup,
    currentPrice: marketSymbol?.ticker?.displayLastPrice ? Number(marketSymbol.ticker.displayLastPrice.replaceAll(',', '')) : null,
    formatPriceLevel,
    formatPriceZone,
    executionBasisLabel,
    executionConsensusLabel,
    timeframeSummaries: executionTimeframeSummaries,
    symbol: marketSymbol?.symbol ?? symbol ?? 'unknown',
  });

  const coinChart = useCoinChartLogic({
    candles,
    chartError: candlesError ? 'Failed to load candles.' : null,
    hasMoreOlderCandles,
    interval,
    intervals: timeframes,
    isLoadingCandles,
    isLoadingMore,
    onLoadOlderCandles: loadOlderCandles,
    onIntervalChange: setInterval,
    strongSupportResistanceLevel,
    supportResistance: selectedTimeframeSupportResistance?.supportResistance ?? null,
    symbol: marketSymbol?.symbol ?? symbol ?? 'unknown',
  });

  return (
    <CoinTemplate
      coinAutoBot={coinAutoBot}
      coinChart={coinChart}
      detail={detail}
      formatDate={formatDate}
      formatDistanceFromEntry={formatDistanceFromEntry}
      formatPriceLevel={formatPriceLevel}
      formatPriceZone={formatPriceZone}
      headDescription="Market detail view for futures contracts."
      headTitle={`${symbol ?? 'Coin'} | BTC Market Scanner`}
      isPageLoading={isPageLoading}
      longSetup={longSetup}
      marketSymbol={marketSymbol}
      pageError={Boolean(pageError)}
      preferredSetup={preferredSetup}
      setStructureTerm={setStructureTerm}
      shortSetup={shortSetup}
      structureTerm={structureTerm}
      structureTerms={structureTerms}
      symbolInfo={symbolInfo}
      timeframeSupportResistance={timeframeSupportResistance}
      trendSummary={trendSummary}
      TrendIcon={TrendIcon}
    />
  );
}
