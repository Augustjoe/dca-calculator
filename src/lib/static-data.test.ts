import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import type { Manifest, StockData } from "../types";

const root = process.cwd();

describe("static data files", () => {
  it("manifest points to valid sorted stock json files", () => {
    const manifest = readJson<Manifest>("public/data/manifest.json");

    expect(manifest.stocks.length).toBeGreaterThan(0);
    expect(manifest.stocks.length).toBeLessThanOrEqual(15);

    for (const stock of manifest.stocks) {
      const filePath = join(root, "public", stock.file.replace("/data/", "data/"));
      expect(existsSync(filePath), `${stock.file} should exist`).toBe(true);

      const data = readJson<StockData>(filePath);
      expect(data.symbol).toBe(stock.symbol);
      expect(data.market).toBe(stock.market);
      expect(data.name).toBe(stock.name);
      expect(data.assetType).toBe(stock.assetType);
      expect(data.adjust).toBe("qfq");
      expect(data.prices.length).toBeGreaterThan(0);
      expect(data.latestTradeDate).toBe(data.prices.at(-1)?.[0]);

      let previousDate = "";
      for (const [date, close] of data.prices) {
        expect(date > previousDate).toBe(true);
        expect(Number.isFinite(close)).toBe(true);
        expect(close).toBeGreaterThan(0);
        previousDate = date;
      }
    }
  });
});

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(isAbsolute(path) ? path : join(root, path), "utf-8")) as T;
}
