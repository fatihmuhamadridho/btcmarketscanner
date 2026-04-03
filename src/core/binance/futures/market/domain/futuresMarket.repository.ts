import type { FuturesExchangeInfoResponse, FuturesKlinesQuery, FuturesKlinesResponse, FuturesTicker24hrResponse } from './futuresMarket.interface';

export abstract class FuturesMarketRepository {
  abstract getExchangeInfo(): Promise<FuturesExchangeInfoResponse>;
  abstract getTickers24hr(): Promise<FuturesTicker24hrResponse>;
  abstract getKlines(symbol: string, options?: FuturesKlinesQuery): Promise<FuturesKlinesResponse>;
}
