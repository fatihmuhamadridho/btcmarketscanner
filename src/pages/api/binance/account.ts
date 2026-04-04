import { createHmac } from 'crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import { BASE_API_BINANCE, BINANCE_API_KEY, BINANCE_SECRET_KEY } from '@configs/base.config';
import { formatDecimalString } from '@utils/format-number.util';

type BinanceAccountApiResponse = {
  avatarLabel: string;
  displayName: string;
  isConfigured: boolean;
  subtitle: string;
};

type BinanceFuturesAccountResponse = {
  accountAlias?: string;
  totalWalletBalance?: string;
  totalMarginBalance?: string;
  availableBalance?: string;
};

function getInitials(value: string) {
  const tokens = value
    .split(/[\s._-]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (tokens.length === 0) {
    return 'BF';
  }

  if (tokens.length === 1) {
    return tokens[0].slice(0, 2).toUpperCase();
  }

  return `${tokens[0][0] ?? ''}${tokens[1][0] ?? ''}`.toUpperCase();
}

async function fetchBinanceFuturesAccount() {
  const baseUrl = BASE_API_BINANCE ?? 'https://fapi.binance.com/fapi/v1';
  const url = new URL('/fapi/v2/account', baseUrl);
  const params = new URLSearchParams({
    recvWindow: '5000',
    timestamp: String(Date.now()),
  });

  const signature = createHmac('sha256', BINANCE_SECRET_KEY ?? '').update(params.toString()).digest('hex');
  params.set('signature', signature);
  url.search = params.toString();

  const response = await fetch(url.toString(), {
    headers: {
      'X-MBX-APIKEY': BINANCE_API_KEY ?? '',
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Binance account request failed with status ${response.status}`);
  }

  return (await response.json()) as BinanceFuturesAccountResponse;
}

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<BinanceAccountApiResponse>
) {
  if (!BINANCE_API_KEY || !BINANCE_SECRET_KEY) {
    return res.status(200).json({
      avatarLabel: '?',
      displayName: 'Setup required',
      isConfigured: false,
      subtitle: 'Add BINANCE_API_KEY and BINANCE_SECRET_KEY',
    });
  }

  try {
    const account = await fetchBinanceFuturesAccount();
    const displayName = account.accountAlias?.trim() || 'Binance Futures';
    const walletBalance = account.totalWalletBalance
      ? `${formatDecimalString(account.totalWalletBalance)} USDT`
      : null;

    return res.status(200).json({
      avatarLabel: getInitials(displayName),
      displayName,
      isConfigured: true,
      subtitle: walletBalance ? `Wallet ${walletBalance}` : 'Futures account',
    });
  } catch (error) {
    return res.status(200).json({
      avatarLabel: 'BF',
      displayName: 'Binance Futures',
      isConfigured: false,
      subtitle: error instanceof Error ? 'Unable to load Binance account' : 'Binance account unavailable',
    });
  }
}
