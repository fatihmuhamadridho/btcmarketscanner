import { useMemo, useState } from 'react';
import { useFuturesMarketOverview } from '@core/binance/futures/market/infrastructure/futuresMarket.hook';
import type { FuturesMarketOverviewItem } from '@core/binance/futures/market/domain/futuresMarket.model';
import type { HomeCardChangeBadgeColor, HomeSortMode } from '../interface/HomeView.interface';

export const HOME_PAGE_SIZE = 10;
const EMPTY_MARKET_ITEMS: FuturesMarketOverviewItem[] = [];

export function getHomeCardChangeBadgeColor(priceChangePercent: number): HomeCardChangeBadgeColor {
  if (priceChangePercent > 0) {
    return 'green';
  }

  if (priceChangePercent < 0) {
    return 'red';
  }

  return 'gray';
}

export function useHomePageLogic() {
  const { data, error, isLoading } = useFuturesMarketOverview();
  const [activePage, setActivePage] = useState(1);
  const [sortMode, setSortMode] = useState<HomeSortMode>('volume');

  const exchangeInfo = data?.exchangeInfo;
  const marketItems = data?.data ?? EMPTY_MARKET_ITEMS;

  const sortedMarketItems = useMemo(() => {
    const items = [...marketItems];

    switch (sortMode) {
      case 'gainers':
        return items.sort((left, right) => Number(right.ticker.priceChangePercent ?? 0) - Number(left.ticker.priceChangePercent ?? 0));
      case 'losers':
        return items.sort((left, right) => Number(left.ticker.priceChangePercent ?? 0) - Number(right.ticker.priceChangePercent ?? 0));
      case 'volume':
      default:
        return items.sort((left, right) => {
          const leftVolume = Number(left.ticker.quoteVolume ?? left.ticker.volume ?? 0);
          const rightVolume = Number(right.ticker.quoteVolume ?? right.ticker.volume ?? 0);

          return rightVolume - leftVolume;
        });
    }
  }, [marketItems, sortMode]);

  const totalPages = Math.max(1, Math.ceil(sortedMarketItems.length / HOME_PAGE_SIZE));
  const currentPage = Math.min(activePage, totalPages);

  const visibleMarketItems = useMemo(() => {
    const startIndex = (currentPage - 1) * HOME_PAGE_SIZE;

    return sortedMarketItems.slice(startIndex, startIndex + HOME_PAGE_SIZE);
  }, [currentPage, sortedMarketItems]);

  return {
    activePage,
    currentPage,
    error,
    exchangeInfo,
    isLoading,
    marketItems,
    setSortMode,
    setActivePage,
    totalPages,
    sortMode,
    visibleMarketItems,
  };
}

export type HomePageViewModel = ReturnType<typeof useHomePageLogic>;
