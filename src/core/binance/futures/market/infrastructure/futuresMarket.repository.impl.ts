import { AxiosService } from "@/common/services/axios.service";
import { BASE_API_BINANCE } from "@/common/configs/base";
import { FuturesMarketRepository } from "../domain/futuresMarket.repository";
import type {
  FuturesExchangeInfoResponse,
  FuturesKlinesQuery,
  FuturesKlinesResponse,
  FuturesTicker24hrResponse,
} from "../domain/futuresMarket.type";

export class FuturesMarketRepositoryImpl implements FuturesMarketRepository {
  constructor(private readonly axiosService: AxiosService) {}

  async getExchangeInfo(): Promise<FuturesExchangeInfoResponse> {
    return this.axiosService.get("/exchangeInfo");
  }

  async getTickers24hr(): Promise<FuturesTicker24hrResponse> {
    return this.axiosService.get("/ticker/24hr");
  }

  async getKlines(
    symbol: string,
    options: FuturesKlinesQuery = {},
  ): Promise<FuturesKlinesResponse> {
    const { endTime, interval = "1d", limit = 48, startTime } = options;

    return this.axiosService.get("/klines", {
      params: {
        ...(startTime !== undefined ? { startTime } : {}),
        ...(endTime !== undefined ? { endTime } : {}),
        symbol,
        interval,
        limit,
      },
    });
  }
}

export function createFuturesMarketRepository() {
  return new FuturesMarketRepositoryImpl(
    new AxiosService({
      baseURL: BASE_API_BINANCE,
    }),
  );
}
