import type { NextApiRequest, NextApiResponse } from 'next';
import { CookiesStorageService } from '../../../common/services/cookiesStorage.service';
import { formatDecimalString } from '@utils/format-number.util';
import { futuresAutoBotService } from '@core/binance/futures/bot/infrastructure/futuresAutoBot.service';
import { futuresAutoTradeService } from '@core/binance/futures/bot/infrastructure/futuresAutoTrade.service';
import type { FuturesAutoBotState } from '@core/binance/futures/bot/domain/futuresAutoBot.model';

type BinanceOpenOrderApiResponse =
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
        orderPnLLabel: string;
        orderPnLPercentLabel: string;
        orderPriceValue: number | null;
        orderPriceMovePercentLabel: string;
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

type BinanceCancelOrderApiResponse =
  | {
      ok: true;
    }
  | {
      error: string;
      ok: false;
    };

function parseNumber(value?: string | null) {
  if (value === undefined || value === null || value.trim().length === 0) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const cookiesStorage = new CookiesStorageService();

function getBotStateCookieName(symbol: string) {
  return `btcmarketscanner_auto_bot_state_${symbol}`;
}

function readBotStateCookie(req: NextApiRequest, symbol: string) {
  const raw = cookiesStorage.getServer(req, getBotStateCookieName(symbol));

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as FuturesAutoBotState;
  } catch {
    return null;
  }
}

function formatPrice(value: number | null) {
  if (value === null) {
    return 'n/a';
  }

  const absoluteValue = Math.abs(value);
  const decimals =
    absoluteValue >= 1000 ? 2 :
    absoluteValue >= 100 ? 3 :
    absoluteValue >= 1 ? 4 :
    absoluteValue >= 0.1 ? 5 :
    absoluteValue >= 0.01 ? 7 :
    absoluteValue >= 0.001 ? 8 :
    10;

  return `${formatDecimalString(value.toFixed(decimals))} USDT`;
}

function formatQuantity(value: number | null) {
  return value === null ? 'n/a' : formatDecimalString(value.toFixed(4));
}

function formatMargin(value: number | null) {
  return value === null ? 'n/a' : `${formatDecimalString(value.toFixed(2))} USDT`;
}

function formatPnl(value: number | null) {
  if (value === null) {
    return 'n/a';
  }

  const sign = value >= 0 ? '+' : '';
  return `${sign}${formatDecimalString(value.toFixed(2))} USDT`;
}

function formatPercent(value: number | null) {
  if (value === null) {
    return 'n/a';
  }

  const sign = value >= 0 ? '+' : '';
  return `${sign}${formatDecimalString(value.toFixed(2))}%`;
}

function formatDirectionalMovePercent(
  entryPrice: number | null,
  targetPrice: number | null,
  positionDirection: 'LONG' | 'SHORT' | null,
  purpose: 'Entry' | 'Take profit' | 'Stop loss' | 'Other'
) {
  if (entryPrice === null || targetPrice === null || positionDirection === null || purpose === 'Entry' || purpose === 'Other') {
    return 'n/a';
  }

  const priceMove = (targetPrice - entryPrice) * (positionDirection === 'LONG' ? 1 : -1);
  const percentMove = (priceMove / entryPrice) * 100;
  return formatPercent(percentMove);
}

function getOrderPurposeLabel(type?: string | null) {
  if (!type) {
    return 'Other' as const;
  }

  if (type === 'LIMIT' || type === 'MARKET') {
    return 'Entry' as const;
  }

  if (type.includes('TAKE_PROFIT')) {
    return 'Take profit' as const;
  }

  if (type.includes('STOP')) {
    return 'Stop loss' as const;
  }

  return 'Other' as const;
}

function getOrderPriceFromPayload(type?: string | null, price?: number | null, stopPrice?: number | null, triggerPrice?: number | null) {
  if (type?.includes('STOP')) {
    return stopPrice ?? triggerPrice ?? price ?? null;
  }

  if (type?.includes('TAKE_PROFIT')) {
    return triggerPrice ?? price ?? null;
  }

  return price ?? triggerPrice ?? stopPrice ?? null;
}

