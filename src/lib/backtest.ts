import type {
  BacktestResult,
  ChartPoint,
  DcaFrequency,
  PriceTuple,
  TradeRecord,
} from "../types";

export interface SingleBuyInput {
  prices: PriceTuple[];
  buyDate: string;
  viewDate: string;
  amount: number;
}

export interface DcaInput {
  prices: PriceTuple[];
  startDate: string;
  endDate: string;
  amount: number;
  frequency: DcaFrequency;
}

export function findTradeOnOrAfter(prices: PriceTuple[], date: string): number {
  return prices.findIndex(([tradeDate]) => tradeDate >= date);
}

export function findTradeOnOrBefore(prices: PriceTuple[], date: string): number {
  for (let index = prices.length - 1; index >= 0; index -= 1) {
    if (prices[index][0] <= date) {
      return index;
    }
  }
  return -1;
}

export function calculateSingleBuy(input: SingleBuyInput): BacktestResult {
  const { prices, buyDate, viewDate, amount } = input;
  assertValidPrices(prices);
  assertPositiveAmount(amount);

  const buyIndex = findTradeOnOrAfter(prices, buyDate);
  const viewIndex = findTradeOnOrBefore(prices, viewDate);
  assertValidRange(buyIndex, viewIndex);

  const [startTradeDate, buyPrice] = prices[buyIndex];
  const [endTradeDate, endPrice] = prices[viewIndex];
  const totalShares = amount / buyPrice;
  const finalValue = totalShares * endPrice;
  const chart = prices.slice(buyIndex, viewIndex + 1).map<ChartPoint>(([date, close]) => ({
    date,
    assetValue: totalShares * close,
    invested: amount,
  }));

  return {
    mode: "single",
    summary: makeSummary({
      totalInvested: amount,
      finalValue,
      totalShares,
      tradeCount: 1,
      startTradeDate,
      endTradeDate,
    }),
    chart,
    trades: [
      {
        date: startTradeDate,
        price: buyPrice,
        amount,
        shares: totalShares,
        totalShares,
      },
    ],
  };
}

export function calculateDca(input: DcaInput): BacktestResult {
  const { prices, startDate, endDate, amount, frequency } = input;
  assertValidPrices(prices);
  assertPositiveAmount(amount);

  const startIndex = findTradeOnOrAfter(prices, startDate);
  const endIndex = findTradeOnOrBefore(prices, endDate);
  assertValidRange(startIndex, endIndex);

  const tradeIndexes = makeDcaTradeIndexes(prices, startIndex, endIndex, frequency);
  if (tradeIndexes.length === 0) {
    throw new Error("区间内没有可用交易日");
  }

  const tradeIndexSet = new Set(tradeIndexes);
  const trades: TradeRecord[] = [];
  const chart: ChartPoint[] = [];
  let totalInvested = 0;
  let totalShares = 0;

  for (let index = startIndex; index <= endIndex; index += 1) {
    const [date, close] = prices[index];
    if (tradeIndexSet.has(index)) {
      const shares = amount / close;
      totalInvested += amount;
      totalShares += shares;
      trades.push({
        date,
        price: close,
        amount,
        shares,
        totalShares,
      });
    }
    chart.push({
      date,
      assetValue: totalShares * close,
      invested: totalInvested,
    });
  }

  const [endTradeDate, endPrice] = prices[endIndex];
  return {
    mode: "dca",
    summary: makeSummary({
      totalInvested,
      finalValue: totalShares * endPrice,
      totalShares,
      tradeCount: trades.length,
      startTradeDate: prices[startIndex][0],
      endTradeDate,
    }),
    chart,
    trades,
  };
}

export function makeDcaTradeIndexes(
  prices: PriceTuple[],
  startIndex: number,
  endIndex: number,
  frequency: DcaFrequency,
): number[] {
  if (frequency === "daily") {
    return range(startIndex, endIndex);
  }

  const seenPeriods = new Set<string>();
  const indexes: number[] = [];
  for (let index = startIndex; index <= endIndex; index += 1) {
    const period = frequency === "weekly" ? weekKey(prices[index][0]) : prices[index][0].slice(0, 7);
    if (!seenPeriods.has(period)) {
      seenPeriods.add(period);
      indexes.push(index);
    }
  }
  return indexes;
}

function makeSummary(input: {
  totalInvested: number;
  finalValue: number;
  totalShares: number;
  tradeCount: number;
  startTradeDate: string;
  endTradeDate: string;
}) {
  const profit = input.finalValue - input.totalInvested;
  const returnRate = profit / input.totalInvested;
  const years = Math.max(daysBetween(input.startTradeDate, input.endTradeDate) / 365.25, 1 / 365.25);
  const annualizedReturn = Math.pow(input.finalValue / input.totalInvested, 1 / years) - 1;

  return {
    ...input,
    profit,
    returnRate,
    annualizedReturn,
  };
}

function assertValidPrices(prices: PriceTuple[]) {
  if (prices.length === 0) {
    throw new Error("暂无行情数据");
  }
  for (let index = 0; index < prices.length; index += 1) {
    const [date, close] = prices[index];
    if (!date || !Number.isFinite(close) || close <= 0) {
      throw new Error("行情数据格式不正确");
    }
    if (index > 0 && prices[index - 1][0] >= date) {
      throw new Error("行情日期必须升序排列");
    }
  }
}

function assertPositiveAmount(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("请输入大于 0 的金额");
  }
}

function assertValidRange(startIndex: number, endIndex: number) {
  if (startIndex < 0 || endIndex < 0) {
    throw new Error("选择日期超出数据范围");
  }
  if (startIndex > endIndex) {
    throw new Error("结束日期不能早于开始日期");
  }
}

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, offset) => start + offset);
}

function daysBetween(startDate: string, endDate: string) {
  const start = parseUtcDate(startDate).getTime();
  const end = parseUtcDate(endDate).getTime();
  return Math.max((end - start) / 86_400_000, 0);
}

function weekKey(dateText: string) {
  const date = parseUtcDate(dateText);
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - day + 1);
  return date.toISOString().slice(0, 10);
}

function parseUtcDate(dateText: string) {
  const [year, month, day] = dateText.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}
