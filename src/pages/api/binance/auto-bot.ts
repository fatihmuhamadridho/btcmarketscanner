import type { NextApiRequest, NextApiResponse } from 'next';
import { CookiesStorageService } from '../../../common/services/cookiesStorage.service';
import { futuresAutoBotService } from '@core/binance/futures/bot/infrastructure/futuresAutoBot.service';
import type {
  FuturesAutoBotLogEntry,
  FuturesAutoBotState,
  StartFuturesAutoBotInput,
} from '@core/binance/futures/bot/domain/futuresAutoBot.model';

type AutoBotResponse =
  | {
      bot: FuturesAutoBotState | null;
      logs: FuturesAutoBotLogEntry[];
      ok: true;
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

function syncBotStateCookie(res: NextApiResponse, symbol: string, state: FuturesAutoBotState | null) {
  const cookieName = getBotStateCookieName(symbol);

  if (state === null) {
    cookiesStorage.deleteServer(res, cookieName);
    return;
  }

  cookiesStorage.setServer(res, cookieName, JSON.stringify(state), {
    maxAge: 60 * 60 * 24,
  });
}

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function buildInput(body: Record<string, unknown>): StartFuturesAutoBotInput | null {
  type TakeProfitInput = StartFuturesAutoBotInput['takeProfits'][number];

  const symbol = typeof body.symbol === 'string' ? body.symbol.trim().toUpperCase() : '';
  const direction = body.direction === 'long' || body.direction === 'short' ? body.direction : null;
  const setupLabel = typeof body.setupLabel === 'string' ? body.setupLabel : '';
  const setupGrade = body.setupGrade === 'A+' || body.setupGrade === 'A' || body.setupGrade === 'B' || body.setupGrade === 'C'
    ? body.setupGrade
    : null;
  const setupGradeRank = parseNumber(body.setupGradeRank);
  const allocationUnit = body.allocationUnit === 'percent' || body.allocationUnit === 'usdt' ? body.allocationUnit : null;
  const allocationValue = parseNumber(body.allocationValue);
  const leverage = parseNumber(body.leverage);
  const currentPrice = parseNumber(body.currentPrice);
  const entryMid = parseNumber(body.entryMid);
  const entryLow = parseNumber(body.entryLow);
  const entryHigh = parseNumber(body.entryHigh);
  const stopLoss = parseNumber(body.stopLoss);
  const riskReward = parseNumber(body.riskReward);

  if (
    !symbol ||
    !direction ||
    !setupLabel ||
    !setupGrade ||
    setupGradeRank === null ||
    allocationUnit === null ||
    allocationValue === null ||
    leverage === null ||
    entryLow === null ||
    entryHigh === null
  ) {
    return null;
  }

  const takeProfits: TakeProfitInput[] = Array.isArray(body.takeProfits)
    ? body.takeProfits.flatMap((item) => {
        if (!item || typeof item !== 'object') {
          return [];
        }

        const label = (item as { label?: unknown }).label;
        const price = parseNumber((item as { price?: unknown }).price);

        if ((label !== 'TP1' && label !== 'TP2' && label !== 'TP3') || price === null) {
          return [];
        }

        return [{ label, price }];
      })
    : [];

  return {
    allocationUnit,
    allocationValue,
    currentPrice,
    direction,
    entryMid,
    entryZone: {
      high: entryHigh,
      low: entryLow,
    },
    leverage,
    notes: Array.isArray(body.notes) ? body.notes.filter((item): item is string => typeof item === 'string') : [],
    riskReward,
    setupGrade,
    setupGradeRank,
    setupLabel,
    stopLoss,
    symbol,
    takeProfits,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<AutoBotResponse>) {
  const symbol = typeof req.query.symbol === 'string' ? req.query.symbol.trim().toUpperCase() : '';

  if (!symbol && req.method !== 'POST') {
    return res.status(400).json({ ok: false, error: 'Symbol is required.' });
  }

  if (req.method === 'GET') {
    const cookieState = readBotStateCookie(req, symbol);
    if (cookieState && !futuresAutoBotService.get(symbol)) {
      futuresAutoBotService.hydrate(symbol, cookieState);
    }

    await futuresAutoBotService.recordProgress(symbol);
    const bot = await futuresAutoBotService.getResolved(symbol);
    syncBotStateCookie(res, symbol, bot);
    return res.status(200).json({
      ok: true,
      bot,
      logs: await futuresAutoBotService.getLogs(symbol),
    });
  }

  if (req.method === 'POST') {
    const input = buildInput(req.body as Record<string, unknown>);

    if (!input) {
      return res.status(400).json({ ok: false, error: 'Invalid bot configuration.' });
    }

    const bot = await futuresAutoBotService.start(input);
    syncBotStateCookie(res, symbol, bot);

    return res.status(200).json({ ok: true, bot, logs: await futuresAutoBotService.getLogs(symbol) });
  }

  if (req.method === 'DELETE') {
    const cookieState = readBotStateCookie(req, symbol);
    if (cookieState && !futuresAutoBotService.get(symbol)) {
      futuresAutoBotService.hydrate(symbol, cookieState);
    }

    const stopped = await futuresAutoBotService.stop(symbol);
    syncBotStateCookie(res, symbol, stopped);
    return res.status(200).json({
      ok: true,
      bot: stopped,
      logs: await futuresAutoBotService.getLogs(symbol),
    });
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed.' });
}