function getPositionDirection(positionSide?: string | null, positionAmt?: number | null) {
  if (positionSide === 'LONG' || positionSide === 'SHORT') {
    return positionSide;
  }

  if (positionAmt !== null && positionAmt !== undefined) {
    return positionAmt >= 0 ? 'LONG' : 'SHORT';
  }

  return null;
}

function inferOrderPurpose(params: {
  explicitPurpose: 'Entry' | 'Take profit' | 'Stop loss' | 'Other';
  activePositionDirection: 'LONG' | 'SHORT' | null;
  activePositionEntryPrice: number | null;
  orderSide?: string | null;
  triggerPrice: number | null;
  type?: string | null;
}): 'Entry' | 'Take profit' | 'Stop loss' | 'Other' {
  const { activePositionDirection, activePositionEntryPrice, explicitPurpose, orderSide, triggerPrice, type } = params;

  if (explicitPurpose !== 'Other') {
    return explicitPurpose;
  }

  if (activePositionEntryPrice !== null && activePositionDirection !== null && triggerPrice !== null && orderSide) {
    const priceMove = (triggerPrice - activePositionEntryPrice) * (activePositionDirection === 'LONG' ? 1 : -1);
    return priceMove >= 0 ? 'Take profit' : 'Stop loss';
  }

  if (type === 'LIMIT' || type === 'MARKET') {
    return 'Entry';
  }

  return 'Other';
}

