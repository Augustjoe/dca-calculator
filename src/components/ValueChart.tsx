import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import { DataZoomComponent, GridComponent, LegendComponent, TooltipComponent } from "echarts/components";
import { LineChart } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";
import type { ChartPoint, InvestmentMode } from "../types";

echarts.use([DataZoomComponent, GridComponent, TooltipComponent, LegendComponent, LineChart, CanvasRenderer]);

interface ValueChartProps {
  points: ChartPoint[];
  mode: InvestmentMode;
  className?: string;
  detailed?: boolean;
  showSingleDrawdown?: boolean;
}

type TooltipItem = {
  axisValue?: string;
  marker?: string;
  seriesName?: string;
  value?: number;
};

export function ValueChart({
  points,
  mode,
  className = "chart-surface",
  detailed = false,
  showSingleDrawdown = false,
}: ValueChartProps) {
  const chartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);
    const isSingle = mode === "single";
    const showComparison = !isSingle || showSingleDrawdown;
    const assetName = isSingle ? "持仓价值" : "资产市值";
    const comparisonName = isSingle ? "最大回撤" : "标的走势";
    const series = [
      {
        name: assetName,
        type: "line",
        yAxisIndex: 0,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: detailed ? 3 : 2.6 },
        areaStyle: { color: "rgba(16, 122, 100, 0.12)" },
        data: points.map((point) => Number(point.assetValue.toFixed(2))),
      },
      ...(showComparison
        ? [
            {
              name: comparisonName,
              type: "line",
              yAxisIndex: 1,
              smooth: !isSingle,
              step: isSingle ? "end" : false,
              showSymbol: false,
              lineStyle: { width: 2, type: isSingle ? "dashed" : "solid" },
              areaStyle: isSingle ? { color: "rgba(210, 107, 47, 0.08)" } : undefined,
              data: points.map((point) => Number((isSingle ? point.maxDrawdown * 100 : point.price).toFixed(2))),
            },
          ]
        : []),
    ];

    chart.setOption({
      animation: false,
      color: isSingle ? ["#107a64", "#d26b2f"] : ["#107a64", "#315dd8"],
      tooltip: {
        trigger: "axis",
        formatter: (items: unknown) => formatTooltip(items),
      },
      legend: {
        right: 0,
        top: 0,
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: "#44504a" },
        data: showComparison ? [assetName, comparisonName] : [assetName],
      },
      grid: {
        left: detailed ? 58 : 48,
        right: showComparison ? (detailed ? 42 : 34) : detailed ? 28 : 18,
        top: 54,
        bottom: detailed ? 76 : 34,
      },
      dataZoom: detailed
        ? [
            { type: "inside", throttle: 50 },
            {
              type: "slider",
              height: 24,
              bottom: 18,
              borderColor: "#dfe6df",
              fillerColor: "rgba(16, 122, 100, 0.14)",
              handleStyle: { color: "#107a64" },
              textStyle: { color: "#66706a" },
            },
          ]
        : [],
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: points.map((point) => point.date),
        axisLabel: { color: "#66706a" },
        axisLine: { lineStyle: { color: "#dfe6df" } },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: "value",
          name: isSingle ? "持仓价值（元）" : "资产市值（元）",
          nameTextStyle: { color: "#66706a", align: "left" },
          axisLabel: {
            color: "#66706a",
            formatter: (value: number) => `${Math.round(value / 1000)}k`,
          },
          splitLine: { lineStyle: { color: "#edf1ec" } },
        },
        {
          type: "value",
          name: isSingle ? "最大回撤" : "标的价格",
          max: isSingle ? 0 : undefined,
          show: showComparison,
          nameTextStyle: { color: "#66706a", align: "right" },
          axisLabel: {
            color: "#66706a",
            formatter: (value: number) =>
              isSingle ? `${value.toFixed(0)}%` : Number(value).toLocaleString("zh-CN", { maximumFractionDigits: 0 }),
          },
          splitLine: { show: false },
        },
      ],
      series,
    });

    const resize = () => chart.resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      chart.dispose();
    };
  }, [detailed, mode, points, showSingleDrawdown]);

  return <div className={className} ref={chartRef} aria-label="资产曲线图" />;
}

function formatTooltip(items: unknown) {
  if (!Array.isArray(items)) return "";

  const rows = (items as TooltipItem[])
    .map((item) => {
      const numericValue = Number(item.value ?? 0);
      const value =
        item.seriesName === "最大回撤"
          ? `${numericValue.toFixed(2)}%`
          : item.seriesName === "标的走势"
            ? numericValue.toLocaleString("zh-CN", { maximumFractionDigits: 2 })
            : `¥${Math.round(numericValue).toLocaleString("zh-CN")}`;
      return `${item.marker ?? ""}${item.seriesName ?? ""}&nbsp;&nbsp;<strong>${value}</strong>`;
    })
    .join("<br/>");

  return `${(items[0] as TooltipItem)?.axisValue ?? ""}<br/>${rows}`;
}
