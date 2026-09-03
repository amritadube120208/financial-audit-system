"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Settings2, Sliders, ShieldCheck, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { createAuditRun } from "../../lib/api/audits";
import { Dataset, AuditRunCreateRequest } from "../../lib/types/api";
import { ErrorEnvelopeAlert } from "../system/ErrorEnvelopeAlert";

interface AuditConfigPanelProps {
  dataset: Dataset;
}

export const AuditConfigPanel: React.FC<AuditConfigPanelProps> = ({ dataset }) => {
  const router = useRouter();

  const [auditName, setAuditName] = useState(
    `Statutory SME Audit — ${dataset.filename.replace(/\.[^/.]+$/, "")}`
  );
  const [fyStart, setFyStart] = useState("2025-04-01");
  const [fyEnd, setFyEnd] = useState("2026-03-31");
  const [materialityThreshold, setMaterialityThreshold] = useState<number>(50000);
  const [topK, setTopK] = useState<number>(50);

  const [detectors, setDetectors] = useState({
    rules: true,
    ml: true,
    graph: true,
    gst: false,
  });

  const [hardDeadlineMs, setHardDeadlineMs] = useState<number>(8000);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleStartAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsStarting(true);
    setError(null);

    const payload: AuditRunCreateRequest = {
      dataset_id: dataset.dataset_id,
      audit_name: auditName,
      fiscal_year_start: fyStart,
      fiscal_year_end: fyEnd,
      materiality_threshold_inr: materialityThreshold,
      top_k: topK,
      detectors,
      hard_deadline_ms: hardDeadlineMs,
    };

    try {
      const run = await createAuditRun(payload);
      router.push(`/audits/${run.run_id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error("Failed to start audit run"));
      setIsStarting(false);
    }
  };

  return (
    <form onSubmit={handleStartAudit} className="bg-white border border-border rounded-xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-brand-600" />
            Audit Parameters & Engine Configuration
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure statutory scopes, materiality benchmarks, and multi-engine detectors
          </p>
        </div>
      </div>

      {error && <ErrorEnvelopeAlert error={error} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
        {/* Audit Name */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="font-semibold text-slate-700">Audit Engagement Name</label>
          <input
            type="text"
            required
            value={auditName}
            onChange={(e) => setAuditName(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
          />
        </div>

        {/* Fiscal Year Start */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-700">Fiscal Period Start</label>
          <input
            type="date"
            value={fyStart}
            onChange={(e) => setFyStart(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
          />
        </div>

        {/* Fiscal Year End */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-700">Fiscal Period End</label>
          <input
            type="date"
            value={fyEnd}
            onChange={(e) => setFyEnd(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
          />
        </div>

        {/* Materiality Threshold */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-700">Materiality Threshold (INR ₹)</label>
          <input
            type="number"
            min="1000"
            step="1000"
            value={materialityThreshold}
            onChange={(e) => setMaterialityThreshold(Number(e.target.value))}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50 font-mono"
          />
          <p className="text-[11px] text-slate-500">Benchmark materiality limit for anomaly weight fusion</p>
        </div>

        {/* Top K Findings */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-700">Top Prioritized Findings (K)</label>
          <input
            type="number"
            min="10"
            max="500"
            value={topK}
            onChange={(e) => setTopK(Number(e.target.value))}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50 font-mono"
          />
          <p className="text-[11px] text-slate-500">Max prioritized findings returned in audit triage queue</p>
        </div>
      </div>

      {/* Engine Toggles */}
      <div className="space-y-3 pt-2">
        <label className="text-xs font-semibold text-slate-800 block">
          Active Evidence Engines
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Rules */}
          <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={detectors.rules}
              onChange={(e) => setDetectors({ ...detectors, rules: e.target.checked })}
              className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <div>
              <span className="font-semibold text-slate-900 block">Deterministic Rules</span>
              <span className="text-[11px] text-slate-500">Duplicates, cutoff, round-sums</span>
            </div>
          </label>

          {/* ML Isolation Forest */}
          <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={detectors.ml}
              onChange={(e) => setDetectors({ ...detectors, ml: e.target.checked })}
              className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <div>
              <span className="font-semibold text-slate-900 block">IsolationForest ML</span>
              <span className="text-[11px] text-slate-500">Multi-variate outlier modeling</span>
            </div>
          </label>

          {/* Graph Cycles */}
          <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={detectors.graph}
              onChange={(e) => setDetectors({ ...detectors, graph: e.target.checked })}
              className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <div>
              <span className="font-semibold text-slate-900 block">Graph Cycles</span>
              <span className="text-[11px] text-slate-500">Multi-hop circular flow routing</span>
            </div>
          </label>

          {/* GST Reconciliation */}
          <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={detectors.gst}
              onChange={(e) => setDetectors({ ...detectors, gst: e.target.checked })}
              className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <div>
              <span className="font-semibold text-slate-900 block">GST Reconciliation</span>
              <span className="text-[11px] text-slate-500">Books vs GSTR-2B matching</span>
            </div>
          </label>
        </div>
      </div>

      {/* Advanced Settings Collapsible */}
      <div className="border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>Advanced Engine Settings</span>
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
        </button>

        {showAdvanced && (
          <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-slate-700">Hard Analysis Deadline (ms)</label>
              <input
                type="number"
                min="2000"
                max="30000"
                step="500"
                value={hardDeadlineMs}
                onChange={(e) => setHardDeadlineMs(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white font-mono"
              />
              <span className="text-[11px] text-slate-500">Triggers graceful degraded mode if engines exceed budget</span>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700">Engine Weight Assignment</label>
              <p className="text-[11px] text-slate-600 font-mono mt-1">
                Rules: 35% | ML: 25% | Graph: 25% | Materiality: 15%
              </p>
              <span className="text-[11px] text-slate-500">Dynamically renormalized if engines are degraded</span>
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={isStarting}
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
        >
          {isStarting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Launching Audit Pipeline...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Launch Multi-Engine Audit Analysis</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
