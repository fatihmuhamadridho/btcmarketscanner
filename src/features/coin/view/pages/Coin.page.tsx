import { useMemo } from 'react';
import CoinTemplate from '../templates/CoinTemplate.template';
import { formatDate, useCoinDetailPageLogic } from '../../logic/Coin.logic';
import { useCoinAutoBotLogic } from '../../logic/CoinAutoBot.logic';
import { useCoinChartLogic } from '../../logic/CoinChart.logic';
import { buildCoinValidationSnapshot } from '../../logic/CoinValidationSnapshot.logic';
import { analyzeTrend } from '../../logic/CoinTrend.logic';
import type { CoinPageProps } from '../../interface/CoinView.interface';
import { useQuery } from '@tanstack/react-query';

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
    executionCandles1m,
    executionCandles15m,
    executionCandles1h,
    executionCandles4h,
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

  const { data: accountProfile } = useQuery({
    queryKey: ['binance-account-profile'],
    queryFn: async () => {
      const response = await fetch('/api/binance/account');

      if (!response.ok) {
        throw new Error('Failed to load Binance account profile');
      }

      return (await response.json()) as {
        availableBalanceValue: number | null;
        isConfigured: boolean;
        totalMarginBalanceValue: number | null;
        walletBalanceValue: number | null;
      };
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const activeSetup = executionConsensusSetup;
  const currentPrice = marketSymbol?.ticker?.displayLastPrice ? Number(marketSymbol.ticker.displayLastPrice.replaceAll(',', '')) : null;
  const executionCandles1mData = executionCandles1m.data?.data;
  const executionCandles15mData = executionCandles15m.data?.data;
  const executionCandles1hData = executionCandles1h.data?.data;
  const executionCandles4hData = executionCandles4h.data?.data;
  const coinAutoBot = useCoinAutoBotLogic({
    activeSetup,
    currentPrice: Number.isFinite(currentPrice ?? NaN) ? currentPrice : null,
    formatPriceLevel,
    formatPriceZone,
    executionBasisLabel,
    executionConsensusLabel,
    timeframeSummaries: executionTimeframeSummaries,
    symbol: marketSymbol?.symbol ?? symbol ?? 'unknown',
  });

  const validationSnapshot = useMemo(() => {
    const timeframesReady =
      (executionCandles1mData?.length ?? 0) >= 20 &&
      (executionCandles15mData?.length ?? 0) >= 50 &&
      (executionCandles1hData?.length ?? 0) >= 50 &&
      (executionCandles4hData?.length ?? 0) >= 20;
    const requiredSupportResistanceReady = ['1m', '15m', '1h', '4h'].every(
      (interval) =>
        timeframeSupportResistance.some(
          (item) => item.interval === interval && item.supportResistance !== null
        )
    );

    if (
      !accountProfile ||
      !executionConsensusSetup ||
      !currentPrice ||
      !timeframesReady ||
      !requiredSupportResistanceReady
    ) {
      return null;
    }

    return buildCoinValidationSnapshot({
      accountSize:
        accountProfile.availableBalanceValue ??
        accountProfile.walletBalanceValue ??
        accountProfile.totalMarginBalanceValue ??
        null,
      consensusSetup: executionConsensusSetup,
      currentPrice,
      currentTrend: analyzeTrend(
        executionCandles1hData ?? [],
        timeframeSupportResistance.find((item) => item.interval === '1h')?.supportResistance ?? null
      ),
      leverage: coinAutoBot.leverage,
      isPerpetual: symbolInfo?.contractType?.toUpperCase().includes('PERPETUAL') ?? true,
      symbol: marketSymbol?.symbol ?? symbol ?? 'unknown',
      timeframeSources: {
        '1m': executionCandles1mData ?? [],
        '15m': executionCandles15mData ?? [],
        '1h': executionCandles1hData ?? [],
        '4h': executionCandles4hData ?? [],
      },
      timeframeSupportResistance,
    });
  }, [
    accountProfile,
    coinAutoBot.leverage,
    currentPrice,
    executionCandles15mData,
    executionCandles1hData,
    executionCandles1mData,
    executionCandles4hData,
    executionConsensusSetup,
    marketSymbol?.symbol,
    symbolInfo?.contractType,
    symbol,
    timeframeSupportResistance,
  ]);

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
      validationSnapshot={validationSnapshot}
      timeframeSupportResistance={timeframeSupportResistance}
      trendSummary={trendSummary}
      TrendIcon={TrendIcon}
    />
  );
}
