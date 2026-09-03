"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { RunMetrics } from "@/lib/types";

interface SeverityChartProps {
  metrics: RunMetrics;
}

const COLORS = {
  Critical: "#E8913C",
  High: "#EDE7DC",
  Medium: "#2E6B72",
  Low: "#6C7378",
};

export function SeverityChart({ metrics }: SeverityChartProps) {
  const data = [
    { name: "Critical", value: metrics.critical_findings || 0, color: COLORS.Critical },
    { name: "High", value: metrics.high_findings || 0, color: COLORS.High },
    { name: "Medium", value: metrics.medium_findings || 0, color: COLORS.Medium },
    { name: "Low", value: metrics.low_findings || 0, color: COLORS.Low },
  ].filter((item) => item.value > 0);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="p-6 rounded-sm border border-[rgba(237,231,220,0.13)] bg-[#101317] flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#2E6B72]" />
          <span className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-[#6C7378]">
            SEVERITY STRATIFICATION
          </span>
        </div>
        <h3 className="font-display font-bold text-base text-[#EDE7DC] mt-0.5 tracking-tight">
          Risk Urgency Breakdown
        </h3>
      </div>

      <div className="h-48 w-full my-2">
        {total > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={entry.color} stroke="#0A0C0E" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0A0C0E",
                  borderColor: "rgba(237,231,220,0.2)",
                  borderRadius: "2px",
                  fontSize: "12px",
                  fontFamily: "var(--font-mono)",
                  color: "#EDE7DC",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs font-mono text-[#6C7378]">
            No severity distribution available
          </div>
        )}
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[rgba(237,231,220,0.1)] text-xs font-mono">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[#9EA5A8]">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
            <span className="font-bold text-[#EDE7DC]">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
