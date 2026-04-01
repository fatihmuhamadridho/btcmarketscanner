import Head from 'next/head';
import { Box, Container, Stack } from '@mantine/core';
import AppFooter from '@components/atoms/AppFooter.atom';
import AnalysisDisclaimer from '@components/atoms/AnalysisDisclaimer.atom';
import HomeCoinsSection from '../organisms/HomeCoinsSection.organism';
import HomeExchangeInfoSection from '../organisms/HomeExchangeInfoSection.organism';
import HomeHero from '../molecules/HomeHero.molecule';
import type { HomeCoinCardViewModel, HomeExchangeInfo } from '../../interface/HomeView.interface';

type HomeTemplateProps = {
  currentPage: number;
  error: boolean | null;
  exchangeInfo: HomeExchangeInfo;
  headDescription: string;
  headTitle: string;
  coinCards: HomeCoinCardViewModel[];
  isLoading: boolean;
  marketItems: {
    symbol: string;
  }[];
  setActivePage: (page: number) => void;
  totalPages: number;
};

export default function HomeTemplate({
  currentPage,
  error,
  exchangeInfo,
  headDescription,
  headTitle,
  coinCards,
  isLoading,
  marketItems,
  setActivePage,
  totalPages,
}: HomeTemplateProps) {
  return (
    <>
      <Head>
        <title>{headTitle}</title>
        <meta name="description" content={headDescription} />
      </Head>

      <Box mih="100vh" py={{ base: 24, sm: 36, lg: 56 }} px={{ base: 16, sm: 24 }} style={{ backgroundColor: 'transparent' }}>
        <Container size="lg">
          <Stack gap="xl">
            <HomeHero
              badgeLabel="BTC Market Scanner"
              title="Scan the market from one clean coin list."
              description="Click a coin card to open the detail page. The list below is laid out in a single column so it is easier to scan from top to bottom."
            />

            <HomeExchangeInfoSection error={Boolean(error)} exchangeInfo={exchangeInfo} isLoading={isLoading} />

            <HomeCoinsSection
              currentPage={currentPage}
              coinCards={coinCards}
              marketItems={marketItems}
              setActivePage={setActivePage}
              totalPages={totalPages}
            />

            <AnalysisDisclaimer />
            <AppFooter />
          </Stack>
        </Container>
      </Box>
    </>
  );
}
