import { Divider, Group, Pagination, Text } from '@mantine/core';
import type { HomeCoinsPaginationProps } from '../../interface/HomeCoinsSection.interface';

export default function HomeCoinsPagination({
  currentPage,
  marketItemCount,
  setActivePage,
  totalPages,
  visibleCount,
}: HomeCoinsPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <>
      <Divider color="rgba(255,255,255,0.1)" />
      <Group justify="space-between" px={{ base: 16, sm: 24 }} py={16}>
        <Text size="sm" c="dimmed">
          Showing {visibleCount} of {marketItemCount} coins
        </Text>
        <Pagination value={currentPage} onChange={setActivePage} total={totalPages} color="teal" size="sm" />
      </Group>
    </>
  );
}
