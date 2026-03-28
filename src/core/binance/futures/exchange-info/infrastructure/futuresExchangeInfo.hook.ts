import { useQuery } from "@tanstack/react-query";
import type { FuturesExchangeInfoSummary } from "../domain/models/futuresExchangeInfo.model";
import { FuturesExchangeInfoController } from "../domain/futuresExchangeInfo.controller";

const futuresExchangeInfoController = new FuturesExchangeInfoController();

type FuturesExchangeInfoSummaryResponse = {
  data: FuturesExchangeInfoSummary;
};

export function useFuturesExchangeInfoSummary() {
  return useQuery<
    FuturesExchangeInfoSummaryResponse,
    Error,
    FuturesExchangeInfoSummary
  >({
    queryKey: ["futures-exchange-info-summary"],
    queryFn: () => futuresExchangeInfoController.getExchangeInfoSummary(),
    select: (response) => response.data,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
