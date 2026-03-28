import Head from "next/head";
import Link from "next/link";
import type { GetStaticPaths, GetStaticProps } from "next";
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconChartBar,
  IconRadar,
  IconTargetArrow,
} from "@tabler/icons-react";
import { coins, getCoinBySymbol, type Coin } from "@/data/coins";
import CoinChart from "./CoinChart";
import CoinMetricCard from "./CoinMetricCard";

type CoinDetailPageProps = {
  coin: Coin;
};

export default function CoinDetailPage({ coin }: CoinDetailPageProps) {
  return (
    <>
      <Head>
        <title>{`${coin.symbol} | BTC Market Scanner`}</title>
        <meta
          name="description"
          content={`Detail market view untuk ${coin.name} (${coin.symbol}).`}
        />
      </Head>

      <Box
        mih="100vh"
        py={{ base: 24, sm: 36, lg: 56 }}
        px={{ base: 16, sm: 24 }}
        style={{
          background:
            "radial-gradient(circle at top, rgba(87, 199, 166, 0.18), transparent 28%), linear-gradient(180deg, #09111e 0%, #07111f 100%)",
        }}
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
                    <Badge
                      color="teal"
                      variant="light"
                      size="lg"
                      tt="uppercase"
                    >
                      {coin.category}
                    </Badge>
                    <Badge variant="light" color="gray" size="lg">
                      {coin.symbol}
                    </Badge>
                  </Group>
                  <Title order={1} lh={0.95} fw={700}>
                    {coin.name}
                  </Title>
                  <Text c="dimmed" fz="lg" lh={1.7}>
                    {coin.description}
                  </Text>
                  <Text fz="md" lh={1.7}>
                    {coin.thesis}
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
                          {coin.symbol.slice(0, 1)}
                        </ThemeIcon>
                        <Stack gap={0}>
                          <Text fw={700} fz="xl">
                            {coin.price}
                          </Text>
                          <Text c="teal" fw={600}>
                            {coin.change}
                          </Text>
                        </Stack>
                      </Group>
                      <Divider color="rgba(255,255,255,0.08)" />
                      <Text size="sm" c="dimmed">
                        Volume
                      </Text>
                      <Text fw={600}>{coin.volume}</Text>
                    </Stack>
                  </Card>
                </Stack>
              </Group>
            </Paper>

            <CoinChart coin={coin} />

            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
              <CoinMetricCard
                icon={<IconChartBar size={18} />}
                label="Support"
                value={coin.support}
              />
              <CoinMetricCard
                icon={<IconTargetArrow size={18} />}
                label="Resistance"
                value={coin.resistance}
              />
              <CoinMetricCard
                icon={<IconRadar size={18} />}
                label="Focus"
                value={coin.note}
              />
            </SimpleGrid>

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
                <Group justify="space-between" align="center">
                  <Stack gap={4}>
                    <Title order={2} fz="h3">
                      Watch list
                    </Title>
                    <Text c="dimmed" size="sm">
                      Area yang paling relevan untuk dipantau
                    </Text>
                  </Stack>
                  <Badge variant="light" color="teal">
                    {coin.symbol}
                  </Badge>
                </Group>

                <Divider color="rgba(255,255,255,0.08)" />

                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                  {coin.watchList.map((item) => (
                    <Card
                      key={item}
                      radius="lg"
                      p="md"
                      withBorder
                      style={{
                        backgroundColor: "rgba(255,255,255,0.03)",
                        borderColor: "rgba(255,255,255,0.08)",
                      }}
                    >
                      <Text fw={600}>{item}</Text>
                    </Card>
                  ))}
                </SimpleGrid>
              </Stack>
            </Paper>
          </Stack>
        </Container>
      </Box>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: coins.map((coin) => ({
      params: { symbol: coin.symbol },
    })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<CoinDetailPageProps> = async ({
  params,
}) => {
  const symbol = params?.symbol;

  if (typeof symbol !== "string") {
    return { notFound: true };
  }

  const coin = getCoinBySymbol(symbol);

  if (!coin) {
    return { notFound: true };
  }

  return {
    props: {
      coin,
    },
  };
};
