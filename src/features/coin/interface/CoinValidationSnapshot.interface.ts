export type CoinValidationSession = 'asia' | 'europe' | 'us' | 'overlap';
export type CoinValidationVolatilityState = 'low' | 'normal' | 'high' | 'extreme';

export type CoinValidationRules = {
  min_rr: number;
  max_distance_to_resistance_atr_multiple: number;
  min_sl_atr_multiple: number;
  min_tp1_atr_multiple: number;
  require_htf_trend_alignment: boolean;
};

export type CoinValidationDataQuality = {
  candle_consistency: boolean;
  has_null_values: boolean;
  indicator_validity: boolean;
  is_complete: boolean;
};

export type CoinValidationSnapshotTimeframeRole = 'setup_main' | 'bias_primary' | 'macro_soft' | 'trigger';

export type CoinValidationSnapshotCandle = {
  close: number;
  close_time: string;
  high: number;
  low: number;
  open: number;
  open_time: string;
  quote_asset_volume: number | null;
  volume: number;
};

export type CoinValidationSnapshotTimeframe = {
  atr14: number | null;
  candles: CoinValidationSnapshotCandle[];
  current_price: number | null;
  distance_to_resistance: number | null;
  distance_to_support: number | null;
  ema100: number | null;
  ema20: number | null;
  ema200: number | null;
  ema50: number | null;
  ema_alignment: 'bullish' | 'bearish' | 'neutral';
  resistance: number | null;
  rsi14: number | null;
  structure_state: 'HH_HL' | 'LH_LL' | 'Mixed';
  support: number | null;
  trend_state: 'bullish' | 'bearish' | 'sideways';
};

export type CoinValidationSnapshotSetupCandidate = {
  direction: 'long' | 'short';
  distance_to_resistance: number | null;
  distance_to_support: number | null;
  entry_zone: [number | null, number | null];
  planned_entry: number | null;
  risk_reward: {
    tp1: number | null;
    tp2: number | null;
  };
  setup_type: 'breakout_retest' | 'breakdown_retest' | 'continuation';
  sl_distance: number | null;
  stop_loss: number | null;
  take_profit: {
    tp1: number | null;
    tp2: number | null;
  };
  tp_distance: {
    tp1: number | null;
    tp2: number | null;
  };
};

export type CoinValidationSnapshot = {
  current_context: {
    price: number | null;
    session: CoinValidationSession;
    trend: 'bullish' | 'bearish' | 'sideways';
    volatility_state: CoinValidationVolatilityState;
  };
  data_quality: CoinValidationDataQuality;
  exchange: 'binance';
  generated_at: string;
  is_perpetual: boolean;
  market_type: 'futures';
  risk_config: {
    account_size: number | null;
    leverage: number;
    risk_percent: number;
  };
  setup_candidate: CoinValidationSnapshotSetupCandidate | null;
  setup_id: string;
  symbol: string;
  timeframe_roles: Record<'4h' | '1h' | '15m' | '1m', CoinValidationSnapshotTimeframeRole>;
  timeframes: Record<'1m' | '15m' | '1h' | '4h', CoinValidationSnapshotTimeframe>;
  validation_rules: CoinValidationRules;
};
