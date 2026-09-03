import { FileText, AlertTriangle, ShieldAlert, AlertCircle, Coins } from "lucide-react";
import type { RunMetrics } from "@/lib/types";
import { formatINR, formatNumber } from "@/lib/utils";

interface KpiOverviewProps {
  metrics: RunMetrics;
}

export function KpiOverview({ metrics }: KpiOverviewProps) {
  const m = metrics as any;
  const totalTxns = metrics.total_transactions ?? m.transactions_analyzed ?? 0;
  const suspicious = metrics.suspicious_transactions ?? m.unique_suspicious_transactions ?? 0;
  const rawFlags = metrics.raw_detector_flags ?? 0;
  const critical = metrics.critical_findings ?? 0;
  const exposure = metrics.total_exposure ?? m.monetary_exposure_inr ?? 0;

  const cards = [
    {
      label: "TRANSACTIONS ANALYZED",
      value: formatNumber(totalTxns),
      subtext: "Complete corpus ingestion",
      icon: FileText,
      valueColor: "text-[#EDE7DC]",
      dotColor: "bg-[#2E6B72]",
    },
    {
      label: "SUSPICIOUS TRANSACTIONS",
      value: formatNumber(suspicious),
      subtext: "Flagged across >=1 detector",
      icon: AlertTriangle,
      valueColor: "text-[#E8913C]",
      dotColor: "bg-[#E8913C]",
    },
    {
      label: "RAW DETECTOR FLAGS",
      value: formatNumber(rawFlags),
      subtext: "10 Rules + ML + Cycles",
      icon: AlertCircle,
      valueColor: "text-[#9EA5A8]",
      dotColor: "bg-[#6C7378]",
    },
    {
      label: "CRITICAL FINDINGS",
      value: formatNumber(critical),
      subtext: "Score >= 80 (Immediate Review)",
      icon: ShieldAlert,
      valueColor: "text-[#E8913C]",
      dotColor: "bg-[#E8913C]",
    },
    {
      label: "IDENTIFIED EXPOSURE",
      value: formatINR(exposure),
      subtext: "Aggregated monetary risk",
      icon: Coins,
      valueColor: "text-[#EDE7DC]",
      dotColor: "bg-[#2E6B72]",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 my-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="p-5 rounded-sm border border-[rgba(237,231,220,0.13)] bg-[#101317] hover:border-[rgba(237,231,220,0.25)] transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-[#6C7378]">
                {card.label}
              </span>
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${card.dotColor}`} />
                <Icon className="h-3.5 w-3.5 text-[#6C7378]" />
              </div>
            </div>
            <div>
              <div className={`text-2xl sm:text-3xl font-display font-bold tracking-tight ${card.valueColor}`}>
                {card.value}
              </div>
              <p className="text-[11px] font-body text-[#9EA5A8] mt-1 truncate">{card.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
