import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BASE_API_BINANCE } from '@configs/base.config';
import { formatDecimalString } from '@utils/format-number.util';
import type {
  CoinAutoBotAllocationUnit,
  CoinAutoBotSectionViewModel,
  CoinAutoBotOpenPosition,
  CoinAutoBotOpenOrder,
  CoinAutoBotTimeframeSummary,
  CoinSetupDetail,
  CoinPriceLevelFormatter,
  CoinPriceZoneFormatter,
  CoinAutoBotStatus,
} from '../interface/CoinView.interface';

type CoinAutoBotLogicProps = {
  activeSetup: CoinSetupDetail;
  currentPrice: number | null;
  executionBasisLabel: string;
  executionConsensusLabel: string;
  formatPriceLevel: CoinPriceLevelFormatter;
  formatPriceZone: CoinPriceZoneFormatter;
  timeframeSummaries: CoinAutoBotTimeframeSummary[];
  symbol: string;
};

type CoinAutoBotApiResponse =
  | {
      bot: {
        botId: string;
        createdAt: string;
        plan: {
          allocationUnit: CoinAutoBotAllocationUnit;
          allocationValue: number;
          currentPrice: number | null;
          direction: 'long' | 'short';
          entryMid: number | null;
          entryZone: { high: number | null; low: number | null };
          leverage: number;
          notes: string[];
          riskReward: number | null;
          setupGrade: 'A+' | 'A' | 'B' | 'C';
          setupGradeRank: number;
          setupLabel: string;
          stopLoss: number | null;
          symbol: string;
          takeProfits: Array<{ label: 'TP1' | 'TP2' | 'TP3'; price: number | null }>;
        };
        status: CoinAutoBotStatus;
        updatedAt: string;
      } | null;
      logs: Array<{
        id: string;
        level: 'info' | 'success' | 'warn' | 'error';
        message: string;
        timestamp: string;
      }>;
      ok: true;
    }
  | {
      error: string;
      ok: false;
    };

type CoinBinancePositionsApiResponse =
  | {
      ok: true;
      positions: Array<{
        entryPrice: number | null;
        isolatedMargin: number | null;
        leverage: number | null;
        liquidationPrice: number | null;
        marginType: string;
        markPrice: number | null;
        notional: number | null;
        positionAmt: number;
        positionSide: 'BOTH' | 'LONG' | 'SHORT';
        symbol: string;
        unrealizedPnl: number | null;
      }>;
    }
  | {
      error: string;
      ok: false;
    };

type CoinBinanceActionApiResponse =
  | {
      ok: true;
    }
  | {
      error: string;
      ok: false;
    };

type CoinBinanceOpenOrdersApiResponse =
  | {
      ok: true;
      openOrders: Array<{
        clientOrderId: string | null;
        algoId: number | null;
        orderEntryPriceLabel: string;
        orderEstimatedMarginLabel: string;
        orderLeverageLabel: string;
        orderModeLabel: string;
        orderId: number | null;
        orderPriceLabel: string;
        orderNotionalLabel: string;
        orderPositionSideLabel: string;
        orderPurposeLabel: 'Entry' | 'Take profit' | 'Stop loss' | 'Other';
        orderQuantityLabel: string;
        orderReduceOnlyLabel: string;
        orderSideLabel: string;
        orderStatusLabel: string;
        orderTimeInForceLabel: string;
        orderTriggerPriceLabel: string;
        orderTypeLabel: string;
        symbol: string;
      }>;
    }
  | {
      error: string;
      ok: false;
    };

function getStatusLabel(status: CoinAutoBotStatus) {
  switch (status) {
    case 'entry_pending':
      return 'Watching for entry';
    case 'entry_placed':
      return 'Entry placed';
    case 'stopped':
      return 'Stopped';
    case 'watching':
      return 'Watching';
    case 'error':
      return 'Error';
    default:
      return 'Idle';
  }
}

function getStatusColor(status: CoinAutoBotStatus) {
  switch (status) {
    case 'entry_pending':
      return 'yellow';
    case 'entry_placed':
      return 'teal';
    case 'stopped':
      return 'gray';
    case 'watching':
      return 'cyan';
    case 'error':
      return 'red';
    default:
      return 'gray';
  }
}

function getExecutionEndpointLabel() {
  const baseUrl = BASE_API_BINANCE ?? 'https://demo-fapi.binance.com/fapi/v1';

  if (baseUrl.includes('demo')) {
    return 'Binance demo API';
  }

  if (baseUrl.includes('fapi.binance.com')) {
    return 'Binance live API';
  }

  return 'Configured Binance API';
}

