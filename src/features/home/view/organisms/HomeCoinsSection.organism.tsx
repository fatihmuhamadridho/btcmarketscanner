import { Divider, Group, Paper } from '@mantine/core';
import HomeCoinsList from '../molecules/HomeCoinsList.molecule';
import HomeCoinsPagination from '../molecules/HomeCoinsPagination.molecule';
import HomeCoinsSectionHeader from '../molecules/HomeCoinsSectionHeader.molecule';
import HomeCoinsSortControl from '../molecules/HomeCoinsSortControl.molecule';
import type { HomeCoinsSectionProps } from '../../interface/HomeCoinsSection.interface';

export default function HomeCoinsSection({
  currentPage,
  coinCards,
  marketItems,
  setActivePage,
  setSortMode,
  sortMode,
  totalPages,
}: HomeCoinsSectionProps) {
  const marketItemCount = marketItems.length;

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
      <Group justify="space-between" align="flex-start" gap="md" px={{ base: 16, sm: 24 }} py={16} wrap="wrap">
        <HomeCoinsSectionHeader marketItemCount={marketItemCount} />
        <HomeCoinsSortControl setActivePage={setActivePage} setSortMode={setSortMode} sortMode={sortMode} />
      </Group>

      <Divider color="rgba(255,255,255,0.1)" />

      <HomeCoinsList coinCards={coinCards} />

      <HomeCoinsPagination
        currentPage={currentPage}
        marketItemCount={marketItemCount}
        setActivePage={setActivePage}
        totalPages={totalPages}
        visibleCount={coinCards.length}
      />
    </Paper>
  );
}
