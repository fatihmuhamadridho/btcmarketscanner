import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconArrowLeft,
} from "@tabler/icons-react";
import { formatDecimalString } from "@/common/utils/format-number";
import CoinChart from "./CoinChart";
import {
  useFuturesMarketSymbolCandles,
  useFuturesMarketSymbolInitialCandles,
  useFuturesMarketSymbolSnapshot,
  useFuturesMarketTimeframeSupportResistance,
} from "@/core/binance/futures/market/infrastructure/futuresMarket.hook";

function formatDate(value?: number) {
  if (!value) return "n/a";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

const TIMEFRAMES = [
  { label: "1m", value: "1m" },
  { label: "5m", value: "5m" },
  { label: "15m", value: "15m" },
  { label: "30m", value: "30m" },
  { label: "1H", value: "1h" },
  { label: "4H", value: "4h" },
  { label: "1D", value: "1d" },
] as const;
type CoinTimeframe = (typeof TIMEFRAMES)[number]["value"];

const MARKET_STRUCTURE_TERMS = [
  { label: "Short-term", value: "short" },
  { label: "Medium-term", value: "medium" },
  { label: "Long-term", value: "long" },
] as const;

type MarketStructureTerm = (typeof MARKET_STRUCTURE_TERMS)[number]["value"];

const MARKET_STRUCTURE_WINDOW_SIZES: Record<MarketStructureTerm, number> = {
  short: 20,
  medium: 50,
  long: 100,
};

export default function CoinDetailPage() {
  const router = useRouter();
  const symbolParam = router.query.symbol;
  const symbol = typeof symbolParam === "string" ? symbolParam : undefined;
  const [interval, setInterval] = useState<CoinTimeframe>("1d");
  const [structureTerm, setStructureTerm] =
    useState<MarketStructureTerm>("short");
  const {
    data: snapshotData,
    isLoading: isLoadingSnapshot,
    error: snapshotError,
  } = useFuturesMarketSymbolSnapshot(symbol);
  const {
    data: initialCandlesData,
    isFetching: isFetchingInitialCandles,
    error: candlesError,
  } = useFuturesMarketSymbolInitialCandles(symbol, interval);
  const detail = snapshotData?.data;
  const marketSymbol = detail?.symbol;
  const symbolInfo = detail?.symbolInfo;
  const chartInitialCandles = useMemo(
    () => (isFetchingInitialCandles ? [] : initialCandlesData?.data ?? []),
    [initialCandlesData?.data, isFetchingInitialCandles],
  );
  const {
    candles,
    hasMoreOlderCandles,
    isLoadingMore,
    loadOlderCandles,
  } = useFuturesMarketSymbolCandles(
    symbol,
    chartInitialCandles,
    interval,
  );
  const pageError = snapshotError;
  const isPageLoading = isLoadingSnapshot;
  const structureWindowSize = MARKET_STRUCTURE_WINDOW_SIZES[structureTerm];
  const timeframeSupportResistance =
    useFuturesMarketTimeframeSupportResistance(symbol, structureWindowSize);

  return (
    <>
      <Head>
        <title>{`${symbol ?? "Coin"} | BTC Market Scanner`}</title>
        <meta
          name="description"
          content="Detail market view untuk futures contract."
        />
      </Head>

      <Box
        mih="100vh"
        py={{ base: 24, sm: 36, lg: 56 }}
        px={{ base: 16, sm: 24 }}
        style={{ backgroundColor: "transparent" }}
      >
        <Container size="lg">
          <Stack gap="xl">
            <Button
              component={Link}
              href="/"
              variant="subtle"
              color="gray"
              leftSection={<IconArrowLeft size={16} />}
              w="fit-content"
              px={0}
            >
              Kembali ke homepage
            </Button>

            {isPageLoading ? (
              <Paper
                radius="xl"
                p={{ base: 20, sm: 28 }}
                withBorder
                style={{
                  backgroundColor: "rgba(9, 18, 33, 0.88)",
                  borderColor: "rgba(255,255,255,0.08)",
                }}
              >
                <Text c="dimmed" size="sm">
                  Loading symbol detail...
                </Text>
              </Paper>
            ) : pageError ? (
              <Paper
                radius="xl"
                p={{ base: 20, sm: 28 }}
                withBorder
                style={{
                  backgroundColor: "rgba(9, 18, 33, 0.88)",
                  borderColor: "rgba(255,255,255,0.08)",
                }}
              >
                <Text c="dimmed" size="sm">
                  Failed to load market detail.
                </Text>
              </Paper>
            ) : detail && marketSymbol ? (
              <>
                <Paper
                  radius="xl"
                  p={{ base: 20, sm: 28 }}
                  withBorder
                  shadow="xl"
                  style={{
                    backgroundColor: "rgba(9, 18, 33, 0.88)",
                    backdropFilter: "blur(18px)",
                  }}
                >
                  <Group justify="space-between" align="flex-start" gap="xl">
                    <Stack gap="md" maw={720}>
                      <Group gap="sm">
                        <Badge color="teal" variant="light" size="lg" tt="uppercase">
                          {symbolInfo?.contractType ?? marketSymbol.contractType ?? "FUTURES"}
                        </Badge>
                        <Badge variant="light" color="gray" size="lg">
                          {marketSymbol.symbol}
                        </Badge>
                      </Group>
                      <Title order={1} lh={0.95} fw={700}>
                        {marketSymbol.displayName}
                      </Title>
                      <Text c="dimmed" fz="lg" lh={1.7}>
                        Pair: {marketSymbol.pair ?? "n/a"} · Base asset:{" "}
                        {marketSymbol.baseAsset ?? "n/a"} · Quote asset:{" "}
                        {marketSymbol.quoteAsset ?? "n/a"}
                      </Text>
                      <Text fz="md" lh={1.7}>
                        Status: {marketSymbol.status ?? "n/a"} · Onboard:{" "}
                        {formatDate(symbolInfo?.onboardDate)}
                      </Text>
                    </Stack>

                    <Stack gap="sm" miw={260}>
                      <Text c="dimmed" size="sm">
                        Latest snapshot
                      </Text>
                      <Card
                        radius="lg"
                        p="lg"
                        withBorder
                        style={{
                          backgroundColor: "rgba(255,255,255,0.03)",
                          borderColor: "rgba(255,255,255,0.08)",
                        }}
                      >
                        <Stack gap="sm">
                          <Group gap="sm" align="center">
                            <ThemeIcon
                              size={44}
                              radius="xl"
                              variant="light"
                              color="teal"
                            >
                              {marketSymbol.symbol.slice(0, 1)}
                            </ThemeIcon>
                            <Stack gap={0}>
                              <Text fw={700} fz="xl">
                                {marketSymbol.ticker.displayLastPrice}
                              </Text>
                              <Text c="teal" fw={600}>
                                {marketSymbol.ticker.displayChange}
                              </Text>
                            </Stack>
                          </Group>
                          <Divider color="rgba(255,255,255,0.08)" />
                          <Text size="sm" c="dimmed">
                            24h quote volume
                          </Text>
                          <Text fw={600}>{marketSymbol.ticker.displayVolume}</Text>
                        </Stack>
                      </Card>
                    </Stack>
                  </Group>
                </Paper>

                <CoinChart
                  symbol={marketSymbol.symbol}
                  candles={candles}
                  hasMoreOlderCandles={hasMoreOlderCandles}
                  isLoadingMore={isLoadingMore}
                  isLoadingCandles={isFetchingInitialCandles}
                  chartError={candlesError ? "Failed to load candles." : null}
                  onLoadOlderCandles={loadOlderCandles}
                  interval={interval}
                  intervals={TIMEFRAMES}
                  onIntervalChange={setInterval}
                />

                <Paper
                  radius="xl"
                  p={{ base: 20, sm: 28 }}
                  withBorder
                  style={{
                    backgroundColor: "rgba(9, 18, 33, 0.88)",
                    borderColor: "rgba(255,255,255,0.08)",
                  }}
                >
                  <Stack gap="lg">
                    <Group justify="space-between" align="center" wrap="wrap">
                      <Stack gap={4}>
                        <Title order={2} fz="h3">
                          Market Structure
                        </Title>
                        <Text c="dimmed" size="sm">
                          Short-term, medium-term, and long-term support
                          structure
                        </Text>
                      </Stack>
                    </Group>

                    <Divider color="rgba(255,255,255,0.08)" />

                    <SegmentedControl
                      data={MARKET_STRUCTURE_TERMS.map((item) => ({
                        label: item.label,
                        value: item.value,
                      }))}
                      value={structureTerm}
                      onChange={(value) =>
                        setStructureTerm(value as MarketStructureTerm)
                      }
                      fullWidth
                      radius="xl"
                      size="sm"
                      styles={{
                        root: {
                          backgroundColor: "rgba(255,255,255,0.04)",
                          padding: 4,
                        },
                        indicator: {
                          backgroundColor: "rgba(87, 199, 166, 0.18)",
                          boxShadow: "0 0 0 1px rgba(87, 199, 166, 0.18)",
                        },
                        label: {
                          color: "rgba(255,255,255,0.7)",
                          fontWeight: 600,
                        },
                      }}
                    />

                    <Divider color="rgba(255,255,255,0.08)" />
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
                      {timeframeSupportResistance.map((item) => (
                        <Card
                          key={item.interval}
                          radius="lg"
                          p="lg"
                          withBorder
                          style={{
                            backgroundColor: "rgba(255,255,255,0.03)",
                            borderColor: "rgba(255,255,255,0.08)",
                          }}
                        >
                          <Stack gap={10}>
                            <Group justify="space-between" align="center">
                              <Text fw={700}>{item.label}</Text>
                              {item.isLoading ? (
                                <Badge variant="light" color="gray">
                                  Loading
                                </Badge>
                              ) : null}
                            </Group>

                            <Stack gap={4}>
                              <Text c="dimmed" size="sm">
                                Support
                              </Text>
                              <Text fw={700}>
                                {formatDecimalString(
                                  item.supportResistance?.support?.toString(),
                                )}
                              </Text>
                            </Stack>

                            <Stack gap={4}>
                              <Text c="dimmed" size="sm">
                                Resistance
                              </Text>
                              <Text fw={700}>
                                {formatDecimalString(
                                  item.supportResistance?.resistance?.toString(),
                                )}
                              </Text>
                            </Stack>
                          </Stack>
                        </Card>
                      ))}
                    </SimpleGrid>
                  </Stack>
                </Paper>
              </>
            ) : null}
          </Stack>
        </Container>
      </Box>
    </>
  );
}
