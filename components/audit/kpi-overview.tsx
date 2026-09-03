import { FileText, AlertTriangle, ShieldAlert, AlertCircle, Coins, Clock } from "lucide-react";
import type { RunMetrics } from "@/lib/types";
import { formatINR, formatNumber } from "@/lib/utils";

interface KpiOverviewProps {
  metrics: RunMetrics;
}

export function KpiOverview({ metrics }: KpiOverviewProps) {
  const cards = [
    {
      label: "Transactions Analyzed",
      value: formatNumber(metrics.total_transactions),
      subtext: "Complete corpus ingestion",
      icon: FileText,
      color: "text-foreground",
      badgeColor: "bg-secondary text-muted-foreground",
    },
    {
      label: "Suspicious Transactions",
      value: formatNumber(metrics.suspicious_transactions),
      subtext: "Flagged across >=1 detector",
      icon: AlertTriangle,
      color: "text-amber-400",
      badgeColor: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    },
    {
      label: "Raw Detector Flags",
      value: formatNumber(metrics.raw_detector_flags),
      subtext: "10 Rules + ML + Cycles",
      icon: AlertCircle,
      color: "text-indigo-400",
      badgeColor: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
    },
    {
      label: "Critical Investigations",
      value: formatNumber(metrics.critical_findings),
      subtext: "Score >= 80 (Immediate Review)",
      icon: ShieldAlert,
      color: "text-rose-400",
      badgeColor: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    },
    {
      label: "Identified Exposure",
      value: formatINR(metrics.total_exposure),
      subtext: "Aggregated monetary risk",
      icon: Coins,
      color: "text-emerald-400",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 my-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="p-5 rounded-xl border border-border/80 bg-card shadow-sm hover:border-border transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground">{card.label}</span>
              <div className={`p-1.5 rounded-md ${card.badgeColor}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight ${card.color}`}>
                {card.value}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 truncate">{card.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
