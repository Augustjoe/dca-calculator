from __future__ import annotations

import argparse
import json
import math
import os
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
WATCHLIST_PATH = ROOT / "watchlist.json"
DATA_DIR = ROOT / "public" / "data"
STOCK_DIR = DATA_DIR / "stocks"
MAX_WATCHLIST_SIZE = 15
DEFAULT_START_DATE = date(2010, 1, 1)
HK_TZ = timezone(timedelta(hours=8))


@dataclass(frozen=True)
class WatchItem:
    symbol: str
    market: str
    name: str
    asset_type: str
    yahoo_symbol: str | None = None

    @property
    def filename(self) -> str:
        return f"{self.symbol}.{self.market}.json"

    @property
    def file_url(self) -> str:
        return f"/data/stocks/{self.filename}"


def read_watchlist() -> list[WatchItem]:
    raw = json.loads(WATCHLIST_PATH.read_text(encoding="utf-8"))
    if not isinstance(raw, list):
        raise ValueError("watchlist.json must be a list")
    if len(raw) > MAX_WATCHLIST_SIZE:
        raise ValueError(f"watchlist.json supports at most {MAX_WATCHLIST_SIZE} items")

    items: list[WatchItem] = []
    seen: set[str] = set()
    for row in raw:
        symbol = str(row.get("symbol", "")).strip()
        market = str(row.get("market", "")).strip().upper()
        name = str(row.get("name", "")).strip()
        asset_type = str(row.get("assetType", "")).strip()
        key = f"{symbol}.{market}"

        if not symbol or not market or not name:
            raise ValueError(f"Invalid watchlist item: {row}")
        yahoo_symbol = str(row.get("yahooSymbol", "")).strip() or None

        if market not in {"SH", "SZ", "US", "CSI"}:
            raise ValueError(f"Unsupported market for {key}: {market}")
        if asset_type not in {"stock", "etf", "index"}:
            raise ValueError(f"Unsupported assetType for {key}: {asset_type}")
        if asset_type != "index" and market not in {"SH", "SZ"}:
            raise ValueError(f"Only index assets can use market {market}: {key}")
        if market == "US" and not yahoo_symbol:
            raise ValueError(f"US index requires yahooSymbol: {key}")
        if key in seen:
            raise ValueError(f"Duplicate watchlist item: {key}")

        seen.add(key)
        items.append(
            WatchItem(
                symbol=symbol,
                market=market,
                name=name,
                asset_type=asset_type,
                yahoo_symbol=yahoo_symbol,
            )
        )
    return items


def normalize_rows(rows: list[tuple[str, float]]) -> list[list[Any]]:
    normalized: list[list[Any]] = []
    previous = ""
    for trade_date, close in rows:
        if not isinstance(trade_date, str) or len(trade_date) != 10:
            raise ValueError(f"Invalid trade date: {trade_date}")
        if trade_date <= previous:
            raise ValueError("Price rows must be sorted by ascending date")
        if not math.isfinite(close) or close <= 0:
            raise ValueError(f"Invalid close price for {trade_date}: {close}")
        normalized.append([trade_date, round(float(close), 4)])
        previous = trade_date
    if not normalized:
        raise ValueError("No price rows returned")
    return normalized


def fetch_market_prices(item: WatchItem, start: date, end: date) -> tuple[list[list[Any]], str]:
    disable_system_proxy()
    if item.asset_type == "index" and item.market == "US":
        return fetch_yahoo_prices(item, start, end), "Yahoo Finance"

    try:
        import akshare as ak  # type: ignore
    except ImportError as exc:
        print(f"AKShare is not installed, trying Yahoo Finance fallback: {exc}")
        return fetch_yahoo_prices(item, start, end), "Yahoo Finance"

    start_text = start.strftime("%Y%m%d")
    end_text = end.strftime("%Y%m%d")

    try:
        if item.asset_type == "index" and item.market == "CSI":
            df = ak.stock_zh_index_hist_csindex(
                symbol=item.symbol,
                start_date=start_text,
                end_date=end_text,
            )
        elif item.asset_type == "etf":
            df = ak.fund_etf_hist_em(
                symbol=item.symbol,
                period="daily",
                start_date=start_text,
                end_date=end_text,
                adjust="qfq",
            )
        else:
            df = ak.stock_zh_a_hist(
                symbol=item.symbol,
                period="daily",
                start_date=start_text,
                end_date=end_text,
                adjust="qfq",
            )
    except Exception as exc:
        print(f"AKShare failed for {item.symbol}.{item.market}, trying Eastmoney fallback: {exc}")
        try:
            return fetch_eastmoney_prices(item, start_text, end_text), "Eastmoney"
        except Exception as fallback_exc:
            print(f"Eastmoney failed for {item.symbol}.{item.market}, trying Yahoo Finance fallback: {fallback_exc}")
            return fetch_yahoo_prices(item, start, end), "Yahoo Finance"

    if df is None or df.empty:
        raise ValueError(f"No data returned for {item.symbol}.{item.market}")

    rows: list[tuple[str, float]] = []
    for _, record in df.iterrows():
        trade_date = str(record["日期"])[:10]
        close = float(record["收盘"])
        rows.append((trade_date, close))
    source = "CSIndex" if item.asset_type == "index" and item.market == "CSI" else "AKShare"
    return normalize_rows(rows), source


