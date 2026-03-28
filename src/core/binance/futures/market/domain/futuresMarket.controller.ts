import { createFuturesMarketRepository } from "../infrastructure/futuresMarket.repository.impl";
import {
  GetFuturesMarketOverviewUseCase,
  GetFuturesMarketOlderCandlesUseCase,
  GetFuturesMarketInitialCandlesUseCase,
  GetFuturesMarketSymbolSnapshotUseCase,
  GetFuturesMarketSymbolDetailUseCase,
} from "./futuresMarket.usecase";

export class FuturesMarketController {
  private readonly getFuturesMarketOverviewUseCase: GetFuturesMarketOverviewUseCase;
  private readonly getFuturesMarketSymbolDetailUseCase: GetFuturesMarketSymbolDetailUseCase;
  private readonly getFuturesMarketSymbolSnapshotUseCase: GetFuturesMarketSymbolSnapshotUseCase;
  private readonly getFuturesMarketInitialCandlesUseCase: GetFuturesMarketInitialCandlesUseCase;
  private readonly getFuturesMarketOlderCandlesUseCase: GetFuturesMarketOlderCandlesUseCase;

  constructor() {
    const repository = createFuturesMarketRepository();
    this.getFuturesMarketOverviewUseCase = new GetFuturesMarketOverviewUseCase(
      repository,
    );
    this.getFuturesMarketSymbolDetailUseCase =
      new GetFuturesMarketSymbolDetailUseCase(repository);
    this.getFuturesMarketSymbolSnapshotUseCase =
      new GetFuturesMarketSymbolSnapshotUseCase(repository);
    this.getFuturesMarketInitialCandlesUseCase =
      new GetFuturesMarketInitialCandlesUseCase(repository);
    this.getFuturesMarketOlderCandlesUseCase =
      new GetFuturesMarketOlderCandlesUseCase(repository);
  }

  getMarketOverview() {
    return this.getFuturesMarketOverviewUseCase.execute();
  }

  getMarketSymbolDetail(symbol: string, interval = "1d") {
    return this.getFuturesMarketSymbolDetailUseCase.execute(symbol, interval);
  }

  getMarketSymbolSnapshot(symbol: string) {
    return this.getFuturesMarketSymbolSnapshotUseCase.execute(symbol);
  }

  getMarketInitialCandles(symbol: string, interval = "1d", limit = 500) {
    return this.getFuturesMarketInitialCandlesUseCase.execute(
      symbol,
      interval,
      limit,
    );
  }

  getOlderMarketCandles(
    symbol: string,
    beforeOpenTime: number,
    interval = "1d",
    limit = 48,
  ) {
    return this.getFuturesMarketOlderCandlesUseCase.execute(
      symbol,
      beforeOpenTime,
      interval,
      limit,
    );
  }
}
