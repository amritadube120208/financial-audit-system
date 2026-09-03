"use client";

import { X, FileText, ArrowRight, Layers } from "lucide-react";
import type { FindingItem, Severity } from "@/lib/types";
import { formatINR } from "@/lib/utils";

interface FindingDrawerProps {
  finding: FindingItem | null;
  isOpen: boolean;
  onClose: () => void;
  runId: string;
}

const SEVERITY_BADGES: Record<Severity, string> = {
  critical: "bg-rose-50 text-rose-700 border-rose-200",
  high: "bg-amber-50 text-amber-700 border-amber-200",
  medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
  low: "bg-blue-50 text-blue-700 border-blue-200",
};

export function FindingDrawer({ finding, isOpen, onClose, runId }: FindingDrawerProps) {
  if (!isOpen || !finding) return null;

  const badge = SEVERITY_BADGES[finding.severity] || SEVERITY_BADGES.medium;

  const handleScrollToTransactions = () => {
    onClose();
    const el = document.getElementById("transactions");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-body">
      <div className="relative w-full max-w-xl bg-[#101317] border-l border-[rgba(237,231,220,0.13)] h-full overflow-y-auto flex flex-col p-6 shadow-2xl">
        {/* Drawer Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[rgba(237,231,220,0.1)]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase tracking-[0.12em] border ${
                finding.severity === "critical"
                  ? "text-[#E8913C] border-[#E8913C]/40 bg-[#E8913C]/10"
                  : "text-[#EDE7DC] border-[rgba(237,231,220,0.2)] bg-[#0A0C0E]"
              }`}>
                {finding.severity}
              </span>
              <span className="font-mono text-xs text-[#9EA5A8]">
                RISK: <strong className="text-[#E8913C]">{finding.risk_score}</strong>/100
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-sm bg-[#0A0C0E] font-mono text-[#6C7378] border border-[rgba(237,231,220,0.1)]">
                {finding.anomaly_type}
              </span>
            </div>
            <h2 className="font-display font-bold text-xl text-[#EDE7DC] leading-snug tracking-tight">{finding.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-sm border border-[rgba(237,231,220,0.13)] hover:border-[#E8913C] text-[#9EA5A8] hover:text-[#EDE7DC] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-3 gap-3 py-4 border-b border-[rgba(237,231,220,0.1)] text-xs font-mono">
          <div>
            <span className="text-[#6C7378] block text-[10.5px] uppercase tracking-[0.1em]">EXPOSURE AMOUNT</span>
            <span className="text-base font-bold text-[#E8913C] mt-0.5 block">
              {formatINR(finding.monetary_exposure)}
            </span>
          </div>
          <div>
            <span className="text-[#6C7378] block text-[10.5px] uppercase tracking-[0.1em]">PRIMARY ENTITY</span>
            <span className="font-medium text-[#EDE7DC] mt-0.5 block truncate">
              {finding.primary_entity || "N/A"}
            </span>
          </div>
          <div>
            <span className="text-[#6C7378] block text-[10.5px] uppercase tracking-[0.1em]">INVOLVED TXNS</span>
            <span className="font-medium text-[#EDE7DC] mt-0.5 block">
              {finding.transaction_count} entries
            </span>
          </div>
        </div>

        {/* Auditor Explanation */}
        <div className="py-4 border-b border-[rgba(237,231,220,0.1)]">
          <h3 className="text-xs font-mono uppercase tracking-[0.14em] text-[#6C7378] mb-2 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-[#E8913C]" /> AUDITOR NARRATIVE
          </h3>
          <p className="text-xs sm:text-sm text-[#EDE7DC] leading-relaxed bg-[#0A0C0E] p-4 rounded-sm border border-[rgba(237,231,220,0.1)]">
            {finding.explanation}
          </p>
          <div className="mt-2 text-[11px] font-mono text-[#9EA5A8] flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2E6B72]" />
            <span>Detector Family: <strong className="text-[#EDE7DC]">{finding.detector_family}</strong></span>
          </div>
        </div>

        {/* Evidence Package */}
        <div className="py-4 border-b border-[rgba(237,231,220,0.1)] flex-1">
          <h3 className="text-xs font-mono uppercase tracking-[0.14em] text-[#6C7378] mb-2 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-[#2E6B72]" /> VERIFIABLE EVIDENCE PACKAGE ({finding.evidence?.length || 0})
          </h3>
          {finding.evidence && finding.evidence.length > 0 ? (
            <div className="space-y-2">
              {finding.evidence.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-sm border border-[rgba(237,231,220,0.1)] bg-[#0A0C0E] text-xs space-y-1 font-mono"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#EDE7DC]">{item.label || item.key}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-[#101317] text-[#6C7378] uppercase border border-[rgba(237,231,220,0.1)]">
                      {item.source}
                    </span>
                  </div>
                  <div className="text-[#2E6B72] font-semibold text-xs break-all">
                    {String(item.value)} {item.unit ? `(${item.unit})` : ""}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs font-mono text-[#6C7378]">No granular evidence items attached.</p>
          )}
        </div>

        {/* Transaction IDs with link to Transaction section on SAME page */}
        <div className="pt-4 mt-auto">
          <div className="flex items-center justify-between mb-2 font-mono">
            <span className="text-xs text-[#6C7378] uppercase tracking-[0.1em]">
              CORPUS REFERENCES ({finding.transaction_ids?.length || 0})
            </span>
            <button
              onClick={handleScrollToTransactions}
              className="text-xs text-[#E8913C] hover:text-[#EDE7DC] font-semibold inline-flex items-center gap-1 transition-colors"
            >
              View In Transactions Table <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {finding.transaction_ids?.map((txId) => (
              <span
                key={txId}
                className="px-2 py-0.5 rounded-sm font-mono text-[11px] bg-[#0A0C0E] text-[#9EA5A8] border border-[rgba(237,231,220,0.1)]"
              >
                {txId}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