def disable_system_proxy() -> None:
    for key in ["HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy"]:
        os.environ.pop(key, None)
    os.environ["NO_PROXY"] = "*"
    os.environ["no_proxy"] = "*"


def fetch_eastmoney_prices(item: WatchItem, start_text: str, end_text: str) -> list[list[Any]]:
    import requests

    if item.market not in {"SH", "SZ"}:
        raise ValueError(f"Eastmoney fallback only supports SH/SZ assets: {item.symbol}.{item.market}")
    market_id = "1" if item.market == "SH" else "0"
    session = requests.Session()
    session.trust_env = False
    response = session.get(
        "https://push2his.eastmoney.com/api/qt/stock/kline/get",
        params={
            "fields1": "f1,f2,f3,f4,f5,f6",
            "fields2": "f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61,f116",
            "ut": "7eea3edcaed734bea9cbfc24409ed989",
            "klt": "101",
            "fqt": "1",
            "secid": f"{market_id}.{item.symbol}",
            "beg": start_text,
            "end": end_text,
        },
        headers={
            "Accept": "application/json, text/plain, */*",
            "Referer": "https://quote.eastmoney.com/",
            "User-Agent": "Mozilla/5.0",
        },
        timeout=20,
    )
    response.raise_for_status()
    payload = response.json()
    klines = payload.get("data", {}).get("klines") or []
    rows: list[tuple[str, float]] = []
    for line in klines:
        fields = str(line).split(",")
        rows.append((fields[0], float(fields[2])))
    return normalize_rows(rows)


def fetch_yahoo_prices(item: WatchItem, start: date, end: date) -> list[list[Any]]:
    import requests

    if item.yahoo_symbol:
        symbol = item.yahoo_symbol
    else:
        suffix = "SS" if item.market == "SH" else "SZ"
        symbol = f"{item.symbol}.{suffix}"
    session = requests.Session()
    session.trust_env = False
    response = session.get(
        f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}",
        params={
            "period1": int(datetime(start.year, start.month, start.day, tzinfo=timezone.utc).timestamp()),
            "period2": int(datetime(end.year, end.month, end.day, tzinfo=timezone.utc).timestamp()) + 86_400,
            "interval": "1d",
            "events": "history",
            "includeAdjustedClose": "true",
        },
        headers={"User-Agent": "Mozilla/5.0"},
        timeout=30,
    )
    response.raise_for_status()
    payload = response.json()
    result = (payload.get("chart", {}).get("result") or [None])[0]
    if not result:
        raise ValueError(f"No Yahoo data returned for {symbol}")

    timestamps = result.get("timestamp") or []
    indicators = result.get("indicators", {})
    adjclose = ((indicators.get("adjclose") or [{}])[0]).get("adjclose") or []
    close = ((indicators.get("quote") or [{}])[0]).get("close") or []
    series = adjclose if adjclose else close

    rows: list[tuple[str, float]] = []
    for timestamp, price in zip(timestamps, series):
        if price is None:
            continue
        trade_date = datetime.fromtimestamp(int(timestamp), tz=timezone.utc).date().isoformat()
        rows.append((trade_date, float(price)))
    return normalize_rows(rows)


def generate_sample_prices(item: WatchItem, start: date, end: date) -> list[list[Any]]:
    rows: list[tuple[str, float]] = []
    numeric_seed = sum(ord(char) for char in item.symbol)
    seed = (numeric_seed % 1000) / 1000
    base = 8 + (numeric_seed % 40)
    current = start
    index = 0

    while current <= end:
        if current.weekday() < 5:
            drift = 1 + index * (0.00016 + seed * 0.00003)
            wave = math.sin(index / 38 + seed * 4) * 0.07 + math.sin(index / 113) * 0.12
            close = max(1, base * drift * (1 + wave))
            rows.append((current.isoformat(), close))
            index += 1
        current += timedelta(days=1)
    return normalize_rows(rows)


def write_data(items: list[WatchItem], sample: bool) -> None:
    now = datetime.now(HK_TZ).replace(microsecond=0).isoformat()
    today = datetime.now(HK_TZ).date()
    STOCK_DIR.mkdir(parents=True, exist_ok=True)

    manifest_items: list[dict[str, Any]] = []
    for item in items:
        if sample:
            prices = generate_sample_prices(item, DEFAULT_START_DATE, today)
            source = "Sample"
        else:
            prices, source = fetch_market_prices(item, DEFAULT_START_DATE, today)
        payload = {
            "symbol": item.symbol,
            "market": item.market,
            "name": item.name,
            "assetType": item.asset_type,
            "adjust": "qfq",
            "source": source,
            "updatedAt": now,
            "latestTradeDate": prices[-1][0],
            "prices": prices,
        }
        (STOCK_DIR / item.filename).write_text(
            json.dumps(payload, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        manifest_items.append(
            {
                "symbol": item.symbol,
                "market": item.market,
                "name": item.name,
                "assetType": item.asset_type,
                "file": item.file_url,
                "latestTradeDate": prices[-1][0],
            }
        )
        print(f"Wrote {item.filename}: {len(prices)} rows")

    manifest = {"updatedAt": now, "stocks": manifest_items}
    (DATA_DIR / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Update static A-share backtest data.")
    parser.add_argument("--sample", action="store_true", help="Generate deterministic sample data without AKShare.")
    args = parser.parse_args()

    items = read_watchlist()
    write_data(items, sample=args.sample)


if __name__ == "__main__":
    main()
