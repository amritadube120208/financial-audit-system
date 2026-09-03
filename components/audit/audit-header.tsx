import Link from "next/link";
import { Download, FileSpreadsheet, RefreshCw, ArrowRight } from "lucide-react";
import type { AuditSummaryResponse, AuditStatus } from "@/lib/types";
import { getExportUrl } from "@/lib/api";
import { formatDate } from "@/lib/utils";

interface AuditHeaderProps {
  runId: string;
  summary?: AuditSummaryResponse;
  status: AuditStatus;
  currentStage?: string;
  onRefresh?: () => void;
}

export function AuditHeader({ runId, summary, status, currentStage, onRefresh }: AuditHeaderProps) {
  const isReady = ["READY", "DEGRADED"].includes(status);
  const isDegraded = status === "DEGRADED";

  const statusColors: Record<AuditStatus, string> = {
    CREATED: "bg-slate-500/10 text-slate-400 border-slate-500/30",
    INGESTING: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    VALIDATING: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    FEATURIZING: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    DETECTING: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    SCORING: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    GROUPING: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    EXPLAINING: "bg-teal-500/10 text-teal-400 border-teal-500/30",
    PERSISTING: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    READY: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    DEGRADED: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    RECOVERING: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    FAILED: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  };

  return (
    <div className="border-b border-border/80 bg-card/40 pb-6 pt-6">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Audit Investigation
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="font-mono text-xs text-foreground bg-secondary px-2 py-0.5 rounded border border-border/80">
                {runId}
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full border font-mono font-medium flex items-center gap-1.5 ${
                  statusColors[status] || "bg-secondary text-foreground"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isReady ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
                  }`}
                />
                {status}
              </span>
              {isDegraded && (
                <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Renormalized Weights Mode
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
              {summary?.dataset?.filename || "SME Forensic Audit"}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              {summary?.dataset && (
                <span className="flex items-center gap-1.5 font-mono">
                  <FileSpreadsheet className="h-3.5 w-3.5 text-muted-foreground" />
                  Dataset: {summary.dataset.dataset_id}
                </span>
              )}
              {summary?.analysis_mode && (
                <span>Mode: <strong className="text-foreground capitalize">{summary.analysis_mode}</strong></span>
              )}
              {currentStage && !isReady && (
                <span className="text-amber-300 font-mono">Stage: {currentStage}</span>
              )}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 rounded-lg border border-border bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
                title="Refresh Audit Data"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}

            {isReady && (
              <>
                <a
                  href={getExportUrl(runId, "csv")}
                  download
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground px-3.5 py-2 text-xs font-semibold transition-all"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </a>
                <a
                  href={getExportUrl(runId, "json")}
                  download
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground px-3.5 py-2 text-xs font-semibold transition-all"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export JSON
                </a>
                <Link
                  href={`/audit/${runId}/transactions`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 text-xs font-semibold transition-all shadow-sm shadow-emerald-500/10"
                >
                  View Transactions
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
