import type { NextApiRequest, NextApiResponse } from 'next';
import { CookiesStorageService } from '../../../common/services/cookiesStorage.service';
import { futuresAutoBotService } from '@core/binance/futures/bot/infrastructure/futuresAutoBot.service';
import { futuresAutoTradeService } from '@core/binance/futures/bot/infrastructure/futuresAutoTrade.service';
import type { FuturesAutoBotState } from '@core/binance/futures/bot/domain/futuresAutoBot.model';

type BinanceTransactionHistoryApiResponse =
  | {
      ok: true;
      history: Array<{
        actualMargin: number | null;
        asset: string;
        info: string;
        income: number | null;
        roi: number | null;
        symbol: string;
        time: number | null;
        tranId: number | null;
      }>;
    }
  | {
      error: string;
      ok: false;
    };

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

function parseNumber(value?: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function parseNullableStringId(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<BinanceTransactionHistoryApiResponse>) {
  const symbol = typeof req.query.symbol === 'string' ? req.query.symbol.trim().toUpperCase() : '';

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  if (!symbol) {
    return res.status(400).json({ ok: false, error: 'Symbol is required.' });
  }

  try {
    const cookieState = readBotStateCookie(req, symbol);
    if (cookieState && !futuresAutoBotService.get(symbol)) {
      futuresAutoBotService.hydrate(symbol, cookieState);
    }

    const botState = await futuresAutoBotService.getResolved(symbol);
    const realizedPnlHistory = await futuresAutoTradeService.getRealizedPnlHistory(symbol, 20);
    const completedExecutions = botState?.executionHistory ?? [];
    const executionByReferencedOrderId = new Map<string, (typeof completedExecutions)[number]>();

    completedExecutions.forEach((execution) => {
      executionByReferencedOrderId.set(String(execution.entryOrderId), execution);

      if (execution.stopLossAlgoOrderId !== null) {
        executionByReferencedOrderId.set(String(execution.stopLossAlgoOrderId), execution);
      }

      execution.takeProfitAlgoOrderIds.forEach((orderId) => {
        executionByReferencedOrderId.set(String(orderId), execution);
      });
    });

    const fallbackExecutions = [...completedExecutions].reverse();
    let fallbackIndex = 0;

    return res.status(200).json({
      ok: true,
      history: realizedPnlHistory
        .map((item) => {
          const infoId = parseNullableStringId(item.info) ?? parseNullableStringId(item.tranId);
          const matchedExecution =
            infoId !== null && executionByReferencedOrderId.has(infoId)
              ? executionByReferencedOrderId.get(infoId) ?? null
              : fallbackExecutions[fallbackIndex] ?? null;

          if (!(infoId !== null && executionByReferencedOrderId.has(infoId)) && matchedExecution !== null) {
            fallbackIndex += 1;
          }

          const actualMargin = matchedExecution?.allocatedMargin ?? null;
          const roi = actualMargin !== null && actualMargin > 0 && item.income !== null ? (item.income / actualMargin) * 100 : null;

          return {
            actualMargin,
            asset: item.asset,
            info: item.info,
            income: parseNumber(item.income),
            roi,
            symbol: item.symbol,
            time: parseNumber(item.time),
            tranId: parseNumber(item.tranId),
          };
        })
        .sort((left, right) => (right.time ?? 0) - (left.time ?? 0)),
    });
  } catch (error) {
    return res.status(200).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to load Binance transaction history',
    });
  }
}
