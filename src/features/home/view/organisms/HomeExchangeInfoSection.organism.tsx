import { Badge, Divider, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { formatInteger } from '@utils/format-number.util';
import HomeStatCard from '../atoms/HomeStatCard.atom';
import type { HomeExchangeInfo } from '../../interface/HomeView.interface';

type HomeExchangeInfoSectionProps = {
  error?: boolean;
  exchangeInfo?: HomeExchangeInfo;
  isLoading: boolean;
};

export default function HomeExchangeInfoSection({ error, exchangeInfo, isLoading }: HomeExchangeInfoSectionProps) {
  return (
    <Paper
      radius="lg"
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
              <HomeStatCard label="Symbols" value={formatInteger(exchangeInfo.summary.symbolCount ?? 0)} />
              <HomeStatCard label="Trading" value={formatInteger(exchangeInfo.summary.tradingSymbolCount ?? 0)} />
              <HomeStatCard label="Request weight" value={formatInteger(exchangeInfo.summary.requestWeightLimit ?? 0)} />
              <HomeStatCard label="Orders limit" value={formatInteger(exchangeInfo.summary.orderLimit ?? 0)} />
              <HomeStatCard label="Assets" value={formatInteger(exchangeInfo.summary.assetCount ?? 0)} />
            </SimpleGrid>

            <Group justify="space-between" align="center" wrap="wrap">
              <Text size="sm" c="dimmed">
                Perpetual contracts: {formatInteger(exchangeInfo.summary.perpetualSymbolCount ?? 0)}
              </Text>
              <Text size="sm" c="dimmed">
                Margin available assets: {formatInteger(exchangeInfo.summary.marginAvailableAssetCount ?? 0)}
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
  );
}
