import type { Manifest, StockData } from "../types";

export async function loadManifest(): Promise<Manifest> {
  const response = await fetch("/data/manifest.json");
  if (!response.ok) {
    throw new Error("无法加载股票清单");
  }
  return response.json() as Promise<Manifest>;
}

export async function loadStockData(file: string): Promise<StockData> {
  const response = await fetch(file);
  if (!response.ok) {
    throw new Error("无法加载股票行情");
  }
  return response.json() as Promise<StockData>;
}
