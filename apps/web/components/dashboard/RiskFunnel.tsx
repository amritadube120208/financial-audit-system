"use client";

import React from "react";
import { ArrowDown, Filter, Layers, Flag, Search, CheckCircle, ShieldAlert } from "lucide-react";
import { AuditSummary } from "../../lib/types/api";
import { formatNumber } from "../../lib/utils/formatters";

interface RiskFunnelProps {
  summary: AuditSummary;
}

export const RiskFunnel: React.FC<RiskFunnelProps> = ({ summary }) => {
  const totalFindings = summary.critical + summary.high + summary.medium + summary.low;

  const funnelSteps = [
    {
      label: "Ledger Transactions",
      count: summary.transaction_count,
      pctWidth: "100%",
      bg: "bg-slate-800 text-white",
      icon: Layers,
      sub: "Exhaustive general ledger ingest",
    },
    {
      label: "Initial Detector Flags",
      count: summary.initial_flags,
      pctWidth: "82%",
      bg: "bg-slate-700 text-slate-100",
      icon: Flag,
      sub: "Triggers across Rules, ML, and Graph",
    },
    {
      label: "Unique Suspicious Transactions",
      count: summary.unique_flagged_transactions,
      pctWidth: "64%",
      bg: "bg-indigo-700 text-white",
      icon: Search,
      sub: "Deduplicated voucher candidates",
    },
    {
      label: "Prioritized Audit Cases",
      count: totalFindings,
      pctWidth: "46%",
      bg: "bg-amber-600 text-white",
      icon: CheckCircle,
      sub: "Multi-engine fused risk queue",
    },
    {
      label: "Critical Investigations",
      count: summary.critical,
      pctWidth: "28%",
      bg: "bg-red-600 text-white shadow-lg",
      icon: ShieldAlert,
      sub: "High-priority circular flow & fraud red flags",
    },
  ];

  return (
    <div className="bg-white border border-border rounded-xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Filter className="w-4 h-4 text-brand-600" />
            Statutory Audit Triage Risk Funnel
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Progressive data reduction from raw ledger rows to prioritized auditor investigative cases
          </p>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
          {summary.triage_reduction_pct}% triage-volume reduction
        </span>
      </div>

      {/* Visual Step-Down Funnel */}
      <div className="flex flex-col items-center space-y-2.5 py-2">
        {funnelSteps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <React.Fragment key={step.label}>
              <div
                className={`rounded-xl px-5 py-3.5 flex items-center justify-between transition-all duration-300 ${step.bg}`}
                style={{ width: step.pctWidth, minWidth: "260px" }}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 flex-shrink-0 opacity-80" />
                  <div>
                    <div className="text-xs font-bold tracking-tight">{step.label}</div>
                    <div className="text-[10px] opacity-75">{step.sub}</div>
                  </div>
                </div>

                <div className="text-base font-black font-mono tracking-tight pl-4">
                  {formatNumber(step.count)}
                </div>
              </div>

              {idx < funnelSteps.length - 1 && (
                <div className="flex items-center justify-center text-slate-400">
                  <ArrowDown className="w-3.5 h-3.5" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Reduction Message Callout */}
      <div className="pt-2 border-t border-slate-100 text-center text-xs text-slate-600">
        Manual triage reduced from <strong className="font-mono font-bold text-slate-900">{formatNumber(summary.transaction_count)}</strong> rows to{" "}
        <strong className="font-mono font-bold text-slate-900">{totalFindings}</strong> prioritized investigations (
        <strong className="text-red-600 font-bold">{summary.critical} critical</strong>).
      </div>
    </div>
  );
};
