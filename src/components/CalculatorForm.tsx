import { Alert, Button, Card, Col, DatePicker, Form, InputNumber, Row, Segmented, Select, Space, Tag } from "antd";
import dayjs from "dayjs";
import { ArrowUpRight } from "lucide-react";
import { RuleTags } from "./RuleTags";
import { TitleBlock } from "./TitleBlock";
import { stockKey } from "../lib/format";
import type { DcaFrequency, FormState, InvestmentMode, Manifest, StockData } from "../types";

interface CalculatorFormProps {
  manifest: Manifest | null;
  stockData: StockData | null;
  selectedKey: string;
  mode: InvestmentMode;
  form: FormState;
  error: string;
  loading: boolean;
  onSelectedKeyChange: (value: string) => void;
  onModeChange: (value: InvestmentMode) => void;
  onFormChange: (updater: (current: FormState) => FormState) => void;
  onCalculate: () => void;
}

export function CalculatorForm({
  manifest,
  stockData,
  selectedKey,
  mode,
  form,
  error,
  loading,
  onSelectedKeyChange,
  onModeChange,
  onFormChange,
  onCalculate,
}: CalculatorFormProps) {
  const isSingle = mode === "single";
  const latestTradeDate = stockData?.latestTradeDate ?? "-";
  const firstTradeDate = stockData?.prices[0]?.[0] ?? "-";
  const isSampleData = stockData?.source === "Sample";

  return (
    <Card
      title={
        <TitleBlock
          title="收益测算"
          subtitle="单笔买入或定投计划"
          extra={<Tag color="green">{manifest?.stocks.length ?? 0} 个预置</Tag>}
        />
      }
      className="work-card"
    >
      <Form layout="vertical" className="input-form">
        <Form.Item label="计算模式">
          <Segmented
            block
            value={mode}
            options={[
              { label: "单笔买入", value: "single" },
              { label: "定投计划", value: "dca" },
            ]}
            onChange={(value) => onModeChange(value as InvestmentMode)}
          />
        </Form.Item>

        <Form.Item label="标的">
          <Select
            value={selectedKey || undefined}
            loading={loading}
            options={manifest?.stocks.map((stock) => ({
              value: stockKey(stock),
              label: `${stock.symbol} ${stock.name}`,
            }))}
            onChange={onSelectedKeyChange}
          />
          <Space className="tag-row" size={[8, 8]} wrap>
            <Tag color="blue">{firstTradeDate} 起</Tag>
            <Tag color="green">截止 {latestTradeDate}</Tag>
            <Tag color={isSampleData ? "gold" : "cyan"}>{stockData?.source ?? "加载中"}</Tag>
          </Space>
        </Form.Item>

        {isSingle ? (
          <SingleBuyFields form={form} stockData={stockData} onFormChange={onFormChange} />
        ) : (
          <DcaFields form={form} stockData={stockData} onFormChange={onFormChange} />
        )}

        <Form.Item label="计算规则">
          <RuleTags mode={mode} />
        </Form.Item>

        <Button type="primary" icon={<ArrowUpRight size={16} />} onClick={onCalculate} disabled={loading || !stockData}>
          计算收益
        </Button>
        {error && <Alert className="form-alert" type="error" showIcon message={error} />}
      </Form>
    </Card>
  );
}

function SingleBuyFields({
  form,
  stockData,
  onFormChange,
}: {
  form: FormState;
  stockData: StockData | null;
  onFormChange: CalculatorFormProps["onFormChange"];
}) {
  return (
    <Row gutter={10}>
      <Col span={12}>
        <DateField
          label="买入日"
          value={form.buyDate}
          onChange={(buyDate) => onFormChange((current) => ({ ...current, buyDate }))}
          stockData={stockData}
        />
      </Col>
      <Col span={12}>
        <DateField
          label="查看日"
          value={form.viewDate}
          onChange={(viewDate) => onFormChange((current) => ({ ...current, viewDate }))}
          stockData={stockData}
        />
      </Col>
      <Col span={24}>
        <Form.Item label="买入金额">
          <InputNumber
            className="full-width"
            min={0}
            precision={0}
            addonAfter="元"
            value={form.singleAmount}
            onChange={(value) => onFormChange((current) => ({ ...current, singleAmount: Number(value ?? 0) }))}
          />
        </Form.Item>
      </Col>
    </Row>
  );
}

function DcaFields({
  form,
  stockData,
  onFormChange,
}: {
  form: FormState;
  stockData: StockData | null;
  onFormChange: CalculatorFormProps["onFormChange"];
}) {
  return (
    <Row gutter={10}>
      <Col span={12}>
        <DateField
          label="开始日"
          value={form.startDate}
          onChange={(startDate) => onFormChange((current) => ({ ...current, startDate }))}
          stockData={stockData}
        />
      </Col>
      <Col span={12}>
        <DateField
          label="结束日"
          value={form.endDate}
          onChange={(endDate) => onFormChange((current) => ({ ...current, endDate }))}
          stockData={stockData}
        />
      </Col>
      <Col span={24}>
        <Form.Item label="每次定投">
          <InputNumber
            className="full-width"
            min={0}
            precision={0}
            addonAfter="元/次"
            value={form.dcaAmount}
            onChange={(value) => onFormChange((current) => ({ ...current, dcaAmount: Number(value ?? 0) }))}
          />
        </Form.Item>
      </Col>
      <Col span={24}>
        <Form.Item label="定投频率">
          <Segmented
            block
            value={form.frequency}
            options={[
              { label: "每日", value: "daily" },
              { label: "每周", value: "weekly" },
              { label: "每月", value: "monthly" },
            ]}
            onChange={(frequency) => onFormChange((current) => ({ ...current, frequency: frequency as DcaFrequency }))}
          />
        </Form.Item>
      </Col>
    </Row>
  );
}

function DateField({
  label,
  value,
  onChange,
  stockData,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  stockData: StockData | null;
}) {
  const minDate = stockData ? dayjs(stockData.prices[0][0]) : null;
  const maxDate = stockData ? dayjs(stockData.latestTradeDate) : null;

  return (
    <Form.Item label={label}>
      <DatePicker
        className="full-width"
        value={value ? dayjs(value) : null}
        disabledDate={(date) => Boolean((minDate && date.isBefore(minDate, "day")) || (maxDate && date.isAfter(maxDate, "day")))}
        onChange={(date) => onChange(date ? date.format("YYYY-MM-DD") : "")}
      />
    </Form.Item>
  );
}
