export type HomeCardChangeBadgeColor = 'green' | 'red' | 'gray';

export type HomeCoinCardViewModel = {
  changeBadgeColor: HomeCardChangeBadgeColor;
  baseAsset?: string | null;
  contractType?: string | null;
  displayChange?: string | null;
  displayLastPrice?: string | null;
  displayName?: string | null;
  pair?: string | null;
  quoteAsset?: string | null;
  status?: string | null;
  symbol: string;
};

export type HomeExchangeInfo = {
  summary: {
    assetCount: number | null;
    featuredAssets: string[];
    featuredSymbols: string[];
    marginAvailableAssetCount: number | null;
    orderLimit: number | null;
    perpetualSymbolCount: number | null;
    requestWeightLimit: number | null;
    symbolCount: number | null;
    tradingSymbolCount: number | null;
  };
  timezone?: string | null;
} | null | undefined;
