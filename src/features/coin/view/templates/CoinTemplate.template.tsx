import Head from 'next/head';
import Link from 'next/link';
import type { ComponentType } from 'react';
import { Box, Button, Stack } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import AppFooter from '@components/atoms/AppFooter.atom';
import AnalysisDisclaimer from '@components/atoms/AnalysisDisclaimer.atom';
import AppLayout from '@components/templates/AppLayout.template';
import CoinChart from '../organisms/CoinChart.organism';
import CoinAutoBotSection from '../organisms/CoinAutoBotSection.organism';
import CoinOpenPositionsSection from '../organisms/CoinOpenPositionsSection.organism';
import CoinOpenOrdersSection from '../organisms/CoinOpenOrdersSection.organism';
import CoinTransactionHistorySection from '../organisms/CoinTransactionHistorySection.organism';
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
  CoinAutoBotSectionViewModel,
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
  coinAutoBot: CoinAutoBotSectionViewModel;
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
  displayLastPriceLabel: string;
  timeframeSupportResistance: ReadonlyArray<CoinTimeframeSupportResistance>;
  trendSummary: CoinTrendSummary;
  TrendIcon: ComponentType<{ size?: number }>;
};

export default function CoinTemplate({
  coinChart,
  coinAutoBot,
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
  displayLastPriceLabel,
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
      <AppLayout>
        <Stack gap="xl">
          <Button
            component={Link}
            href="/"
            variant="subtle"
            color="gray"
            leftSection={<IconArrowLeft size={16} />}
            style={{ width: 'fit-content', paddingInline: 0 }}
          >
            Back to homepage
          </Button>

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
                displayLastPrice={displayLastPriceLabel}
                displayChange={marketSymbol.ticker?.displayChange ?? 'n/a'}
                displayVolume={marketSymbol.ticker?.displayVolume ?? 'n/a'}
              />

              <Box
                p="xs"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 20,
                }}
              >
                <CoinStructureSelector
                  data={structureTerms.map((item) => ({
                    label: item.label,
                    value: item.value,
                  }))}
                  value={structureTerm}
                  onChange={setStructureTerm}
                />
              </Box>

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

              <CoinAutoBotSection {...coinAutoBot} />

              <CoinOpenPositionsSection
                onClosePosition={coinAutoBot.onClosePosition}
                positions={coinAutoBot.openPositions}
                symbol={marketSymbol.symbol ?? 'unknown'}
              />

              <CoinOpenOrdersSection
                onCancelOrder={coinAutoBot.onCancelOrder}
                openOrders={coinAutoBot.openOrders}
                symbol={marketSymbol.symbol ?? 'unknown'}
              />

              <CoinTransactionHistorySection
                symbol={marketSymbol.symbol ?? 'unknown'}
                summary={coinAutoBot.transactionHistorySummary}
                transactionHistory={coinAutoBot.transactionHistory}
              />

              <CoinMarketStructureSection timeframeSupportResistance={timeframeSupportResistance} />

              <AnalysisDisclaimer />

              <AppFooter />
            </>
          ) : null}
        </Stack>
      </AppLayout>
    </>
  );
}
