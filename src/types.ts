export type AssetType = "stock" | "etf" | "index";
export type Market = "SH" | "SZ" | "US" | "CSI";
export type InvestmentMode = "single" | "dca";
export type DcaFrequency = "daily" | "weekly" | "monthly";

export interface ManifestStock {
  symbol: string;
  market: Market;
  name: string;
  assetType: AssetType;
  file: string;
  latestTradeDate: string;
}

export interface Manifest {
  updatedAt: string;
  stocks: ManifestStock[];
}

export type PriceTuple = [date: string, close: number];

export interface StockData {
  symbol: string;
  market: Market;
  name: string;
  assetType: AssetType;
  adjust: "qfq";
  source: string;
  updatedAt: string;
  latestTradeDate: string;
  prices: PriceTuple[];
}

export interface ChartPoint {
  date: string;
  assetValue: number;
  invested: number;
  price: number;
  returnRate: number;
  maxDrawdown: number;
}

export interface TradeRecord {
  date: string;
  price: number;
  amount: number;
  shares: number;
  totalShares: number;
}

export interface BacktestSummary {
  totalInvested: number;
  finalValue: number;
  profit: number;
  returnRate: number;
  annualizedReturn: number;
  totalShares: number;
  tradeCount: number;
  startTradeDate: string;
  endTradeDate: string;
}

export interface BacktestResult {
  mode: InvestmentMode;
  summary: BacktestSummary;
  chart: ChartPoint[];
  trades: TradeRecord[];
}

export interface FormState {
  buyDate: string;
  viewDate: string;
  startDate: string;
  endDate: string;
  singleAmount: number;
  dcaAmount: number;
  frequency: DcaFrequency;
}
