import { theme } from "antd";
import type { ThemeConfig } from "antd";

export const appTheme: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: "#107a64",
    colorSuccess: "#107a64",
    colorInfo: "#315dd8",
    colorBgLayout: "#f5f7f4",
    colorText: "#1e2420",
    colorTextSecondary: "#66706a",
    borderRadius: 8,
    fontFamily: 'Inter, "Microsoft YaHei", "PingFang SC", Arial, sans-serif',
  },
  components: {
    Button: {
      controlHeight: 42,
      fontWeight: 700,
    },
    Card: {
      borderRadiusLG: 8,
      headerFontSize: 18,
    },
    InputNumber: {
      controlHeight: 42,
    },
    Select: {
      controlHeight: 42,
    },
  },
};
