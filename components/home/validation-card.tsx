import { CheckCircle, AlertTriangle, FileCode, Hash, Layers, ArrowRight } from "lucide-react";
import type { DatasetUploadResponse } from "@/lib/types";
import { formatBytes, formatNumber } from "@/lib/utils";

interface ValidationCardProps {
  dataset: DatasetUploadResponse;
  isStartingRun: boolean;
  onStartAudit: () => void;
}

export function ValidationCard({ dataset, isStartingRun, onStartAudit }: ValidationCardProps) {
  const mappingEntries = Object.entries(dataset.canonical_mapping || {});

  return (
    <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <h2 className="text-base font-semibold text-foreground">Dataset Verified & Fingerprinted</h2>
            <span className="text-xs px-2 py-0.5 rounded font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {dataset.schema_status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            ID: {dataset.dataset_id} • SHA-256: {dataset.sha256.slice(0, 16)}...
          </p>
        </div>

        <button
          onClick={onStartAudit}
          disabled={isStartingRun}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2.5 text-sm font-semibold transition-all shadow-sm disabled:opacity-50"
        >
          {isStartingRun ? (
            <>
              <span className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              Initializing Pipeline...
            </>
          ) : (
            <>
              Execute Audit Run
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      {/* Dataset Metadata Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-border/60 text-xs">
        <div>
          <span className="text-muted-foreground block">File Name</span>
          <span className="font-medium text-foreground mt-0.5 block truncate" title={dataset.filename}>
            {dataset.filename}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground block">Total Rows</span>
          <span className="font-semibold text-foreground mt-0.5 block font-mono">
            {formatNumber(dataset.row_count)} rows
          </span>
        </div>
        <div>
          <span className="text-muted-foreground block">Total Columns</span>
          <span className="font-semibold text-foreground mt-0.5 block font-mono">
            {dataset.column_count} columns
          </span>
        </div>
        <div>
          <span className="text-muted-foreground block">File Size & Format</span>
          <span className="font-medium text-foreground mt-0.5 block">
            {formatBytes(dataset.size_bytes)} ({dataset.detected_format.toUpperCase()})
          </span>
        </div>
      </div>

      {/* Warnings if any */}
      {dataset.warnings && dataset.warnings.length > 0 && (
        <div className="my-4 p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/5 text-amber-300 text-xs flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block">Schema Coercion Warnings:</span>
            <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
              {dataset.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Canonical Schema Mapping Table */}
      <div className="mt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5" /> Canonical Schema Mapping
        </h3>
        <div className="max-h-48 overflow-y-auto rounded-lg border border-border/80 bg-background/50">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/60 text-muted-foreground uppercase text-[10px] tracking-wider sticky top-0 border-b border-border/60">
              <tr>
                <th className="py-2 px-3">Source Header</th>
                <th className="py-2 px-3">Canonical Field</th>
                <th className="py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-mono">
              {mappingEntries.map(([source, canonical]) => (
                <tr key={source} className="hover:bg-secondary/30 transition-colors">
                  <td className="py-1.5 px-3 text-foreground">{source}</td>
                  <td className="py-1.5 px-3 text-emerald-400 font-semibold">{canonical}</td>
                  <td className="py-1.5 px-3 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1 text-emerald-400">
                      <CheckCircle className="h-3 w-3" /> Mapped
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
