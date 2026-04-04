import type { NextApiRequest, NextApiResponse } from 'next';
import { futuresAutoBotService } from '@core/binance/futures/bot/infrastructure/futuresAutoBot.service';
import { futuresAutoTradeService } from '@core/binance/futures/bot/infrastructure/futuresAutoTrade.service';

type BinanceOpenOrderApiResponse =
  | {
      ok: true;
      openOrders: Array<{
        clientOrderId: string | null;
        algoId: number | null;
        orderEntryPriceLabel: string;
        orderEstimatedMarginLabel: string;
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

function formatPrice(value: number | null) {
  return value === null ? 'n/a' : `${value.toFixed(2)} USDT`;
}

function formatQuantity(value: number | null) {
  return value === null ? 'n/a' : value.toFixed(4);
}

function formatMargin(value: number | null) {
  return value === null ? 'n/a' : `${value.toFixed(2)} USDT`;
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

    const [regularOrders, algoOrders] = await futuresAutoTradeService.getOpenOrders(symbol);
    const leverage = futuresAutoBotService.get(symbol)?.plan.leverage ?? null;

    const openOrders = [
      ...regularOrders.map((order) => ({
        clientOrderId: order.clientOrderId ?? null,
        algoId: null,
        orderEntryPriceLabel: formatPrice(parseNumber(order.price)),
        orderEstimatedMarginLabel:
          leverage !== null && parseNumber(order.price) !== null && parseNumber(order.origQty ?? null) !== null
            ? formatMargin((parseNumber(order.price)! * parseNumber(order.origQty ?? null)!) / Math.max(leverage, 1))
            : leverage !== null
              ? 'n/a'
              : 'Unknown leverage',
        orderModeLabel: 'Regular',
        orderId: order.orderId ?? null,
        orderPriceLabel: formatPrice(parseNumber(order.price)),
        orderNotionalLabel: formatPrice(
          parseNumber(order.price) !== null && parseNumber(order.origQty ?? null) !== null
            ? parseNumber(order.price)! * parseNumber(order.origQty ?? null)!
            : null
        ),
        orderPositionSideLabel: order.positionSide ?? 'BOTH',
        orderPurposeLabel: getOrderPurposeLabel(order.type),
        orderQuantityLabel: formatQuantity(parseNumber(order.origQty ?? null)),
        orderReduceOnlyLabel: order.reduceOnly ? 'Yes' : 'No',
        orderSideLabel: order.side ?? 'n/a',
        orderStatusLabel: order.status ?? 'n/a',
        orderTimeInForceLabel: order.timeInForce ?? 'n/a',
        orderTriggerPriceLabel:
          order.type && order.type.includes('STOP') ? formatPrice(parseNumber(order.stopPrice)) : 'n/a',
        orderTypeLabel: order.type ?? 'n/a',
        symbol: order.symbol ?? symbol,
      })),
      ...algoOrders.map((order) => ({
        clientOrderId: order.clientAlgoId ?? null,
        algoId: order.algoId ?? null,
        orderEntryPriceLabel: formatPrice(parseNumber(order.price ?? null)),
        orderEstimatedMarginLabel:
          leverage !== null && parseNumber(order.triggerPrice ?? null) !== null && parseNumber(order.quantity ?? null) !== null
            ? formatMargin(
                (parseNumber(order.triggerPrice ?? null)! * parseNumber(order.quantity ?? null)!) / Math.max(leverage, 1)
              )
            : leverage !== null
              ? 'n/a'
              : 'Unknown leverage',
        orderModeLabel: 'Algo',
        orderId: null,
        orderPriceLabel: formatPrice(parseNumber(order.price ?? null)),
        orderNotionalLabel: formatPrice(
          parseNumber(order.triggerPrice ?? null) !== null && parseNumber(order.quantity ?? null) !== null
            ? parseNumber(order.triggerPrice ?? null)! * parseNumber(order.quantity ?? null)!
            : null
        ),
        orderPositionSideLabel: order.positionSide ?? 'BOTH',
        orderPurposeLabel: getOrderPurposeLabel(order.type),
        orderQuantityLabel: formatQuantity(parseNumber(order.quantity ?? null)),
        orderReduceOnlyLabel: order.reduceOnly ? 'Yes' : 'No',
        orderSideLabel: order.side ?? 'n/a',
        orderStatusLabel: order.status ?? 'n/a',
        orderTimeInForceLabel: order.workingType ?? 'n/a',
        orderTriggerPriceLabel: formatPrice(parseNumber(order.triggerPrice ?? null)),
        orderTypeLabel: order.type ?? 'n/a',
        symbol: order.symbol ?? symbol,
      })),
    ];

    return res.status(200).json({ ok: true, openOrders });
  } catch (error) {
    return res.status(200).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to load Binance open orders',
    });
  }
}
