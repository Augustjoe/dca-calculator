# UI 设计稿说明

本目录包含 A 股定投收益回测工具的第一版静态 UI 设计稿。

## 文件

- `01-desktop-single-buy.png`：桌面端单笔买入测算界面，包含计算参数、核心指标和价值变化曲线。
- `02-desktop-dca-plan.png`：桌面端定投计划测算界面，包含定投参数、累计投入、期末资产和资产曲线。
- `03-desktop-dca-detail.png`：桌面端定投计划详情界面，包含策略概览、回撤图和买入明细。
- `04-mobile-single-buy.png`：移动端单笔买入主界面。
- `mockups.html`：设计稿源文件，可直接用浏览器打开查看和调整。
- `export-mockups.mjs`：PNG 导出脚本。

## 设计方向

- 风格：简洁、清晰、偏工具型。
- 色彩：以白色和浅灰绿为底，使用绿色表示收益，蓝色表示本金曲线，少量琥珀色作为辅助提示。
- 布局：桌面端采用参数区、图表区、摘要区三栏；移动端采用上下堆叠。
- 功能：第一版支持“单笔买入”和“定投计划”两个模式，页面内统一使用“计算规则”说明计算方式。
- 图表：X 轴统一表示时间，Y 轴统一表示价值（元）。
- 卡片半径：控制在 8px，保持轻量数据工具的感觉。

## 重新导出

如果修改了 `mockups.html`，可运行：

```bash
node ui-designs/export-mockups.mjs
```

如果换到一台新电脑或删除了 `ui-designs/node_modules`，先运行：

```bash
cd ui-designs
npm install
npx playwright install chromium
cd ..
```
