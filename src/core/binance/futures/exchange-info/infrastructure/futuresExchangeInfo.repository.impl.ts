import { AxiosService } from "@/common/services/axios.service";
import { FuturesExchangeInfoRepository } from "../domain/futuresExchangeInfo.repository";
import type { FuturesExchangeInfoResponse } from "../domain/futuresExchangeInfo.type";

export class FuturesExchangeInfoRepositoryImpl
  implements FuturesExchangeInfoRepository
{
  constructor(private readonly axiosService: AxiosService) {}

  async getExchangeInfo(): Promise<FuturesExchangeInfoResponse> {
    return this.axiosService.get("/exchangeInfo");
  }
}