export function useCoinAutoBotLogic({
  activeSetup,
  currentPrice,
  executionBasisLabel,
  executionConsensusLabel,
  formatPriceLevel,
  formatPriceZone,
  timeframeSummaries,
  symbol,
}: CoinAutoBotLogicProps): CoinAutoBotSectionViewModel {
  const queryClient = useQueryClient();
  const [allocationUnit, setAllocationUnit] = useState<CoinAutoBotAllocationUnit>('percent');
  const [allocationValue, setAllocationValue] = useState(12);
  const [leverage, setLeverage] = useState(10);

  const { data: botResponse } = useQuery({
    queryKey: ['coin-auto-bot', symbol],
    queryFn: async () => {
      const response = await fetch(`/api/binance/auto-bot?symbol=${encodeURIComponent(symbol)}`);
      const payload = (await response.json()) as CoinAutoBotApiResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.ok ? 'Unable to read bot state' : payload.error);
      }

      return payload;
    },
    enabled: symbol.length > 0,
    staleTime: 10 * 1000,
    refetchInterval: (query) =>
      query.state.data?.bot?.status === 'watching' ||
      query.state.data?.bot?.status === 'entry_pending' ||
      query.state.data?.bot?.status === 'entry_placed'
        ? 15_000
        : false,
    refetchOnWindowFocus: false,
  });

  const { data: positionsResponse } = useQuery({
    queryKey: ['binance-open-positions', symbol],
    queryFn: async () => {
      const response = await fetch(`/api/binance/positions?symbol=${encodeURIComponent(symbol)}`);
      const payload = (await response.json()) as CoinBinancePositionsApiResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.ok ? 'Unable to read Binance positions' : payload.error);
      }

      return payload;
    },
    enabled: symbol.length > 0,
    staleTime: 10 * 1000,
    refetchInterval: (query) =>
      query.state.data?.positions?.length
        ? 15_000
        : query.state.data?.positions === undefined
          ? false
          : 15_000,
    refetchOnWindowFocus: false,
  });

  const { data: openOrdersResponse } = useQuery({
    queryKey: ['binance-open-orders', symbol],
    queryFn: async () => {
      const response = await fetch(`/api/binance/open-orders?symbol=${encodeURIComponent(symbol)}`);
      const payload = (await response.json()) as CoinBinanceOpenOrdersApiResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.ok ? 'Unable to read Binance open orders' : payload.error);
      }

      return payload;
    },
    enabled: symbol.length > 0,
    staleTime: 10 * 1000,
    refetchInterval: () => 15_000,
    refetchOnWindowFocus: false,
  });

  const startMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/binance/auto-bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          allocationUnit,
          allocationValue,
          currentPrice,
          direction: activeSetup.direction,
          entryHigh: activeSetup.entryZone.high,
          entryLow: activeSetup.entryZone.low,
          entryMid: activeSetup.entryMid,
          notes: activeSetup.reasons,
          leverage,
          riskReward: activeSetup.riskReward,
          setupGrade: activeSetup.grade,
          setupGradeRank: activeSetup.gradeRank,
          setupLabel: activeSetup.label,
          stopLoss: activeSetup.stopLoss,
          symbol,
          takeProfits: activeSetup.takeProfits,
        }),
      });

      const payload = (await response.json()) as CoinAutoBotApiResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.ok ? 'Unable to start auto bot' : payload.error);
      }

      return payload;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['coin-auto-bot', symbol] });
    },
  });

  const stopMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/binance/auto-bot?symbol=${encodeURIComponent(symbol)}`, {
        method: 'DELETE',
      });
      const payload = (await response.json()) as CoinAutoBotApiResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.ok ? 'Unable to stop auto bot' : payload.error);
      }

      return payload;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['coin-auto-bot', symbol] });
    },
  });

  const closePositionMutation = useMutation({
    mutationFn: async (positionSide: 'BOTH' | 'LONG' | 'SHORT') => {
      const response = await fetch('/api/binance/positions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          positionSide,
          symbol,
        }),
      });
      const payload = (await response.json()) as CoinBinanceActionApiResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.ok ? 'Unable to close position' : payload.error);
      }

      return payload;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['binance-open-positions', symbol] });
      await queryClient.invalidateQueries({ queryKey: ['binance-open-orders', symbol] });
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (order: CoinAutoBotOpenOrder) => {
      const response = await fetch('/api/binance/open-orders', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          algoId: order.algoId,
          clientOrderId: order.clientOrderId,
          mode: order.orderModeLabel,
          orderId: order.orderId,
          symbol,
        }),
      });
      const payload = (await response.json()) as CoinBinanceActionApiResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.ok ? 'Unable to cancel order' : payload.error);
      }

      return payload;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['binance-open-orders', symbol] });
      await queryClient.invalidateQueries({ queryKey: ['binance-open-positions', symbol] });
    },
  });

  const takeProfitLabels = useMemo(
    () =>
      activeSetup.takeProfits.map((item) => ({
        label: item.label,
        valueLabel: formatPriceLevel(item.price),
      })),
    [activeSetup.takeProfits, formatPriceLevel]
  );

  const status = botResponse?.bot?.status ?? 'idle';
  const isActive = status !== 'idle' && status !== 'stopped';
  const logs = botResponse?.logs ?? [];
  const openPositions: CoinAutoBotOpenPosition[] = (positionsResponse?.positions ?? [])
    .filter((position) => position.positionAmt !== 0)
    .map((position) => ({
      entryPriceLabel: formatPriceLevel(position.entryPrice),
      isolatedMarginLabel:
        position.isolatedMargin !== null ? `${formatDecimalString(position.isolatedMargin.toFixed(2))} USDT` : 'n/a',
      leverageLabel: position.leverage !== null ? `${position.leverage}x` : 'n/a',
      liquidationPriceLabel: formatPriceLevel(position.liquidationPrice),
      marginTypeLabel: position.marginType,
      markPriceLabel: formatPriceLevel(position.markPrice),
      notionalLabel: position.notional !== null ? `${formatDecimalString(position.notional.toFixed(2))} USDT` : 'n/a',
      positionAmtLabel: `${position.positionAmt > 0 ? '+' : ''}${formatDecimalString(position.positionAmt.toFixed(4))}`,
      positionSideLabel: position.positionSide,
      unrealizedPnlLabel:
        position.unrealizedPnl !== null ? `${formatDecimalString(position.unrealizedPnl.toFixed(2))} USDT` : 'n/a',
    }));
  const openOrders: CoinAutoBotOpenOrder[] = (openOrdersResponse?.openOrders ?? []).map((order) => ({
    clientOrderId: order.clientOrderId,
    algoId: order.algoId,
    orderEntryPriceLabel: order.orderEntryPriceLabel,
    orderEstimatedMarginLabel: order.orderEstimatedMarginLabel,
    orderLeverageLabel: order.orderLeverageLabel,
    orderModeLabel: order.orderModeLabel,
    orderId: order.orderId,
    orderPriceLabel: order.orderPriceLabel,
    orderNotionalLabel: order.orderNotionalLabel,
    orderPositionSideLabel: order.orderPositionSideLabel,
    orderPurposeLabel: order.orderPurposeLabel,
    orderQuantityLabel: order.orderQuantityLabel,
    orderReduceOnlyLabel: order.orderReduceOnlyLabel,
    orderSideLabel: order.orderSideLabel,
    orderStatusLabel: order.orderStatusLabel,
    orderTimeInForceLabel: order.orderTimeInForceLabel,
    orderTriggerPriceLabel: order.orderTriggerPriceLabel,
    orderTypeLabel: order.orderTypeLabel,
  }));

  return {
    allocationLabel: allocationUnit === 'percent' ? `${allocationValue}% of wallet` : `${allocationValue} USDT margin`,
    allocationUnit,
    allocationValue,
    botStatus: status,
    botStatusColor: getStatusColor(status),
    botStatusLabel: getStatusLabel(status),
    currentPriceLabel: formatPriceLevel(currentPrice),
    direction: activeSetup.direction,
    entryZoneLabel: formatPriceZone(activeSetup.entryZone),
    executionBasisLabel,
    executionConsensusLabel,
    executionEndpointLabel: getExecutionEndpointLabel(),
    leverage,
    isActive,
    isStarting: startMutation.isPending,
    isStopping: stopMutation.isPending,
    marketConditionLabel: activeSetup.marketCondition,
    notes: activeSetup.reasons,
    logs,
    openPositions,
    openOrders,
    timeframeSummaries,
    onAllocationUnitChange: setAllocationUnit,
    onAllocationValueChange: setAllocationValue,
    onLeverageChange: setLeverage,
    onClosePosition: (positionSide) => {
      void closePositionMutation.mutateAsync(positionSide);
    },
    onCancelOrder: (order) => {
      void cancelOrderMutation.mutateAsync(order);
    },
    onStart: () => {
      if (isActive || startMutation.isPending) {
        return;
      }

      void startMutation.mutateAsync();
    },
    onStop: () => {
      void stopMutation.mutateAsync();
    },
    previewLabel: executionConsensusLabel,
    riskRewardLabel: activeSetup.riskReward !== null ? `1:${activeSetup.riskReward.toFixed(2)}` : 'n/a',
    setupGrade: activeSetup.grade,
    setupLabel: activeSetup.label,
    stopLossLabel: formatPriceLevel(activeSetup.stopLoss),
    symbol,
    takeProfitLabels,
  };
}
