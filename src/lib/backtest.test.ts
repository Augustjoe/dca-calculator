import { describe, expect, it } from "vitest";
import {
  calculateDca,
  calculateSingleBuy,
  findTradeOnOrAfter,
  findTradeOnOrBefore,
  makeDcaTradeIndexes,
} from "./backtest";
import type { PriceTuple } from "../types";

const prices: PriceTuple[] = [
  ["2024-01-02", 10],
  ["2024-01-03", 11],
  ["2024-01-05", 12],
  ["2024-01-08", 10],
  ["2024-01-15", 20],
  ["2024-02-01", 25],
  ["2024-02-05", 30],
];

describe("trade day helpers", () => {
  it("finds the first trade day on or after a date", () => {
    expect(findTradeOnOrAfter(prices, "2024-01-04")).toBe(2);
    expect(findTradeOnOrAfter(prices, "2024-02-06")).toBe(-1);
  });

  it("finds the last trade day on or before a date", () => {
    expect(findTradeOnOrBefore(prices, "2024-01-04")).toBe(1);
    expect(findTradeOnOrBefore(prices, "2024-01-01")).toBe(-1);
  });
});

describe("single buy backtest", () => {
  it("uses the next buy trade day and previous view trade day", () => {
    const result = calculateSingleBuy({
      prices,
      buyDate: "2024-01-04",
      viewDate: "2024-01-14",
      amount: 1200,
    });

    expect(result.summary.startTradeDate).toBe("2024-01-05");
    expect(result.summary.endTradeDate).toBe("2024-01-08");
    expect(result.summary.totalShares).toBeCloseTo(100);
    expect(result.summary.finalValue).toBeCloseTo(1000);
    expect(result.summary.profit).toBeCloseTo(-200);
  });

  it("rejects invalid amount and invalid ranges", () => {
    expect(() =>
      calculateSingleBuy({ prices, buyDate: "2024-01-02", viewDate: "2024-01-03", amount: 0 }),
    ).toThrow("金额");
    expect(() =>
      calculateSingleBuy({ prices, buyDate: "2024-02-06", viewDate: "2024-02-07", amount: 1000 }),
    ).toThrow("日期");
  });
});

describe("dca backtest", () => {
  it("buys on every trade day for daily frequency", () => {
    const result = calculateDca({
      prices,
      startDate: "2024-01-02",
      endDate: "2024-01-08",
      amount: 100,
      frequency: "daily",
    });

    expect(result.summary.tradeCount).toBe(4);
    expect(result.summary.totalInvested).toBe(400);
    expect(result.chart.at(-1)?.invested).toBe(400);
  });

  it("uses the first trade day of each week", () => {
    const indexes = makeDcaTradeIndexes(prices, 0, prices.length - 1, "weekly");
    expect(indexes.map((index) => prices[index][0])).toEqual(["2024-01-02", "2024-01-08", "2024-01-15", "2024-02-01", "2024-02-05"]);
  });

  it("uses the first trade day of each month", () => {
    const result = calculateDca({
      prices,
      startDate: "2024-01-04",
      endDate: "2024-02-28",
      amount: 1000,
      frequency: "monthly",
    });

    expect(result.trades.map((trade) => trade.date)).toEqual(["2024-01-05", "2024-02-01"]);
    expect(result.summary.tradeCount).toBe(2);
    expect(result.summary.totalInvested).toBe(2000);
    expect(result.summary.returnRate).toBeGreaterThan(0);
  });
});
