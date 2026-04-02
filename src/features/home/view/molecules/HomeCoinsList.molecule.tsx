import { Stack } from '@mantine/core';
import HomeCard from './HomeCard.molecule';
import type { HomeCoinsListProps } from '../../interface/HomeCoinsSection.interface';

export default function HomeCoinsList({ coinCards }: HomeCoinsListProps) {
  return (
    <Stack gap={0}>
      {coinCards.map(({ changeBadgeColor, ...coin }) => (
        <HomeCard key={coin.symbol} changeBadgeColor={changeBadgeColor} {...coin} />
      ))}
    </Stack>
  );
}
