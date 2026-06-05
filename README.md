# 定投计算器

一个轻量级纯前端定投收益回测工具，支持预置股票、ETF 和指数的单笔买入测算与定投计划测算。

## 功能

- 选择预置标的，包括 A 股、ETF、美股指数和中证指数。
- 支持单笔买入收益测算。
- 支持每日、每周、每月定投回测。
- 每日定投只按交易日买入。
- 展示总投入、期末资产、收益、收益率、简化年化收益率和资产曲线。
- 静态数据随前端一起部署，适合 Netlify 静态站点。

## 技术栈

- Vite
- React
- TypeScript
- Ant Design v5
- ECharts
- Vitest
- Python + AKShare/Yahoo Finance/CSIndex 数据脚本

## 本地开发

```bash
npm install
npm run dev
```

## 更新数据

```bash
npm run update-data
```

数据脚本会优先尝试 AKShare，并在当前环境不可用时回退到可用的数据源。生成文件位于 `public/data`。

## 构建

```bash
npm run build
```

Netlify 配置已写入 `netlify.toml`，发布目录为 `dist`。

## 注意

历史回测仅供研究和演示，不构成投资建议。
