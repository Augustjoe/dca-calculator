import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import { GridComponent, TooltipComponent, LegendComponent } from "echarts/components";
import { LineChart } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";
import type { ChartPoint, InvestmentMode } from "../types";

echarts.use([GridComponent, TooltipComponent, LegendComponent, LineChart, CanvasRenderer]);

interface ValueChartProps {
  points: ChartPoint[];
  mode: InvestmentMode;
}

export function ValueChart({ points, mode }: ValueChartProps) {
  const chartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!chartRef.current) {
      return;
    }

    const chart = echarts.init(chartRef.current);
    const assetName = mode === "single" ? "持仓价值" : "资产价值";
    const investedName = mode === "single" ? "买入金额" : "累计投入";

    chart.setOption({
      animation: false,
      color: ["#107a64", "#315dd8"],
      tooltip: {
        trigger: "axis",
        valueFormatter: (value: unknown) =>
          typeof value === "number" ? `¥${Math.round(value).toLocaleString("zh-CN")}` : String(value),
      },
      legend: {
        right: 0,
        top: 0,
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: "#44504a" },
        data: [assetName, investedName],
      },
      grid: {
        left: 48,
        right: 18,
        top: 54,
        bottom: 34,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: points.map((point) => point.date),
        axisLabel: { color: "#66706a" },
        axisLine: { lineStyle: { color: "#dfe6df" } },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        name: "价值（元）",
        nameTextStyle: { color: "#66706a", align: "left" },
        axisLabel: {
          color: "#66706a",
          formatter: (value: number) => `${Math.round(value / 1000)}k`,
        },
        splitLine: { lineStyle: { color: "#edf1ec" } },
      },
      series: [
        {
          name: assetName,
          type: "line",
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 3 },
          areaStyle: { color: "rgba(16, 122, 100, 0.13)" },
          data: points.map((point) => Number(point.assetValue.toFixed(2))),
        },
        {
          name: investedName,
          type: "line",
          smooth: mode !== "dca",
          showSymbol: false,
          lineStyle: { width: 2 },
          data: points.map((point) => Number(point.invested.toFixed(2))),
        },
      ],
    });

    const resize = () => chart.resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      chart.dispose();
    };
  }, [mode, points]);

  return <div className="chart-surface" ref={chartRef} aria-label="资产曲线图" />;
}
