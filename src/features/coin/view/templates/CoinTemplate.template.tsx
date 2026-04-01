import Head from 'next/head';
import type { ComponentType } from 'react';
import { Box, Container, Stack } from '@mantine/core';
import AppFooter from '@components/atoms/AppFooter.atom';
import AnalysisDisclaimer from '@components/atoms/AnalysisDisclaimer.atom';
import CoinChart from '../organisms/CoinChart.organism';
import CoinPageStateCard from '../atoms/CoinPageStateCard.atom';
import CoinMarketStructureSection from '../organisms/CoinMarketStructureSection.organism';
import CoinSetupSection from '../organisms/CoinSetupSection.organism';
import CoinSnapshotCard from '../molecules/CoinSnapshotCard.molecule';
import CoinStructureSelector from '../molecules/CoinStructureSelector.molecule';
import CoinTrendOverviewSection from '../organisms/CoinTrendOverviewSection.organism';
import type {
  CoinChartProps,
  CoinDistanceFromEntryFormatter,
  CoinMarketSymbol,
  CoinPriceLevelFormatter,
  CoinPriceZoneFormatter,
  CoinSetupDetail,
  CoinSetupPreferred,
  CoinSymbolInfo,
  CoinTimeframeSupportResistance,
  CoinTrendSummary,
  MarketStructureTerm,
  MarketStructureTermOption,
} from '../../interface/CoinView.interface';

type CoinTemplateProps = {
  coinChart: Omit<CoinChartProps, 'symbol'>;
  detail: unknown | null;
  headDescription: string;
  headTitle: string;
  isPageLoading: boolean;
  pageError: boolean;
  formatDate: (value?: number) => string;
  formatDistanceFromEntry: CoinDistanceFromEntryFormatter;
  formatPriceLevel: CoinPriceLevelFormatter;
  formatPriceZone: CoinPriceZoneFormatter;
  longSetup: CoinSetupDetail;
  marketSymbol: CoinMarketSymbol | null | undefined;
  preferredSetup: CoinSetupPreferred;
  setStructureTerm: (value: MarketStructureTerm) => void;
  shortSetup: CoinSetupDetail;
  structureTerm: MarketStructureTerm;
  structureTerms: ReadonlyArray<MarketStructureTermOption>;
  symbolInfo: CoinSymbolInfo | null | undefined;
  timeframeSupportResistance: ReadonlyArray<CoinTimeframeSupportResistance>;
  trendSummary: CoinTrendSummary;
  TrendIcon: ComponentType<{ size?: number }>;
};

export default function CoinTemplate({
  coinChart,
  detail,
  formatDate,
  formatDistanceFromEntry,
  formatPriceLevel,
  formatPriceZone,
  headDescription,
  headTitle,
  isPageLoading,
  longSetup,
  marketSymbol,
  pageError,
  preferredSetup,
  setStructureTerm,
  shortSetup,
  structureTerm,
  structureTerms,
  symbolInfo,
  timeframeSupportResistance,
  trendSummary,
  TrendIcon,
}: CoinTemplateProps) {
  return (
    <>
      <Head>
        <title>{headTitle}</title>
        <meta name="description" content={headDescription} />
      </Head>
      <Box
        mih="100vh"
        py={{ base: 24, sm: 36, lg: 56 }}
        px={{ base: 16, sm: 24 }}
        style={{ backgroundColor: 'transparent' }}
      >
        <Container size="lg">
          <Stack gap="xl">
            {isPageLoading ? (
              <CoinPageStateCard message="Loading symbol detail..." />
            ) : pageError ? (
              <CoinPageStateCard message="Failed to load market detail." />
            ) : detail && marketSymbol && symbolInfo ? (
              <>
                <CoinSnapshotCard
                  contractType={symbolInfo.contractType ?? marketSymbol.contractType ?? 'FUTURES'}
                  displayName={marketSymbol.displayName ?? 'n/a'}
                  pair={marketSymbol.pair ?? 'n/a'}
                  quoteAsset={marketSymbol.quoteAsset ?? 'n/a'}
                  baseAsset={marketSymbol.baseAsset ?? 'n/a'}
                  status={marketSymbol.status ?? 'n/a'}
                  onboardLabel={formatDate(symbolInfo.onboardDate ?? undefined)}
                  symbol={marketSymbol.symbol ?? 'unknown'}
                  displayLastPrice={marketSymbol.ticker?.displayLastPrice ?? 'n/a'}
                  displayChange={marketSymbol.ticker?.displayChange ?? 'n/a'}
                  displayVolume={marketSymbol.ticker?.displayVolume ?? 'n/a'}
                />

                <CoinStructureSelector
                  data={structureTerms.map((item) => ({
                    label: item.label,
                    value: item.value,
                  }))}
                  value={structureTerm}
                  onChange={setStructureTerm}
                />

                <CoinTrendOverviewSection trendSummary={trendSummary} TrendIcon={TrendIcon} />

                <CoinSetupSection
                  formatDistanceFromEntry={formatDistanceFromEntry}
                  formatPriceLevel={formatPriceLevel}
                  formatPriceZone={formatPriceZone}
                  longSetup={longSetup}
                  preferredSetup={preferredSetup}
                  shortSetup={shortSetup}
                />

                <CoinChart {...coinChart} symbol={marketSymbol.symbol ?? 'unknown'} />

                <CoinMarketStructureSection timeframeSupportResistance={timeframeSupportResistance} />

                <AnalysisDisclaimer />

                <AppFooter />
              </>
            ) : null}
          </Stack>
        </Container>
      </Box>
    </>
  );
}
