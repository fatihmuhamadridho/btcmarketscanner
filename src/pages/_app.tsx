import '@styles/globals.css';
import '@mantine/core/styles.css';

import Head from 'next/head';
import type { AppProps } from 'next/app';
import { createTheme, MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import AppNavbar from '@components/organisms/AppNavbar.organism';
import { useFuturesMarketOverview } from '@core/binance/futures/market/infrastructure/futuresMarket.hook';

const theme = createTheme({
  fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
});

function AppContent({ Component, pageProps }: AppProps) {
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
      <Component {...pageProps} />
    </>
  );
}

export default function App(props: AppProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <Head>
          <link rel="icon" href="/favicon.ico?v=2" sizes="any" />
          <link rel="icon" href="/favicon.svg?v=2" type="image/svg+xml" />
        </Head>
        <AppContent {...props} />
      </MantineProvider>
    </QueryClientProvider>
  );
}
