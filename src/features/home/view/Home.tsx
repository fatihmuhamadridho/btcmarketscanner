import Head from "next/head";
import {
  Badge,
  Box,
  Container,
  Divider,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { coins } from "@/data/coins";
import HomeCard from "./HomeCard";

export default function Home() {
  return (
    <>
      <Head>
        <title>BTC Market Scanner</title>
        <meta
          name="description"
          content="A simple starting homepage for scanning major crypto coins."
        />
      </Head>

      <Box
        mih="100vh"
        py={{ base: 24, sm: 36, lg: 56 }}
        px={{ base: 16, sm: 24 }}
        style={{
          background:
            "radial-gradient(circle at top, rgba(87, 199, 166, 0.16), transparent 32%), linear-gradient(180deg, #09111e 0%, #07111f 100%)",
        }}
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
                Klik card coin untuk masuk ke halaman detail. Daftar di bawah
                dibuat satu kolom supaya lebih enak dibaca dari atas ke bawah.
              </Text>
            </Stack>

            <Paper
              radius="xl"
              p={0}
              withBorder
              shadow="xl"
              style={{
                backgroundColor: "rgba(9, 18, 33, 0.88)",
                backdropFilter: "blur(18px)",
              }}
            >
              <Group justify="space-between" px={{ base: 16, sm: 24 }} py={16}>
                <Title order={2} fz="h3">
                  Coins
                </Title>
                <Text size="sm" c="dimmed">
                  Basic starter list
                </Text>
              </Group>

              <Divider color="rgba(255,255,255,0.1)" />

              <Stack gap={0}>
                {coins.map((coin) => (
                  <HomeCard key={coin.symbol} coin={coin} />
                ))}
              </Stack>
            </Paper>
          </Stack>
        </Container>
      </Box>
    </>
  );
}
