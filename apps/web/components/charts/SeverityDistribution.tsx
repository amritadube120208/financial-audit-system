"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { BarChart3, PieChart } from "lucide-react";
import { AuditSummary, Severity } from "../../lib/types/api";
import { useUiStore } from "../../stores/useUiStore";
import { formatNumber } from "../../lib/utils/formatters";

interface SeverityDistributionProps {
  summary: AuditSummary;
}

export const SeverityDistribution: React.FC<SeverityDistributionProps> = ({ summary }) => {
  const { selectedSeverity, setSelectedSeverity } = useUiStore();

  const total = summary.critical + summary.high + summary.medium + summary.low || 1;

  const data = [
    {
      name: "CRITICAL",
      label: "Critical (85–100)",
      count: summary.critical,
      pct: ((summary.critical / total) * 100).toFixed(1),
      color: "#DC2626",
    },
    {
      name: "HIGH",
      label: "High (70–84)",
      count: summary.high,
      pct: ((summary.high / total) * 100).toFixed(1),
      color: "#EA580C",
    },
    {
      name: "MEDIUM",
      label: "Medium (40–69)",
      count: summary.medium,
      pct: ((summary.medium / total) * 100).toFixed(1),
      color: "#F59E0B",
    },
    {
      name: "LOW",
      label: "Low (0–39)",
      count: summary.low,
      pct: ((summary.low / total) * 100).toFixed(1),
      color: "#10B981",
    },
  ];

  return (
    <div className="bg-white border border-border rounded-xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand-600" />
            Risk Severity Distribution
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Click any severity bucket to filter the findings investigation queue
          </p>
        </div>

        {selectedSeverity !== "ALL" && (
          <button
            onClick={() => setSelectedSeverity("ALL")}
            className="text-xs text-brand-600 hover:text-brand-700 font-semibold underline underline-offset-2"
          >
            Clear Filter (Show All)
          </button>
        )}
      </div>

      {/* Recharts Bar Chart */}
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 75, bottom: 5 }}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fontWeight: 600, fill: "#475569" }}
            />
            <Tooltip
              formatter={(val: number) => [`${val} findings (${((val / total) * 100).toFixed(1)}%)`, "Count"]}
              contentStyle={{
                backgroundColor: "#0F172A",
                color: "#FFFFFF",
                borderRadius: "8px",
                fontSize: "12px",
                border: "none",
              }}
            />
            <Bar
              dataKey="count"
              radius={[0, 6, 6, 0]}
              className="cursor-pointer"
              onClick={(entry) => {
                if (entry && entry.name) {
                  setSelectedSeverity(
                    selectedSeverity === entry.name ? "ALL" : (entry.name as Severity)
                  );
                }
              }}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.color}
                  opacity={selectedSeverity === "ALL" || selectedSeverity === entry.name ? 1 : 0.3}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Interactive Severity Segment Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
        {data.map((item) => {
          const isSelected = selectedSeverity === item.name;
          return (
            <button
              key={item.name}
              type="button"
              onClick={() =>
                setSelectedSeverity(isSelected ? "ALL" : (item.name as Severity))
              }
              className={`p-2.5 rounded-lg border text-left transition-all ${
                isSelected
                  ? "ring-2 ring-brand-500 border-transparent shadow-sm"
                  : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">{item.name}</span>
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-base font-black font-mono text-slate-900">
                  {formatNumber(item.count)}
                </span>
                <span className="text-[10px] text-slate-500">({item.pct}%)</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
