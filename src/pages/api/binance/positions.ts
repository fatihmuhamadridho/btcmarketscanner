import type { NextApiRequest, NextApiResponse } from 'next';
import { futuresAutoTradeService } from '@core/binance/futures/bot/infrastructure/futuresAutoTrade.service';

type BinancePositionApiResponse =
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

type BinanceClosePositionApiResponse =
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BinancePositionApiResponse | BinanceClosePositionApiResponse>
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
      const body = req.body as { positionSide?: 'BOTH' | 'LONG' | 'SHORT'; symbol?: string };
      const targetSymbol = typeof body.symbol === 'string' && body.symbol.trim().length > 0 ? body.symbol.trim().toUpperCase() : symbol;
      const targetPositionSide = body.positionSide === 'BOTH' || body.positionSide === 'LONG' || body.positionSide === 'SHORT' ? body.positionSide : undefined;

      if (!targetSymbol) {
        return res.status(400).json({ ok: false, error: 'Symbol is required.' });
      }

      await futuresAutoTradeService.closePosition(targetSymbol, targetPositionSide);
      return res.status(200).json({ ok: true } as BinanceClosePositionApiResponse);
    }

    const positions = await futuresAutoTradeService.getOpenPositions(symbol);
    const filteredPositions = positions
      .filter((position) => position.symbol === symbol && parseNumber(position.positionAmt) !== 0)
      .map((position) => {
        const positionAmt = parseNumber(position.positionAmt) ?? 0;
        const positionSide: 'BOTH' | 'LONG' | 'SHORT' =
          position.positionSide === 'LONG' || position.positionSide === 'SHORT'
            ? position.positionSide
            : positionAmt > 0
              ? 'LONG'
              : positionAmt < 0
                ? 'SHORT'
                : 'BOTH';

        return {
        entryPrice: parseNumber(position.entryPrice),
        isolatedMargin: parseNumber(position.isolatedMargin),
        leverage: parseNumber(position.leverage),
        liquidationPrice: parseNumber(position.liquidationPrice),
        marginType: position.marginType ?? 'n/a',
        markPrice: parseNumber(position.markPrice),
        notional: parseNumber(position.notional),
        positionAmt,
        positionSide,
        symbol: position.symbol ?? symbol,
        unrealizedPnl: parseNumber(position.unRealizedProfit),
        };
      });

    return res.status(200).json({ ok: true, positions: filteredPositions });
  } catch (error) {
    return res.status(200).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to load Binance positions',
    });
  }
}
