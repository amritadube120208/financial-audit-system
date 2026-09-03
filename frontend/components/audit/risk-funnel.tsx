import { Filter } from "lucide-react";
import type { RunMetrics } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

interface RiskFunnelProps {
  metrics: RunMetrics;
}

export function RiskFunnel({ metrics }: RiskFunnelProps) {
  const total = metrics.total_transactions ?? 0;
  const rawFlags = metrics.raw_detector_flags ?? 0;
  const suspicious = metrics.suspicious_transactions ?? 0;
  const critical = metrics.critical_findings ?? 0;
  const high = metrics.high_findings ?? 0;
  const medium = metrics.medium_findings ?? 0;
  const low = metrics.low_findings ?? 0;
  const totalFindings = critical + high + medium + low;

  const stages = [
    {
      label: "TOTAL LEDGER TRANSACTIONS",
      count: total,
      pct: 100,
      barColor: "bg-[#EDE7DC]",
    },
    {
      label: "RAW DETECTOR FLAGS",
      count: rawFlags,
      pct: total > 0 ? Math.min(100, Math.round((rawFlags / total) * 100 * 10) / 10) : 0,
      barColor: "bg-[#6C7378]",
    },
    {
      label: "UNIQUE SUSPICIOUS TRANSACTIONS",
      count: suspicious,
      pct: total > 0 ? Math.min(100, Math.round((suspicious / total) * 100 * 10) / 10) : 0,
      barColor: "bg-[#2E6B72]",
    },
    {
      label: "RANKED INVESTIGATION FINDINGS",
      count: totalFindings,
      pct: total > 0 ? Math.min(100, Math.round((totalFindings / total) * 100 * 10) / 10) : 0,
      barColor: "bg-[#E8913C]",
    },
    {
      label: "CRITICAL REVIEW PRIORITY",
      count: critical,
      pct: total > 0 ? Math.min(100, Math.round((critical / total) * 100 * 10) / 10) : 0,
      barColor: "bg-[#E8913C]",
    },
  ];

  return (
    <div className="p-6 rounded-sm border border-[rgba(237,231,220,0.13)] bg-[#101317]">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E8913C]" />
            <span className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-[#6C7378]">
              SAMPLE PRUNING PIPELINE
            </span>
          </div>
          <h3 className="font-display font-bold text-base text-[#EDE7DC] mt-0.5 tracking-tight">
            Audit Triage Funnel
          </h3>
        </div>
      </div>

      <div className="space-y-4 font-mono">
        {stages.map((stage, idx) => (
          <div key={stage.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#EDE7DC] flex items-center gap-2 font-medium">
                <span className="text-[10px] text-[#6C7378] w-4">0{idx + 1}</span>
                {stage.label}
              </span>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-[#EDE7DC]">{formatNumber(stage.count)}</span>
                <span className="text-[#6C7378] text-[11px]">({stage.pct}%)</span>
              </div>
            </div>
            <div className="h-1.5 w-full rounded-sm bg-[#0A0C0E] border border-[rgba(237,231,220,0.08)] overflow-hidden">
              <div
                className={`h-full rounded-sm transition-all duration-300 ${stage.barColor}`}
                style={{ width: `${Math.max(1, Math.min(100, stage.pct))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
