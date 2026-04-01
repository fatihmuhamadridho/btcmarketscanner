import { useMemo, useState } from 'react';
import { useFuturesMarketOverview } from '@core/binance/futures/market/infrastructure/futuresMarket.hook';
import type { FuturesMarketOverviewItem } from '@core/binance/futures/market/domain/futuresMarket.model';
import type { HomeCardChangeBadgeColor } from '../interface/HomeView.interface';

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

  const exchangeInfo = data?.exchangeInfo;
  const marketItems = data?.data ?? EMPTY_MARKET_ITEMS;
  const totalPages = Math.max(1, Math.ceil(marketItems.length / HOME_PAGE_SIZE));
  const currentPage = Math.min(activePage, totalPages);

  const visibleMarketItems = useMemo(() => {
    const startIndex = (currentPage - 1) * HOME_PAGE_SIZE;

    return marketItems.slice(startIndex, startIndex + HOME_PAGE_SIZE);
  }, [currentPage, marketItems]);

  return {
    activePage,
    currentPage,
    error,
    exchangeInfo,
    isLoading,
    marketItems,
    setActivePage,
    totalPages,
    visibleMarketItems,
  };
}

export type HomePageViewModel = ReturnType<typeof useHomePageLogic>;
