import { AxiosService } from '@services/axios.service';
import { BASE_API_BINANCE } from '@configs/base';
import { FuturesExchangeInfoRepositoryImpl } from '../infrastructure/futuresExchangeInfo.repository.impl';
import { GetFuturesExchangeInfoSummaryUseCase } from './futuresExchangeInfo.usecase';

export class FuturesExchangeInfoController {
  private readonly axiosService: AxiosService;
  private readonly futuresExchangeInfoRepository: FuturesExchangeInfoRepositoryImpl;
  private readonly getFuturesExchangeInfoSummaryUseCase: GetFuturesExchangeInfoSummaryUseCase;

  constructor() {
    this.axiosService = new AxiosService({
      baseURL: BASE_API_BINANCE,
    });
    this.futuresExchangeInfoRepository = new FuturesExchangeInfoRepositoryImpl(this.axiosService);
    this.getFuturesExchangeInfoSummaryUseCase = new GetFuturesExchangeInfoSummaryUseCase(this.futuresExchangeInfoRepository);
  }

  getExchangeInfoSummary() {
    return this.getFuturesExchangeInfoSummaryUseCase.execute();
  }
}
