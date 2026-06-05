import { calculateDca, calculateSingleBuy } from "./backtest";
import type { FormState, InvestmentMode, StockData } from "../types";

export const defaultForm: FormState = {
  buyDate: "",
  viewDate: "",
  startDate: "",
  endDate: "",
  singleAmount: 20000,
  dcaAmount: 1000,
  frequency: "monthly",
};

export function runCalculation(stockData: StockData, mode: InvestmentMode, form: FormState) {
  if (mode === "single") {
    return calculateSingleBuy({
      prices: stockData.prices,
      buyDate: form.buyDate,
      viewDate: form.viewDate,
      amount: form.singleAmount,
    });
  }

  return calculateDca({
    prices: stockData.prices,
    startDate: form.startDate,
    endDate: form.endDate,
    amount: form.dcaAmount,
    frequency: form.frequency,
  });
}