function getTargetPnlMetrics(params: {
  entryPrice: number | null;
  leverage: number | null;
  orderPrice: number | null;
  orderPurpose: 'Entry' | 'Take profit' | 'Stop loss' | 'Other';
  orderQuantity: number | null;
  positionDirection: 'LONG' | 'SHORT' | null;
  positionMargin: number | null;
}) {
  const { entryPrice, leverage, orderPrice, orderPurpose, orderQuantity, positionDirection, positionMargin } = params;

  if (
    entryPrice === null ||
    orderPrice === null ||
    orderQuantity === null ||
    positionDirection === null ||
    orderPurpose === 'Entry' ||
    orderPurpose === 'Other'
  ) {
    return {
      pnlLabel: 'n/a',
      pnlPercentLabel: 'n/a',
    };
  }

  const directionMultiplier = positionDirection === 'LONG' ? 1 : -1;
  const priceMove = (orderPrice - entryPrice) * directionMultiplier;
  const pnlValue = priceMove * orderQuantity;
  const margin = positionMargin ?? (leverage !== null && leverage > 0 ? (entryPrice * orderQuantity) / leverage : null);
  const pnlPercent =
    margin !== null && margin !== 0 ? (pnlValue / margin) * 100 : leverage !== null && leverage > 0 ? (priceMove / entryPrice) * leverage * 100 : null;

  return {
    pnlLabel: formatPnl(pnlValue),
    pnlPercentLabel: formatPercent(pnlPercent),
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BinanceOpenOrderApiResponse | BinanceCancelOrderApiResponse>
) {
  const symbol = typeof req.query.symbol === 'string' ? req.query.symbol.trim().toUpperCase() : '';

  if (req.method !== 'GET' && req.method !== 'DELETE') {
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  if (req.method === 'GET' && !symbol) {
    return res.status(400).json({ ok: false, error: 'Symbol is required.' });
  }

  try {
    const cookieState = readBotStateCookie(req, symbol);
    if (cookieState && !futuresAutoBotService.get(symbol)) {
      futuresAutoBotService.hydrate(symbol, cookieState);
    }

    if (req.method === 'DELETE') {
      const body = req.body as { algoId?: number; clientOrderId?: string | null; mode?: 'Regular' | 'Algo'; orderId?: number; symbol?: string };
      const targetMode = body.mode === 'Algo' ? 'Algo' : 'Regular';
      const targetSymbol = typeof body.symbol === 'string' && body.symbol.trim().length > 0 ? body.symbol.trim().toUpperCase() : symbol;

      if (!targetSymbol) {
        return res.status(400).json({ ok: false, error: 'Symbol is required.' });
      }

      await futuresAutoTradeService.cancelOpenOrder(targetSymbol, {
        algoId: typeof body.algoId === 'number' && Number.isFinite(body.algoId) ? body.algoId : undefined,
        clientOrderId: typeof body.clientOrderId === 'string' && body.clientOrderId.trim().length > 0 ? body.clientOrderId.trim() : null,
        mode: targetMode,
        orderId: typeof body.orderId === 'number' && Number.isFinite(body.orderId) ? body.orderId : undefined,
      });

      return res.status(200).json({ ok: true } as BinanceCancelOrderApiResponse);
    }

    const [[regularOrders, algoOrders], openPositions] = await Promise.all([
      futuresAutoTradeService.getOpenOrders(symbol),
      futuresAutoTradeService.getOpenPositions(symbol),
    ]);
    const leverageFromBot = (await futuresAutoBotService.getResolved(symbol))?.plan.leverage ?? null;
    const symbolPosition = openPositions.find((position) => position.symbol === symbol) ?? null;
    const activePosition =
      openPositions.find((position) => position.symbol === symbol && parseNumber(position.positionAmt) !== 0) ?? null;
    const leverageFromPosition = symbolPosition?.leverage;
    const leverageFromPositionValue =
      typeof leverageFromPosition === 'string' ? parseNumber(leverageFromPosition) : leverageFromPosition ?? null;
    const leverage = leverageFromPositionValue ?? leverageFromBot;
    const leverageLabel = leverage !== null ? `${leverage}x` : 'n/a';
    const activePositionAmt = parseNumber(activePosition?.positionAmt ?? null);
    const activePositionDirection = getPositionDirection(activePosition?.positionSide, activePositionAmt);
    const activePositionEntryPrice = parseNumber(activePosition?.entryPrice ?? null);
    const activePositionMargin = parseNumber(activePosition?.isolatedMargin ?? null);

    const openOrders = [
      ...regularOrders.map((order) => ({
        clientOrderId: order.clientOrderId ?? null,
        algoId: null,
        orderEntryPriceLabel: formatPrice(getOrderPriceFromPayload(order.type, parseNumber(order.price), parseNumber(order.stopPrice), null)),
        orderEstimatedMarginLabel:
          leverage !== null &&
          getOrderPriceFromPayload(order.type, parseNumber(order.price), parseNumber(order.stopPrice), null) !== null &&
          parseNumber(order.origQty ?? null) !== null
            ? formatMargin(
                (getOrderPriceFromPayload(order.type, parseNumber(order.price), parseNumber(order.stopPrice), null)! *
                  parseNumber(order.origQty ?? null)!) /
                  Math.max(leverage, 1)
              )
            : 'n/a',
        orderLeverageLabel: leverageLabel,
        orderModeLabel: 'Regular',
        orderId: order.orderId ?? null,
        orderPnLLabel: 'n/a',
        orderPnLPercentLabel: 'n/a',
        orderPriceValue: getOrderPriceFromPayload(order.type, parseNumber(order.price), parseNumber(order.stopPrice), null),
        orderPriceMovePercentLabel: formatDirectionalMovePercent(
          activePositionEntryPrice,
          getOrderPriceFromPayload(order.type, parseNumber(order.price), parseNumber(order.stopPrice), null),
          activePositionDirection,
          getOrderPurposeLabel(order.type)
        ),
        orderPriceLabel: formatPrice(getOrderPriceFromPayload(order.type, parseNumber(order.price), parseNumber(order.stopPrice), null)),
        orderNotionalLabel: formatPrice(
          getOrderPriceFromPayload(order.type, parseNumber(order.price), parseNumber(order.stopPrice), null) !== null &&
            parseNumber(order.origQty ?? null) !== null
            ? getOrderPriceFromPayload(order.type, parseNumber(order.price), parseNumber(order.stopPrice), null)! *
              parseNumber(order.origQty ?? null)!
            : null
        ),
        orderPositionSideLabel: order.positionSide ?? 'BOTH',
        orderPurposeLabel: getOrderPurposeLabel(order.type),
        orderQuantityLabel: formatQuantity(parseNumber(order.origQty ?? null)),
        orderReduceOnlyLabel: order.reduceOnly ? 'Yes' : 'No',
        orderSideLabel: order.side ?? 'n/a',
        orderStatusLabel: order.status ?? 'NEW',
        orderTimeInForceLabel: order.timeInForce ?? 'n/a',
        orderTriggerPriceLabel:
          order.type && order.type.includes('STOP') ? formatPrice(parseNumber(order.stopPrice)) : 'n/a',
        orderTypeLabel: order.type ?? 'n/a',
        symbol: order.symbol ?? symbol,
      })),
      ...algoOrders.map((order) => {
        const triggerPrice = parseNumber(order.triggerPrice ?? null);
        const quantity = parseNumber(order.quantity ?? null);
        const explicitPurpose = getOrderPurposeLabel(order.type);
        const inferredPurpose = inferOrderPurpose({
          activePositionDirection,
          activePositionEntryPrice,
          explicitPurpose,
          orderSide: order.side ?? null,
          triggerPrice,
          type: order.type ?? null,
        });
        const orderPrice = triggerPrice ?? parseNumber(order.price ?? null);
        const pnlMetrics = getTargetPnlMetrics({
          entryPrice: activePositionEntryPrice,
          leverage,
          orderPrice,
          orderPurpose: inferredPurpose,
          orderQuantity: quantity ?? (activePositionAmt !== null ? Math.abs(activePositionAmt) : null),
          positionDirection: activePositionDirection,
          positionMargin: activePositionMargin,
        });

        return {
          clientOrderId: order.clientAlgoId ?? null,
          algoId: order.algoId ?? null,
          orderEntryPriceLabel: formatPrice(orderPrice),
          orderEstimatedMarginLabel:
            leverage !== null && orderPrice !== null && quantity !== null
              ? formatMargin((orderPrice * quantity) / Math.max(leverage, 1))
              : 'n/a',
          orderLeverageLabel: leverageLabel,
          orderModeLabel: 'Algo',
          orderId: null,
          orderPnLLabel: pnlMetrics.pnlLabel,
          orderPnLPercentLabel: pnlMetrics.pnlPercentLabel,
          orderPriceValue: orderPrice,
          orderPriceMovePercentLabel: formatDirectionalMovePercent(activePositionEntryPrice, orderPrice, activePositionDirection, inferredPurpose),
          orderPriceLabel: formatPrice(orderPrice),
          orderNotionalLabel: formatPrice(orderPrice !== null && quantity !== null ? orderPrice * quantity : null),
          orderPositionSideLabel:
            order.positionSide ??
            (activePositionDirection === 'LONG' ? 'LONG' : activePositionDirection === 'SHORT' ? 'SHORT' : 'BOTH'),
          orderPurposeLabel: inferredPurpose,
          orderQuantityLabel: formatQuantity(quantity ?? (activePositionAmt !== null ? Math.abs(activePositionAmt) : null)),
          orderReduceOnlyLabel: order.reduceOnly ? 'Yes' : 'No',
          orderSideLabel: order.side ?? 'n/a',
          orderStatusLabel: order.status ?? 'NEW',
          orderTimeInForceLabel: order.workingType ?? 'n/a',
          orderTriggerPriceLabel: formatPrice(triggerPrice),
          orderTypeLabel:
            order.type ??
            (inferredPurpose === 'Take profit'
              ? 'TAKE_PROFIT_MARKET'
              : inferredPurpose === 'Stop loss'
                ? 'STOP_MARKET'
                : 'LIMIT'),
          symbol: order.symbol ?? symbol,
        };
      }),
    ];

    return res.status(200).json({ ok: true, openOrders });
  } catch (error) {
    return res.status(200).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to load Binance open orders',
    });
  }
}
