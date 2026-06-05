import { Space, Tag } from "antd";
import type { InvestmentMode } from "../types";

export function RuleTags({ mode }: { mode: InvestmentMode }) {
  return (
    <Space size={[8, 8]} wrap>
      <Tag color="green">{mode === "single" ? "前复权收益价" : "周期首个交易日买入"}</Tag>
      <Tag color="blue">允许碎股</Tag>
      <Tag>不计费用</Tag>
    </Space>
  );
}
