import type { DcaFrequency, ManifestStock } from "../types";

export function stockKey(stock: ManifestStock) {
  return `${stock.symbol}.${stock.market}`;
}

export function formatCurrency(value: number, signed = false) {
  const sign = signed && value > 0 ? "+" : "";
  return `${sign}¥${Math.round(value).toLocaleString("zh-CN")}`;
}

export function formatPercent(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

export function formatNumber(value: number, digits = 0) {
  return value.toLocaleString("zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatDate(value?: string) {
  return value ? value.slice(0, 10) : "-";
}

export function frequencyText(value: DcaFrequency) {
  return { daily: "每日买入", weekly: "每周买入", monthly: "每月买入" }[value];
}
