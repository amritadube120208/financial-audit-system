"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FileSpreadsheet, Play, Layers, Sparkles, AlertCircle, ArrowRight } from "lucide-react";
import { listAuditRuns, getAuditSummary } from "../lib/api/audits";
import { KpiCards } from "../components/dashboard/KpiCards";
import { RiskFunnel } from "../components/dashboard/RiskFunnel";
import { SeverityDistribution } from "../components/charts/SeverityDistribution";
import { FindingsTable } from "../components/findings/FindingsTable";

export default function HomePage() {
  // Query all available audit runs dynamically
  const { data: runs = [], isLoading: isLoadingRuns } = useQuery({
    queryKey: ["audit-runs"],
    queryFn: listAuditRuns,
  });

  // Pick the latest available run ID (no fake demo run)
  const latestRunId = runs.length > 0 ? runs[runs.length - 1].run_id : null;

  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ["audit-summary", latestRunId],
    queryFn: () => (latestRunId ? getAuditSummary(latestRunId) : null),
    enabled: Boolean(latestRunId),
  });

  return (
    <div className="space-y-10 py-6">
      {/* HEADER SECTION */}
      <section className="text-center max-w-3xl mx-auto space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Explainable Anomaly Triage for SME Audits</span>
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">AUDITGRAPH</h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Autonomous financial audit workbench combining deterministic rules, unsupervised machine learning, circular money-flow graph topology, and statutory GSTR-2B tax reconciliation.
        </p>

        <div className="flex items-center justify-center gap-4 pt-2">
          <Link
            href="/audits/new"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Start New Audit</span>
          </Link>
          {latestRunId && (
            <Link
              href={`/audits/${latestRunId}`}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold rounded-xl border border-slate-300 shadow-sm transition-all"
            >
              <Play className="w-4 h-4 text-brand-600 fill-brand-600" />
              <span>Open Latest Audit ({latestRunId})</span>
            </Link>
          )}
        </div>
      </section>

      {/* OVERVIEW / KPI SECTION */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-600" />
            <span>Executive Overview</span>
            <span className="text-xs font-mono font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Run: {latestRunId}
            </span>
          </h2>

          <Link
            href={`/audits/${latestRunId}`}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>Full Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {summary ? (
          <div className="space-y-6">
            <KpiCards summary={summary} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RiskFunnel summary={summary} />
              <SeverityDistribution summary={summary} />
            </div>
          </div>
        ) : isLoadingSummary ? (
          <div className="h-32 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 text-sm">
            Loading metrics for {latestRunId}...
          </div>
        ) : (
          <div className="bg-white border border-border rounded-xl p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No Audits Ingested Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Upload a general ledger CSV/Excel file to start multi-engine anomaly detection and view live metrics.
            </p>
            <Link
              href="/audits/new"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:underline pt-2"
            >
              Upload General Ledger
            </Link>
          </div>
        )}
      </section>

      {/* PRIORITY FINDINGS SECTION */}
      <section className="space-y-4 pt-4">
        <h2 className="text-lg font-bold text-slate-900">Priority Investigations Queue</h2>
        <FindingsTable runId={latestRunId} />
      </section>
    </div>
  );
}
