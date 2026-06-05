import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Col, ConfigProvider, Layout, Row } from "antd";
import zhCN from "antd/locale/zh_CN";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import { AppHeader } from "./components/AppHeader";
import { CalculatorForm } from "./components/CalculatorForm";
import { ResultsPanel } from "./components/ResultsPanel";
import { SummaryPanel } from "./components/SummaryPanel";
import { appTheme } from "./config/antdTheme";
import { findTradeOnOrAfter } from "./lib/backtest";
import { defaultForm, runCalculation } from "./lib/calculation";
import { loadManifest, loadStockData } from "./lib/data";
import { stockKey } from "./lib/format";
import type { BacktestResult, FormState, InvestmentMode, Manifest, StockData } from "./types";

dayjs.locale("zh-cn");

export default function App() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [selectedKey, setSelectedKey] = useState("");
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [mode, setMode] = useState<InvestmentMode>("single");
  const [form, setForm] = useState<FormState>(defaultForm);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadManifest()
      .then((data) => {
        if (cancelled) return;
        setManifest(data);
        const preferred = data.stocks.find((stock) => stock.symbol === "600519") ?? data.stocks[0];
        setSelectedKey(stockKey(preferred));
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "数据加载失败"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedStock = useMemo(
    () => manifest?.stocks.find((stock) => stockKey(stock) === selectedKey) ?? null,
    [manifest, selectedKey],
  );

  useEffect(() => {
    if (!selectedStock) return;

    let cancelled = false;
    setError("");
    setResult(null);
    loadStockData(selectedStock.file)
      .then((data) => {
        if (cancelled) return;
        setStockData(data);
        const startIndex = Math.max(findTradeOnOrAfter(data.prices, "2020-01-02"), 0);
        const startDate = data.prices[startIndex][0];
        const endDate = data.prices[data.prices.length - 1][0];
        const nextForm = {
          ...defaultForm,
          buyDate: startDate,
          viewDate: endDate,
          startDate,
          endDate,
        };
        setForm(nextForm);
        setResult(runCalculation(data, mode, nextForm));
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "行情加载失败"));

    return () => {
      cancelled = true;
    };
  }, [mode, selectedStock]);

  const handleCalculate = useCallback(() => {
    if (!stockData) return;
    try {
      setError("");
      setResult(runCalculation(stockData, mode, form));
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "计算失败");
    }
  }, [form, mode, stockData]);

  const isSampleData = stockData?.source === "Sample";

  return (
    <ConfigProvider locale={zhCN} theme={appTheme}>
      <Layout className="app-shell">
        <AppHeader updatedAt={manifest?.updatedAt} />

        {isSampleData && (
          <Alert
            className="source-alert"
            type="warning"
            showIcon
            message="当前使用的是演示数据，不是真实行情"
            description="这些静态 JSON 由 sample 模式生成，用于离线开发和 UI 验收。安装 AKShare 后运行 npm run update-data 才会生成真实历史行情。"
          />
        )}

        <Row className="workspace" gutter={[18, 18]}>
          <Col xs={24} lg={7} xl={6} xxl={5}>
            <CalculatorForm
              manifest={manifest}
              stockData={stockData}
              selectedKey={selectedKey}
              mode={mode}
              form={form}
              error={error}
              loading={loading}
              onSelectedKeyChange={setSelectedKey}
              onModeChange={setMode}
              onFormChange={setForm}
              onCalculate={handleCalculate}
            />
          </Col>

          <Col xs={24} lg={11} xl={12} xxl={14}>
            <ResultsPanel mode={mode} result={result} />
          </Col>

          <Col xs={24} lg={6} xl={6} xxl={5}>
            <SummaryPanel mode={mode} frequency={form.frequency} result={result} />
          </Col>
        </Row>
      </Layout>
    </ConfigProvider>
  );
}
