import { FuturesExchangeInfoResponse } from './futuresExchangeInfo.interface';

export abstract class FuturesExchangeInfoRepository {
  abstract getExchangeInfo(): Promise<FuturesExchangeInfoResponse>;
}
