import { ArrowDown, Filter } from "lucide-react";
import type { RunMetrics } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

interface RiskFunnelProps {
  metrics: RunMetrics;
}

export function RiskFunnel({ metrics }: RiskFunnelProps) {
  const total = metrics.total_transactions || 1;
  const rawFlags = metrics.raw_detector_flags || 0;
  const suspicious = metrics.suspicious_transactions || 0;
  const totalFindings =
    (metrics.critical_findings || 0) +
    (metrics.high_findings || 0) +
    (metrics.medium_findings || 0) +
    (metrics.low_findings || 0);
  const critical = metrics.critical_findings || 0;

  const stages = [
    {
      label: "Total Ledger Transactions",
      count: total,
      pct: 100,
      color: "bg-slate-500/20 text-slate-300 border-slate-500/30",
      barColor: "bg-slate-500",
    },
    {
      label: "Raw Detector Flags",
      count: rawFlags,
      pct: Math.min(100, Math.round((rawFlags / total) * 100 * 10) / 10),
      color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
      barColor: "bg-indigo-500",
    },
    {
      label: "Unique Suspicious Transactions",
      count: suspicious,
      pct: Math.min(100, Math.round((suspicious / total) * 100 * 10) / 10),
      color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      barColor: "bg-amber-500",
    },
    {
      label: "Ranked Investigation Findings",
      count: totalFindings,
      pct: Math.min(100, Math.round((totalFindings / total) * 100 * 10) / 10),
      color: "bg-teal-500/20 text-teal-300 border-teal-500/30",
      barColor: "bg-teal-500",
    },
    {
      label: "Critical Review Priority",
      count: critical,
      pct: Math.min(100, Math.round((critical / total) * 100 * 10) / 10),
      color: "bg-rose-500/20 text-rose-300 border-rose-500/30",
      barColor: "bg-rose-500",
    },
  ];

  return (
    <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Filter className="h-4 w-4 text-emerald-400" />
            Audit Triage Funnel
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            How 100k raw ledger rows are distilled down to high-conviction audit cases.
          </p>
        </div>
      </div>

      <div className="space-y-3.5">
        {stages.map((stage, idx) => (
          <div key={stage.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground flex items-center gap-2">
                <span className="text-[10px] font-mono text-muted-foreground w-4">0{idx + 1}</span>
                {stage.label}
              </span>
              <div className="flex items-center gap-2 font-mono">
                <span className="font-semibold text-foreground">{formatNumber(stage.count)}</span>
                <span className="text-muted-foreground text-[11px]">({stage.pct}%)</span>
              </div>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary/80 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${stage.barColor}`}
                style={{ width: `${Math.max(2, Math.min(100, stage.pct))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
