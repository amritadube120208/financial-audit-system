"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { RunMetrics } from "@/lib/types";

interface SeverityChartProps {
  metrics: RunMetrics;
}

const COLORS = {
  Critical: "#ef4444",
  High: "#f97316",
  Medium: "#eab308",
  Low: "#3b82f6",
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
    <div className="p-6 rounded-2xl border border-border bg-card shadow-sm flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Severity Distribution</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Stratification of findings by risk urgency and monetary impact.
        </p>
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
                  <Cell key={`cell-${entry.name}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#f8fafc",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
            No severity distribution available
          </div>
        )}
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
            <span className="font-mono font-semibold text-foreground">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
