import type { FuturesExchangeInfo, FuturesExchangeInfoSummary } from './models/futuresExchangeInfo.model';

export type FuturesExchangeInfoResponse = {
  exchangeFilters?: unknown[];
  rateLimits: Array<{
    interval: string;
    intervalNum: number;
    limit: number;
    rateLimitType: string;
  }>;
  assets: Array<{
    asset: string;
    autoAssetExchange: string | null;
    marginAvailable: boolean;
  }>;
  symbols: Array<{
    asset?: string;
    baseAsset?: string;
    baseAssetPrecision?: number;
    contractType?: string;
    deliveryDate?: number;
    filters?: Array<Record<string, unknown> & { filterType?: string }>;
    marginAsset?: string;
    onboardDate?: number;
    orderTypes?: string[];
    pair?: string;
    pricePrecision?: number;
    quantityPrecision?: number;
    quoteAsset?: string;
    quotePrecision?: number;
    settlePlan?: number;
    status?: string;
    symbol: string;
    timeInForce?: string[];
    triggerProtect?: string;
    underlyingSubType?: string[];
    underlyingType?: string;
  }>;
  timezone: string;
};

export type FuturesExchangeInfoResult = {
  data: FuturesExchangeInfo;
};

export type FuturesExchangeInfoSummaryResult = {
  data: FuturesExchangeInfoSummary;
};
