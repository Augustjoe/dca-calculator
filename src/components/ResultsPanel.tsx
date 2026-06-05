import { Alert, Card, Col, Row, Statistic } from "antd";
import { TitleBlock } from "./TitleBlock";
import { ValueChart } from "./ValueChart";
import { formatCurrency, formatPercent } from "../lib/format";
import type { BacktestResult, InvestmentMode } from "../types";

interface ResultsPanelProps {
  mode: InvestmentMode;
  result: BacktestResult | null;
}

export function ResultsPanel({ mode, result }: ResultsPanelProps) {
  const isSingle = mode === "single";

  return (
    <Card
      className="work-card main-card"
      title={
        <TitleBlock
          title={isSingle ? "价值变化" : "定投资产曲线"}
          subtitle={result ? `${result.summary.startTradeDate} 至 ${result.summary.endTradeDate}` : "等待计算"}
        />
      }
    >
      {result ? (
        <>
          <Row gutter={[12, 12]}>
            <MetricCard label={isSingle ? "买入金额" : "累计投入"} value={result.summary.totalInvested} />
            <MetricCard label={isSingle ? "当前价值" : "期末资产"} value={result.summary.finalValue} />
            <MetricCard label={isSingle ? "收益金额" : "累计收益"} value={result.summary.profit} signed tone="green" />
            <MetricCard label="简化年化" value={result.summary.annualizedReturn} percent tone="green" />
          </Row>
          <Card className="chart-card" title={isSingle ? "这笔资金的历史价值" : "资产价值与累计投入"} size="small">
            <ValueChart points={result.chart} mode={mode} />
          </Card>
        </>
      ) : (
        <Alert type="info" showIcon message="输入参数后点击计算收益" />
      )}
    </Card>
  );
}

function MetricCard({
  label,
  value,
  signed = false,
  percent = false,
  tone,
}: {
  label: string;
  value: number;
  signed?: boolean;
  percent?: boolean;
  tone?: "green";
}) {
  return (
    <Col xs={12} md={6}>
      <Card className="metric-card" size="small">
        <Statistic
          title={label}
          value={percent ? formatPercent(value) : formatCurrency(value, signed)}
          valueStyle={tone === "green" ? { color: "#107a64" } : undefined}
        />
      </Card>
    </Col>
  );
}
