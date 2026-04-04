export type AppNavbarMarketItem = {
  baseAsset?: string | null;
  displayName?: string | null;
  pair?: string | null;
  quoteAsset?: string | null;
  status?: string | null;
  symbol: string;
  ticker?: {
    displayChange?: string | null;
    displayLastPrice?: string | null;
    priceChangePercent?: string | null;
  } | null;
};

export type AppNavbarAccountProfile = {
  avatarLabel: string;
  displayName: string;
  isConfigured: boolean;
  subtitle: string;
};

export type AppNavbarProps = {
  isMarketLoading: boolean;
  marketItems: AppNavbarMarketItem[];
};
