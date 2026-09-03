"use client";

import React from "react";
import {
  X,
  ShieldAlert,
  Calendar,
  CreditCard,
  Building,
  FileText,
  AlertCircle,
  Network,
  ArrowRight,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { Finding } from "../../lib/types/api";
import { StatusBadge } from "../system/StatusBadge";
import { RiskBreakdown } from "./RiskBreakdown";
import { formatINR, formatDate } from "../../lib/utils/formatters";
import { useUiStore } from "../../stores/useUiStore";

interface FindingDetailDrawerProps {
  finding: Finding | null;
  onClose: () => void;
  onFocusGraph?: () => void;
}

export const FindingDetailDrawer: React.FC<FindingDetailDrawerProps> = ({
  finding,
  onClose,
  onFocusGraph,
}) => {
  const { setIsCopilotOpen } = useUiStore();

  if (!finding) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end transition-opacity">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-border bg-slate-50 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                {finding.finding_id}
              </span>
              <StatusBadge type="severity" value={finding.severity} />
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                {finding.rule_code}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
              {finding.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Close drawer"
            title="Close drawer"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Key Metric Strip */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
              <span className="text-[10px] uppercase font-semibold text-slate-500">
                Transaction Value
              </span>
              <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                {formatINR(finding.amount)}
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
              <span className="text-[10px] uppercase font-semibold text-slate-500">
                Triage Priority Score
              </span>
              <div className="text-lg font-bold font-mono text-brand-700 mt-0.5">
                {finding.risk_score} / 100
              </div>
            </div>
          </div>

          {/* Natural Language Explanation */}
          <div className="space-y-1.5 p-3.5 rounded-lg border border-brand-200 bg-brand-50/40 text-brand-950">
            <div className="flex items-center gap-1.5 font-bold text-brand-900 text-xs">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span>Auditor Intelligence Summary</span>
            </div>
            <p className="text-xs leading-relaxed text-brand-900/90">
              {finding.explanation}
            </p>
          </div>

          {/* WHY THIS WAS FLAGGED (Auditor Evidence Family) */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-red-500" />
              Why This Was Flagged
            </h3>

            <div className="space-y-2">
              {finding.evidence && finding.evidence.length > 0 ? (
                finding.evidence.map((ev, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-slate-200 bg-white shadow-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        {ev.description}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {ev.type}
                      </span>
                    </div>
                    {ev.value && (
                      <div className="font-mono text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded">
                        {ev.value}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-slate-400 italic">No direct sub-evidence recorded.</p>
              )}
            </div>
          </div>

          {/* Risk Fusion Breakdown */}
          <RiskBreakdown
            contributions={finding.detector_contributions}
            riskScore={finding.risk_score}
          />

          {/* Detailed Transaction Parameters */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Transaction Details
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/70 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-semibold">Transaction ID</span>
                <p className="font-mono font-semibold text-slate-900 mt-0.5">{finding.transaction_id}</p>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] uppercase font-semibold">Posting Date</span>
                <p className="font-medium text-slate-900 mt-0.5">{formatDate(finding.posting_date)}</p>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] uppercase font-semibold">Invoice Ref</span>
                <p className="font-mono font-medium text-slate-900 mt-0.5">{finding.invoice_number || "—"}</p>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] uppercase font-semibold">Counterparty</span>
                <p className="font-medium text-slate-900 mt-0.5 truncate" title={finding.vendor_name}>
                  {finding.vendor_name}
                </p>
              </div>

              <div className="col-span-2">
                <span className="text-slate-500 text-[10px] uppercase font-semibold">Debit Account</span>
                <p className="font-medium text-slate-900 mt-0.5">{finding.account_debit}</p>
              </div>

              <div className="col-span-2">
                <span className="text-slate-500 text-[10px] uppercase font-semibold">Credit Account</span>
                <p className="font-medium text-slate-900 mt-0.5">{finding.account_credit}</p>
              </div>

              <div className="col-span-2">
                <span className="text-slate-500 text-[10px] uppercase font-semibold">Ledger Narration</span>
                <p className="text-slate-700 italic mt-0.5">{finding.narration}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-border bg-slate-50 flex items-center justify-between gap-3">
          {onFocusGraph && (
            <button
              onClick={() => {
                onFocusGraph();
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Network className="w-3.5 h-3.5" />
              <span>Inspect Flow Graph</span>
            </button>
          )}

          <button
            onClick={() => setIsCopilotOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all ml-auto cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Ask Copilot About Finding</span>
          </button>
        </div>
      </div>
    </div>
  );
};
