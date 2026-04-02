import Head from 'next/head';
import { Stack } from '@mantine/core';
import AppFooter from '@components/atoms/AppFooter.atom';
import AnalysisDisclaimer from '@components/atoms/AnalysisDisclaimer.atom';
import AppLayout from '@components/templates/AppLayout.template';
import HomeCoinsSection from '../organisms/HomeCoinsSection.organism';
import HomeHero from '../molecules/HomeHero.molecule';
import type { HomeCoinCardViewModel, HomeSortMode } from '../../interface/HomeView.interface';

type HomeTemplateProps = {
  currentPage: number;
  headDescription: string;
  headTitle: string;
  coinCards: HomeCoinCardViewModel[];
  marketItems: {
    symbol: string;
  }[];
  setActivePage: (page: number) => void;
  setSortMode: (mode: HomeSortMode) => void;
  sortMode: HomeSortMode;
  totalPages: number;
};

export default function HomeTemplate({
  currentPage,
  headDescription,
  headTitle,
  coinCards,
  marketItems,
  setActivePage,
  setSortMode,
  sortMode,
  totalPages,
}: HomeTemplateProps) {
  return (
    <>
      <Head>
        <title>{headTitle}</title>
        <meta name="description" content={headDescription} />
      </Head>
      <AppLayout>
        <Stack gap="xl">
          <HomeHero
            badgeLabel="BTC Market Scanner"
            title="Scan the market from one clean coin list."
            description="Click a coin card to open the detail page. The list below is laid out in a single column so it is easier to scan from top to bottom."
          />

          <HomeCoinsSection
            currentPage={currentPage}
            coinCards={coinCards}
            marketItems={marketItems}
            setActivePage={setActivePage}
            setSortMode={setSortMode}
            sortMode={sortMode}
            totalPages={totalPages}
          />

          <AnalysisDisclaimer />
          <AppFooter />
        </Stack>
      </AppLayout>
    </>
  );
}
