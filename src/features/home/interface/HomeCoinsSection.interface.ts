import type { HomeCoinCardViewModel, HomeSortMode } from './HomeView.interface';

export type HomeCoinsSectionHeaderProps = {
  marketItemCount: number;
};

export type HomeCoinsSortControlProps = {
  setActivePage: (page: number) => void;
  setSortMode: (mode: HomeSortMode) => void;
  sortMode: HomeSortMode;
};

export type HomeCoinsListProps = {
  coinCards: HomeCoinCardViewModel[];
};

export type HomeCoinsPaginationProps = {
  currentPage: number;
  marketItemCount: number;
  setActivePage: (page: number) => void;
  totalPages: number;
  visibleCount: number;
};

export type HomeCoinsSectionProps = {
  currentPage: number;
  coinCards: HomeCoinCardViewModel[];
  marketItems: {
    symbol: string;
  }[];
  setActivePage: (page: number) => void;
  setSortMode: (mode: HomeSortMode) => void;
  sortMode: HomeSortMode;
  totalPages: number;
};
