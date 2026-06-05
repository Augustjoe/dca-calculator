import { Button, Flex, Space, Tag, Typography } from "antd";
import { HelpCircle, RotateCcw } from "lucide-react";
import { formatDate } from "../lib/format";

interface AppHeaderProps {
  updatedAt?: string;
}

export function AppHeader({ updatedAt }: AppHeaderProps) {
  return (
    <Flex className="topbar" align="center" justify="space-between">
      <Flex align="center" gap={12} className="brand">
        <span className="mark">投</span>
        <Typography.Text strong>定投计算器</Typography.Text>
      </Flex>
      <Space size={10}>
        <Tag className="top-pill" bordered={false}>
          数据更新 {formatDate(updatedAt)}
        </Tag>
        <Button icon={<RotateCcw size={16} />} onClick={() => window.location.reload()} aria-label="刷新" />
        <Button className="hide-mobile" icon={<HelpCircle size={16} />} aria-label="帮助" />
      </Space>
    </Flex>
  );
}
