"use client";

import Link from "next/link";
import { X, ExternalLink, ShieldAlert, FileText, ArrowRight, Layers, Coins } from "lucide-react";
import type { FindingItem, Severity } from "@/lib/types";
import { formatINR } from "@/lib/utils";

interface FindingDrawerProps {
  finding: FindingItem | null;
  isOpen: boolean;
  onClose: () => void;
  runId: string;
}

const SEVERITY_BADGES: Record<Severity, string> = {
  critical: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  high: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  low: "bg-blue-500/10 text-blue-400 border-blue-500/30",
};

export function FindingDrawer({ finding, isOpen, onClose, runId }: FindingDrawerProps) {
  if (!isOpen || !finding) return null;

  const badge = SEVERITY_BADGES[finding.severity] || SEVERITY_BADGES.medium;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-card border-l border-border h-full overflow-y-auto flex flex-col p-6 shadow-2xl">
        {/* Drawer Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-border/80">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${badge}`}>
                {finding.severity}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                Score: <strong className="text-foreground">{finding.risk_score}</strong>/100
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-secondary font-mono text-muted-foreground">
                {finding.anomaly_type}
              </span>
            </div>
            <h2 className="text-lg font-bold text-foreground leading-snug">{finding.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-3 gap-3 py-4 border-b border-border/60 text-xs">
          <div>
            <span className="text-muted-foreground block">Exposure Amount</span>
            <span className="text-base font-bold font-mono text-emerald-400 mt-0.5 block">
              {formatINR(finding.monetary_exposure)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block">Primary Entity</span>
            <span className="font-mono font-medium text-foreground mt-0.5 block truncate">
              {finding.primary_entity || "N/A"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block">Involved Transactions</span>
            <span className="font-mono font-medium text-foreground mt-0.5 block">
              {finding.transaction_count} entries
            </span>
          </div>
        </div>

        {/* Auditor Explanation */}
        <div className="py-4 border-b border-border/60">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Auditor Narrative
          </h3>
          <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed bg-secondary/30 p-3 rounded-lg border border-border/60">
            {finding.explanation}
          </p>
          <div className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Detector Family: <strong>{finding.detector_family}</strong></span>
          </div>
        </div>

        {/* Evidence Package */}
        <div className="py-4 border-b border-border/60 flex-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" /> Verifiable Evidence Package ({finding.evidence?.length || 0})
          </h3>
          {finding.evidence && finding.evidence.length > 0 ? (
            <div className="space-y-2">
              {finding.evidence.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-border/80 bg-background/50 text-xs space-y-1 font-mono"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">{item.label || item.key}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground uppercase border border-border/60">
                      {item.source}
                    </span>
                  </div>
                  <div className="text-emerald-400 font-semibold text-xs break-all">
                    {String(item.value)} {item.unit ? `(${item.unit})` : ""}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No granular evidence items attached.</p>
          )}
        </div>

        {/* Transaction IDs with link to Transaction page */}
        <div className="pt-4 mt-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">
              Corpus Transaction References ({finding.transaction_ids?.length || 0})
            </span>
            <Link
              href={`/audit/${runId}/transactions?search=${encodeURIComponent(
                finding.primary_entity || ""
              )}`}
              onClick={onClose}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1"
            >
              View In Transactions <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {finding.transaction_ids?.map((txId) => (
              <span
                key={txId}
                className="px-2 py-0.5 rounded font-mono text-[11px] bg-secondary text-muted-foreground border border-border/70"
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
