import { Flex, Typography } from "antd";
import type { ReactNode } from "react";

interface TitleBlockProps {
  title: string;
  subtitle: string;
  extra?: ReactNode;
}

export function TitleBlock({ title, subtitle, extra }: TitleBlockProps) {
  return (
    <Flex justify="space-between" align="start" gap={12}>
      <div>
        <Typography.Title level={3}>{title}</Typography.Title>
        <Typography.Text type="secondary">{subtitle}</Typography.Text>
      </div>
      {extra}
    </Flex>
  );
}
