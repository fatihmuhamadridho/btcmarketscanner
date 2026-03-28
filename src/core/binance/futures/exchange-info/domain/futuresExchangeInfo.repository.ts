import { FuturesExchangeInfoResponse } from "./futuresExchangeInfo.type";

export abstract class FuturesExchangeInfoRepository {
  abstract getExchangeInfo(): Promise<FuturesExchangeInfoResponse>;
}
