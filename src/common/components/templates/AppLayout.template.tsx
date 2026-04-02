import type { ReactNode } from 'react';
import { Box, Container } from '@mantine/core';
import AppNavbar from '@components/organisms/AppNavbar.organism';
import { useFuturesMarketOverview } from '@core/binance/futures/market/infrastructure/futuresMarket.hook';

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  const { data, isLoading } = useFuturesMarketOverview();

  return (
    <>
      <AppNavbar
        isMarketLoading={isLoading}
        marketItems={(data?.data ?? []).map((item) => ({
          baseAsset: item.baseAsset,
          displayName: item.displayName,
          pair: item.pair,
          quoteAsset: item.quoteAsset,
          status: item.status,
          symbol: item.symbol,
          ticker: {
            displayChange: item.ticker.displayChange,
            displayLastPrice: item.ticker.displayLastPrice,
            priceChangePercent: item.ticker.priceChangePercent,
          },
        }))}
      />
      <Box
        mih="100vh"
        py={{ base: 24, sm: 36, lg: 56 }}
        px={{ base: 10, sm: 24 }}
        style={{ backgroundColor: 'transparent' }}
      >
        <Container size="lg">{children}</Container>
      </Box>
    </>
  );
}
