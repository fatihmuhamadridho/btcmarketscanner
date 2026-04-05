import type { NextApiRequest, NextApiResponse } from 'next';
import { futuresAutoTradeService } from '@core/binance/futures/bot/infrastructure/futuresAutoTrade.service';

type BinanceTransactionHistoryApiResponse =
  | {
      ok: true;
      history: Array<{
        asset: string;
        info: string;
        income: number | null;
        symbol: string;
        time: number | null;
        tranId: number | null;
      }>;
    }
  | {
      error: string;
      ok: false;
    };

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

export default async function handler(req: NextApiRequest, res: NextApiResponse<BinanceTransactionHistoryApiResponse>) {
  const symbol = typeof req.query.symbol === 'string' ? req.query.symbol.trim().toUpperCase() : '';

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  if (!symbol) {
    return res.status(400).json({ ok: false, error: 'Symbol is required.' });
  }

  try {
    const history = await futuresAutoTradeService.getRealizedPnlHistory(symbol, 20);

    return res.status(200).json({
      ok: true,
      history: history
        .map((item) => ({
          asset: item.asset,
          info: item.info,
          income: parseNumber(item.income),
          symbol: item.symbol,
          time: parseNumber(item.time),
          tranId: parseNumber(item.tranId),
        }))
        .sort((left, right) => (right.time ?? 0) - (left.time ?? 0)),
    });
  } catch (error) {
    return res.status(200).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to load Binance transaction history',
    });
  }
}
