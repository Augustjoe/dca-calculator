import { useState } from "react";
import { Alert, Button, Card, Col, Modal, Row, Statistic, Tooltip } from "antd";
import { Maximize2 } from "lucide-react";
import { TitleBlock } from "./TitleBlock";
import { ValueChart } from "./ValueChart";
import { formatCurrency, formatPercent } from "../lib/format";
import type { BacktestResult, InvestmentMode } from "../types";

interface ResultsPanelProps {
  mode: InvestmentMode;
  result: BacktestResult | null;
}

export function ResultsPanel({ mode, result }: ResultsPanelProps) {
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [showSingleDrawdown, setShowSingleDrawdown] = useState(false);
  const isSingle = mode === "single";
  const chartTitle = isSingle
    ? showSingleDrawdown
      ? "历史价值与最大回撤"
      : "历史价值"
    : "资产价值与标的走势";
  const subtitle = result ? `${result.summary.startTradeDate} 至 ${result.summary.endTradeDate}` : "等待计算";

  return (
    <>
      <Card
        className="work-card main-card"
        title={
          <TitleBlock
            title={isSingle ? "价值变化" : "定投资产曲线"}
            subtitle={subtitle}
            extra={
              <Tooltip title="全屏查看走势">
                <Button
                  className="header-action"
                  icon={<Maximize2 size={16} />}
                  disabled={!result}
                  onClick={() => setFullscreenOpen(true)}
                  aria-label="全屏查看走势"
                />
              </Tooltip>
            }
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
            <Card
              className="chart-card"
              title={chartTitle}
              size="small"
              extra={
                isSingle ? (
                  <Button
                    size="small"
                    type={showSingleDrawdown ? "primary" : "default"}
                    onClick={() => setShowSingleDrawdown((current) => !current)}
                  >
                    最大回撤
                  </Button>
                ) : undefined
              }
            >
              <ValueChart points={result.chart} mode={mode} showSingleDrawdown={showSingleDrawdown} />
            </Card>
          </>
        ) : (
          <Alert type="info" showIcon message="输入参数后点击计算收益" />
        )}
      </Card>

      <Modal
        className="chart-modal"
        title={<TitleBlock title={chartTitle} subtitle={subtitle} />}
        open={fullscreenOpen}
        footer={null}
        width="calc(100vw - 32px)"
        style={{ top: 16 }}
        onCancel={() => setFullscreenOpen(false)}
      >
        {result && (
          <ValueChart
            className="fullscreen-chart-surface"
            points={result.chart}
            mode={mode}
            detailed
            showSingleDrawdown={showSingleDrawdown}
          />
        )}
      </Modal>
    </>
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
