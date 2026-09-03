"use client";

import React from "react";
import {
  Layers,
  Banknote,
  Flag,
  AlertOctagon,
  TrendingDown,
  ShieldAlert,
  SearchCheck,
} from "lucide-react";
import { AuditSummary } from "../../lib/types/api";
import { formatINR, formatCompactINR, formatNumber } from "../../lib/utils/formatters";

interface KpiCardsProps {
  summary: AuditSummary;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ summary }) => {
  return (
    <div className="space-y-4">
      {/* Primary 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Transactions */}
        <div className="bg-white border border-border rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Transactions Analyzed
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
            {formatNumber(summary.transaction_count)}
          </div>
          <p className="text-[11px] text-slate-500">Full general ledger coverage</p>
        </div>

        {/* Total Ledger Value */}
        <div className="bg-white border border-border rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Ledger Value
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight" title={formatINR(summary.total_value_inr)}>
            {formatCompactINR(summary.total_value_inr)}
          </div>
          <p className="text-[11px] text-slate-500">Cumulative voucher debits & credits</p>
        </div>

        {/* Initial Detector Flags */}
        <div className="bg-white border border-border rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Initial Detector Flags
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Flag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700 tracking-tight">
            {formatNumber(summary.initial_flags)}
          </div>
          <p className="text-[11px] text-slate-500">Aggregated across all 4 detectors</p>
        </div>

        {/* Unique Suspicious Transactions */}
        <div className="bg-white border border-border rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Suspicious Vouchers
            </span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <SearchCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
            {formatNumber(summary.unique_flagged_transactions)}
          </div>
          <p className="text-[11px] text-slate-500">Distinct deduplicated transactions</p>
        </div>
      </div>

      {/* Triage Volume Reduction & Severity Breakdown Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Triage Volume Reduction Banner */}
        <div className="lg:col-span-2 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Triage-Volume Reduction: {summary.triage_reduction_pct}%
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-100">
              Manual triage reduced from {formatNumber(summary.transaction_count)} rows to{" "}
              {summary.critical + summary.high + summary.medium + summary.low} prioritized investigations.
            </p>
            <p className="text-xs text-slate-400">
              Eliminates sampling noise and allows audit teams to focus on highest-risk material variances.
            </p>
          </div>

          <div className="text-right sm:border-l sm:border-slate-800 sm:pl-6 flex-shrink-0">
            <div className="text-3xl font-black font-mono text-emerald-400">
              {summary.critical}
            </div>
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              Critical Cases
            </div>
          </div>
        </div>

        {/* Severity Count Grid */}
        <div className="bg-white border border-border rounded-xl p-4 shadow-sm grid grid-cols-4 gap-2 text-center">
          <div className="p-2 rounded-lg bg-red-50/80 border border-red-100">
            <div className="text-lg font-bold font-mono text-red-700">{summary.critical}</div>
            <div className="text-[10px] font-semibold uppercase text-red-800">Critical</div>
          </div>
          <div className="p-2 rounded-lg bg-orange-50/80 border border-orange-100">
            <div className="text-lg font-bold font-mono text-orange-700">{summary.high}</div>
            <div className="text-[10px] font-semibold uppercase text-orange-800">High</div>
          </div>
          <div className="p-2 rounded-lg bg-amber-50/80 border border-amber-100">
            <div className="text-lg font-bold font-mono text-amber-800">{summary.medium}</div>
            <div className="text-[10px] font-semibold uppercase text-amber-900">Medium</div>
          </div>
          <div className="p-2 rounded-lg bg-emerald-50/80 border border-emerald-100">
            <div className="text-lg font-bold font-mono text-emerald-700">{summary.low}</div>
            <div className="text-[10px] font-semibold uppercase text-emerald-800">Low</div>
          </div>
        </div>
      </div>
    </div>
  );
};
