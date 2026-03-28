export type Coin = {
  symbol: string;
  name: string;
  note: string;
  price: string;
  change: string;
  volume: string;
  category: string;
  description: string;
  thesis: string;
  support: string;
  resistance: string;
  watchList: string[];
};

export const coins: Coin[] = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    note: "Primary market to scan",
    price: "$68,420",
    change: "+2.4%",
    volume: "$28.1B",
    category: "Market leader",
    description:
      "The main reference asset for the scanner. BTC usually sets the tone for the rest of the market.",
    thesis:
      "Useful for spotting broad risk-on or risk-off momentum before rotating into altcoins.",
    support: "$66,900",
    resistance: "$69,800",
    watchList: ["Trend continuation", "ETF flow", "Funding rate"],
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    note: "Major liquid altcoin",
    price: "$3,620",
    change: "+1.8%",
    volume: "$12.4B",
    category: "Smart contract leader",
    description:
      "ETH is often the first large-cap altcoin to confirm whether the market is rotating beyond BTC.",
    thesis:
      "Watch ETH/BTC strength for early confirmation of altcoin momentum.",
    support: "$3,480",
    resistance: "$3,740",
    watchList: ["L2 activity", "ETH/BTC ratio", "Breakout volume"],
  },
  {
    symbol: "SOL",
    name: "Solana",
    note: "High activity ecosystem",
    price: "$178.20",
    change: "+4.1%",
    volume: "$4.9B",
    category: "High beta layer 1",
    description:
      "SOL tends to move aggressively when risk appetite is strong, making it a useful momentum tracker.",
    thesis:
      "Best for identifying fast continuation setups and market-wide speculation.",
    support: "$170.00",
    resistance: "$184.50",
    watchList: ["DeFi volume", "Meme coin spillover", "Spot demand"],
  },
  {
    symbol: "BNB",
    name: "BNB",
    note: "Large-cap exchange token",
    price: "$612.30",
    change: "+0.9%",
    volume: "$1.8B",
    category: "Exchange ecosystem",
    description:
      "BNB often reflects exchange activity and broader liquidity conditions across the market.",
    thesis:
      "A stable BNB chart often supports a constructive market backdrop.",
    support: "$600.00",
    resistance: "$624.00",
    watchList: ["Exchange volumes", "Ecosystem traction", "Range compression"],
  },
  {
    symbol: "XRP",
    name: "XRP",
    note: "Popular payments asset",
    price: "$0.58",
    change: "-0.4%",
    volume: "$2.3B",
    category: "Payments narrative",
    description:
      "XRP is often driven by narrative-led momentum and can react sharply to market catalysts.",
    thesis:
      "Useful for spotting fast mean reversion or headline-driven spikes.",
    support: "$0.55",
    resistance: "$0.61",
    watchList: ["Breakout retest", "News catalyst", "Retail volume"],
  },
  {
    symbol: "ADA",
    name: "Cardano",
    note: "Established layer 1",
    price: "$0.47",
    change: "+1.2%",
    volume: "$640M",
    category: "Mature layer 1",
    description:
      "ADA is a slower mover than the higher-beta names, but it can still show clean technical structure.",
    thesis:
      "Watch for rounded bases and gradual accumulation phases.",
    support: "$0.45",
    resistance: "$0.50",
    watchList: ["Long base", "Swing breakout", "Market breadth"],
  },
  {
    symbol: "DOGE",
    name: "Dogecoin",
    note: "High-volatility memecoin",
    price: "$0.16",
    change: "+5.7%",
    volume: "$1.1B",
    category: "Meme beta",
    description:
      "DOGE tends to amplify sentiment across speculative trades and can move quickly on momentum bursts.",
    thesis:
      "Track DOGE when the market shifts into pure risk appetite.",
    support: "$0.15",
    resistance: "$0.17",
    watchList: ["Social sentiment", "Momentum burst", "Derivatives open interest"],
  },
  {
    symbol: "LINK",
    name: "Chainlink",
    note: "Infrastructure and oracle play",
    price: "$15.84",
    change: "+2.1%",
    volume: "$870M",
    category: "Infrastructure",
    description:
      "LINK often trades like a quality infrastructure asset within the altcoin universe.",
    thesis:
      "Good for reading whether capital is moving into higher-conviction alt narratives.",
    support: "$15.20",
    resistance: "$16.40",
    watchList: ["Oracle demand", "Accumulation range", "Alt rotation"],
  },
];

export function getCoinBySymbol(symbol: string) {
  return coins.find((coin) => coin.symbol.toLowerCase() === symbol.toLowerCase());
}
