import { Divider, Group, Pagination, Paper, Stack, Text, Title } from '@mantine/core';
import HomeCard from '../molecules/HomeCard.molecule';
import type { HomeCoinCardViewModel } from '../../interface/HomeView.interface';

type HomeCoinsSectionProps = {
  currentPage: number;
  coinCards: HomeCoinCardViewModel[];
  marketItems: {
    symbol: string;
  }[];
  setActivePage: (page: number) => void;
  totalPages: number;
};

export default function HomeCoinsSection({
  currentPage,
  coinCards,
  marketItems,
  setActivePage,
  totalPages,
}: HomeCoinsSectionProps) {
  return (
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
        {coinCards.map(({ changeBadgeColor, ...coin }) => (
          <HomeCard key={coin.symbol} changeBadgeColor={changeBadgeColor} {...coin} />
        ))}
      </Stack>

      {totalPages > 1 ? (
        <>
          <Divider color="rgba(255,255,255,0.1)" />
          <Group justify="space-between" px={{ base: 16, sm: 24 }} py={16}>
            <Text size="sm" c="dimmed">
              Showing {coinCards.length} of {marketItems.length} coins
            </Text>
            <Pagination value={currentPage} onChange={setActivePage} total={totalPages} color="teal" size="sm" />
          </Group>
        </>
      ) : null}
    </Paper>
  );
}
