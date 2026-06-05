import { Alert, Card, Divider, Flex, Typography } from "antd";
import { RuleTags } from "./RuleTags";
import { TitleBlock } from "./TitleBlock";
import { formatCurrency, formatNumber, formatPercent, frequencyText } from "../lib/format";
import type { BacktestResult, DcaFrequency, InvestmentMode } from "../types";

interface SummaryPanelProps {
  mode: InvestmentMode;
  frequency: DcaFrequency;
  result: BacktestResult | null;
}

export function SummaryPanel({ mode, frequency, result }: SummaryPanelProps) {
  const isSingle = mode === "single";

  return (
    <Card
      className="work-card summary-card"
      title={<TitleBlock title="收益摘要" subtitle={isSingle ? "单笔买入" : `定投计划 · ${frequencyText(frequency)}`} />}
    >
      {result ? (
        <>
          <div className="hero-metric">
            <Typography.Text>{isSingle ? "收益金额" : "累计收益"}</Typography.Text>
            <strong>{formatCurrency(result.summary.profit, true)}</strong>
          </div>
          <SummaryRows result={result} isSingle={isSingle} />
          <Card className="rules-card" title="计算规则" size="small">
            <RuleTags mode={mode} />
          </Card>
        </>
      ) : (
        <Alert type="info" showIcon message="暂无计算结果" />
      )}
    </Card>
  );
}

function SummaryRows({ result, isSingle }: { result: BacktestResult; isSingle: boolean }) {
  return (
    <div className="summary-list">
      <SummaryRow label="收益率" value={formatPercent(result.summary.returnRate)} />
      <SummaryRow
        label={isSingle ? "买入价格" : "累计投入"}
        value={isSingle ? formatCurrency(result.trades[0].price) : formatCurrency(result.summary.totalInvested)}
      />
      <SummaryRow label={isSingle ? "买入份额" : "累计份额"} value={`${formatNumber(result.summary.totalShares, 2)} 股`} />
      {!isSingle && <SummaryRow label="买入次数" value={`${result.summary.tradeCount} 次`} />}
      <SummaryRow label={isSingle ? "查看交易日" : "结束交易日"} value={result.summary.endTradeDate} />
      <SummaryRow label="计算模式" value={isSingle ? "单笔买入" : "定投计划"} />
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <Flex className="summary-row" justify="space-between" gap={16}>
        <Typography.Text>{label}</Typography.Text>
        <Typography.Text strong>{value}</Typography.Text>
      </Flex>
      <Divider className="summary-divider" />
    </>
  );
}
