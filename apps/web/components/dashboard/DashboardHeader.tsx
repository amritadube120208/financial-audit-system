"use client";

import React, { useState } from "react";
import { Download, AlertTriangle, ShieldCheck, Clock, Hash, GitBranch, Loader2 } from "lucide-react";
import { AuditSummary } from "../../lib/types/api";
import { StatusBadge } from "../system/StatusBadge";
import { downloadAuditExport } from "../../lib/api/audits";
import { truncateHash } from "../../lib/utils/formatters";

interface DashboardHeaderProps {
  summary: AuditSummary;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ summary }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format = "csv") => {
    setIsExporting(true);
    try {
      await downloadAuditExport(summary.run_id, format);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Degraded State Banner */}
      {summary.analysis_mode === "DEGRADED" && (
        <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-4 shadow-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900">
            <h4 className="font-bold text-amber-950">
              Analysis Completed with Limited Detector Availability
            </h4>
            <p className="mt-0.5 text-amber-800">
              One or more secondary analysis engines were unavailable during this execution window. Remaining active detectors have had their weights dynamically renormalized to maintain audit queue integrity.
            </p>
          </div>
        </div>
      )}

      {/* Recovery State Banner */}
      {summary.analysis_mode === "RECOVERY" && (
        <div className="rounded-xl border border-indigo-300 bg-indigo-50/80 p-4 shadow-sm flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-indigo-900">
            <h4 className="font-bold text-indigo-950">
              Verified Recovery Snapshot
            </h4>
            <p className="mt-0.5 text-indigo-800 font-mono">
              Dataset Hash: {summary.dataset_sha256} | Pipeline: {summary.pipeline_version}
            </p>
          </div>
        </div>
      )}

      {/* Main Header Panel */}
      <div className="bg-white border border-border rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {summary.audit_name}
            </h1>
            <StatusBadge type="status" value={summary.status} />
            <StatusBadge type="mode" value={summary.analysis_mode} />
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-mono">
            <span className="flex items-center gap-1.5" title={summary.run_id}>
              <span>Run ID:</span>
              <strong className="text-slate-700 font-semibold">{summary.run_id}</strong>
            </span>

            <span className="flex items-center gap-1.5" title={summary.dataset_sha256}>
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              <span>SHA-256:</span>
              <span className="text-slate-700">{truncateHash(summary.dataset_sha256)}</span>
            </span>

            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Duration:</span>
              <span className="text-slate-700 font-semibold">{summary.analysis_duration_ms} ms</span>
            </span>

            <span className="flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-slate-400" />
              <span>Pipeline:</span>
              <span className="text-slate-700">{summary.pipeline_version}</span>
            </span>
          </div>
        </div>

        {/* Action: Export Report */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => handleExport("csv")}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export Investigation Report</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
