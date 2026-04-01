import Head from 'next/head';
import {
  Badge,
  Box,
  Card,
  Container,
  Divider,
  Group,
  Paper,
  Pagination,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useMemo, useState } from 'react';
import { formatInteger } from '@utils/format-number.util';
import { useFuturesMarketOverview } from '@core/binance/futures/market/infrastructure/futuresMarket.hook';
import AppFooter from '../../shared/AppFooter';
import AnalysisDisclaimer from '../../shared/AnalysisDisclaimer';
import HomeCard from './HomeCard';

const HOME_PAGE_SIZE = 10;
const EMPTY_MARKET_ITEMS: never[] = [];

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card
      radius="lg"
      p="md"
      withBorder
      style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <Stack gap={4}>
        <Text c="dimmed" size="xs" tt="uppercase" style={{ letterSpacing: 1 }}>
          {label}
        </Text>
        <Text fw={700} fz="xl">
          {value}
        </Text>
      </Stack>
    </Card>
  );
}

export default function Home() {
  const { data, error, isLoading } = useFuturesMarketOverview();
  const [activePage, setActivePage] = useState(1);

  const exchangeInfo = data?.exchangeInfo;
  const marketItems = data?.data ?? EMPTY_MARKET_ITEMS;
  const totalPages = Math.max(1, Math.ceil(marketItems.length / HOME_PAGE_SIZE));
  const currentPage = Math.min(activePage, totalPages);

  const visibleMarketItems = useMemo(() => {
    const startIndex = (currentPage - 1) * HOME_PAGE_SIZE;

    return marketItems.slice(startIndex, startIndex + HOME_PAGE_SIZE);
  }, [currentPage, marketItems]);

  return (
    <>
      <Head>
        <title>BTC Market Scanner</title>
        <meta name="description" content="A simple starting homepage for scanning major crypto coins." />
      </Head>

      <Box
        mih="100vh"
        py={{ base: 24, sm: 36, lg: 56 }}
        px={{ base: 16, sm: 24 }}
        style={{ backgroundColor: 'transparent' }}
      >
        <Container size="lg">
          <Stack gap="xl">
            <Stack gap="sm" maw={760}>
              <Badge color="teal" variant="light" size="lg" tt="uppercase">
                BTC Market Scanner
              </Badge>
              <Title order={1} maw={720} lh={0.95} fw={700}>
                Scan the market from one clean coin list.
              </Title>
              <Text c="dimmed" fz="lg" maw={760} lh={1.7}>
                Click a coin card to open the detail page. The list below is laid out in a single column so it is easier
                to scan from top to bottom.
              </Text>
            </Stack>

            <Paper
              radius="xl"
              p={{ base: 20, sm: 28 }}
              withBorder
              style={{
                backgroundColor: 'rgba(9, 18, 33, 0.88)',
                borderColor: 'rgba(255,255,255,0.08)',
              }}
            >
              <Stack gap="lg">
                <Group justify="space-between" align="flex-start" gap="lg">
                  <Stack gap={4}>
                    <Badge color="teal" variant="light" size="lg" tt="uppercase">
                      Futures exchangeInfo
                    </Badge>
                    <Title order={2} fz="h3">
                      Live market structure snapshot
                    </Title>
                    <Text c="dimmed" size="sm" maw={720}>
                      A compact overview of the current market structure and available trading symbols.
                    </Text>
                  </Stack>
                  <Badge variant="light" color="gray" size="lg">
                    {exchangeInfo?.timezone ?? 'UTC'}
                  </Badge>
                </Group>

                <Divider color="rgba(255,255,255,0.08)" />

                {isLoading ? (
                  <Text c="dimmed" size="sm">
                    Loading exchange info...
                  </Text>
                ) : error ? (
                  <Text c="dimmed" size="sm">
                    Exchange info is temporarily unavailable.
                  </Text>
                ) : exchangeInfo ? (
                  <Stack gap="lg">
                    <SimpleGrid cols={{ base: 1, sm: 2, md: 5 }} spacing="md">
                      <StatCard label="Symbols" value={formatInteger(exchangeInfo.summary.symbolCount)} />
                      <StatCard label="Trading" value={formatInteger(exchangeInfo.summary.tradingSymbolCount)} />
                      <StatCard label="Request weight" value={formatInteger(exchangeInfo.summary.requestWeightLimit)} />
                      <StatCard label="Orders limit" value={formatInteger(exchangeInfo.summary.orderLimit)} />
                      <StatCard label="Assets" value={formatInteger(exchangeInfo.summary.assetCount)} />
                    </SimpleGrid>

                    <Group justify="space-between" align="center" wrap="wrap">
                      <Text size="sm" c="dimmed">
                        Perpetual contracts: {formatInteger(exchangeInfo.summary.perpetualSymbolCount)}
                      </Text>
                      <Text size="sm" c="dimmed">
                        Margin available assets: {formatInteger(exchangeInfo.summary.marginAvailableAssetCount)}
                      </Text>
                    </Group>

                    <Group gap="xs" wrap="wrap">
                      {exchangeInfo.summary.featuredSymbols.map((symbol) => (
                        <Badge key={symbol} variant="light" color="teal">
                          {symbol}
                        </Badge>
                      ))}
                    </Group>

                    <Group gap="xs" wrap="wrap">
                      {exchangeInfo.summary.featuredAssets.map((asset) => (
                        <Badge key={asset} variant="light" color="gray">
                          {asset}
                        </Badge>
                      ))}
                    </Group>
                  </Stack>
                ) : null}
              </Stack>
            </Paper>

            <Paper
              radius="xl"
              p={0}
              withBorder
              shadow="xl"
              style={{
                backgroundColor: 'rgba(9, 18, 33, 0.88)',
                backdropFilter: 'blur(18px)',
              }}
            >
              <Group justify="space-between" px={{ base: 16, sm: 24 }} py={16}>
                <Title order={2} fz="h3">
                  Coins
                </Title>
                <Text size="sm" c="dimmed">
                  {marketItems.length} coins total · 10 per page
                </Text>
              </Group>

              <Divider color="rgba(255,255,255,0.1)" />

              <Stack gap={0}>
                {visibleMarketItems.map((coin) => (
                  <HomeCard key={coin.symbol} coin={coin} />
                ))}
              </Stack>

              {totalPages > 1 ? (
                <>
                  <Divider color="rgba(255,255,255,0.1)" />
                  <Group justify="space-between" px={{ base: 16, sm: 24 }} py={16}>
                    <Text size="sm" c="dimmed">
                      Showing {visibleMarketItems.length} of {marketItems.length} coins
                    </Text>
                    <Pagination
                      value={currentPage}
                      onChange={setActivePage}
                      total={totalPages}
                      color="teal"
                      size="sm"
                    />
                  </Group>
                </>
              ) : null}
            </Paper>

            <AnalysisDisclaimer />

            <AppFooter />
          </Stack>
        </Container>
      </Box>
    </>
  );
}
