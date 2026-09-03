"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertTriangle, Network, ShieldCheck, FileCheck, Layers, Database } from "lucide-react";
import { getAuditRun, getAuditSummary } from "../../../lib/api/audits";
import { getFinding } from "../../../lib/api/findings";
import { LivePipelineStages } from "../../../components/dashboard/LivePipelineStages";
import { DashboardHeader } from "../../../components/dashboard/DashboardHeader";
import { KpiCards } from "../../../components/dashboard/KpiCards";
import { RiskFunnel } from "../../../components/dashboard/RiskFunnel";
import { SeverityDistribution } from "../../../components/charts/SeverityDistribution";
import { FindingsTable } from "../../../components/findings/FindingsTable";
import { FindingDetailDrawer } from "../../../components/findings/FindingDetailDrawer";
import { MoneyFlowGraph } from "../../../components/graph/MoneyFlowGraph";
import { GstPanel } from "../../../components/dashboard/GstPanel";
import { TransactionsTable } from "../../../components/transactions/TransactionsTable";
import { useUiStore } from "../../../stores/useUiStore";
import { ErrorEnvelopeAlert } from "../../../components/system/ErrorEnvelopeAlert";

export default function AuditDashboardPage() {
  const params = useParams();
  const runId = params?.runId as string;

  const {
    selectedFindingId,
    setSelectedFindingId,
    isDrawerOpen,
    setIsDrawerOpen,
    isPresentationMode,
  } = useUiStore();

  const [activeTab, setActiveTab] = useState<"findings" | "graph" | "gst">("findings");

  // Fetch Run Status
  const {
    data: run,
    isLoading: isLoadingRun,
    isError: isErrorRun,
    error: runError,
    refetch: refetchRun,
  } = useQuery({
    queryKey: ["audit-run", runId],
    queryFn: () => getAuditRun(runId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status && ["READY", "DEGRADED", "RECOVERY", "FAILED"].includes(status)) {
        return false;
      }
      return 2000;
    },
  });

  // Fetch Summary
  const {
    data: summary,
    isLoading: isLoadingSummary,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ["audit-summary", runId],
    queryFn: () => getAuditSummary(runId),
    enabled: Boolean(run && ["READY", "DEGRADED", "RECOVERY"].includes(run.status)),
  });

  // Fetch Selected Finding details for drawer
  const { data: selectedFinding } = useQuery({
    queryKey: ["finding", selectedFindingId],
    queryFn: () => (selectedFindingId ? getFinding(selectedFindingId) : null),
    enabled: Boolean(selectedFindingId),
  });

  if (isLoadingRun) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-500 text-xs">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        <span>Connecting to AuditGraph engine for run {runId}...</span>
      </div>
    );
  }

  if (isErrorRun) {
    return (
      <div className="py-12 max-w-xl mx-auto">
        <ErrorEnvelopeAlert error={runError} onRetry={() => refetchRun()} />
      </div>
    );
  }

  // If audit is still processing (CREATED, INGESTING, VALIDATING, DETECTING, SCORING, EXPLAINING)
  if (run && !["READY", "DEGRADED", "RECOVERY"].includes(run.status)) {
    return (
      <LivePipelineStages
        runId={runId}
        onComplete={() => {
          refetchRun();
          refetchSummary();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Metadata & Action Header */}
      {summary && (
        <div id="overview" className="scroll-mt-24">
          <DashboardHeader summary={summary} />
        </div>
      )}

      {/* KPI Cards */}
      {summary && <KpiCards summary={summary} />}

      {/* Funnel & Severity Visualizations */}
      {summary && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RiskFunnel summary={summary} />
          <SeverityDistribution summary={summary} />
        </div>
      )}

      {/* Local Sub-Navigation for the Long-Scrolling Workspace */}
      <div className="sticky top-16 z-30 bg-surface/95 backdrop-blur-sm border-b border-slate-200 py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 shadow-sm">
        <div className="flex items-center gap-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <a href="#overview" className="hover:text-brand-600 transition-colors">Overview</a>
          <a href="#investigations" className="hover:text-brand-600 transition-colors flex items-center gap-1.5"><Layers className="w-3.5 h-3.5"/> Investigations</a>
          <a href="#graph" className="hover:text-brand-600 transition-colors flex items-center gap-1.5"><Network className="w-3.5 h-3.5"/> Money-Flow</a>
          <a href="#gst" className="hover:text-brand-600 transition-colors flex items-center gap-1.5"><FileCheck className="w-3.5 h-3.5"/> GST</a>
          <a href="#transactions" className="hover:text-brand-600 transition-colors flex items-center gap-1.5"><Database className="w-3.5 h-3.5"/> Transactions</a>
        </div>
      </div>

      {/* SECTION: INVESTIGATIONS */}
      <div id="investigations" className="scroll-mt-32 space-y-4 pt-4">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Layers className="w-5 h-5 text-brand-600" />
          Prioritized Investigation Queue
        </h2>
        <FindingsTable runId={runId} />
      </div>

      {/* SECTION: GRAPH */}
      <div id="graph" className="scroll-mt-32 space-y-4 pt-8">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Network className="w-5 h-5 text-brand-600" />
          Transaction Money-Flow Graph
        </h2>
        <MoneyFlowGraph
          findingId={selectedFindingId || "case_inv_001"}
          vendorName={selectedFinding?.vendor_name || "Zenith Trading & Logistics"}
        />
      </div>

      {/* SECTION: GST */}
      <div id="gst" className="scroll-mt-32 space-y-4 pt-8">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-brand-600" />
          GSTR-2B Reconciliation
        </h2>
        <GstPanel runId={runId} />
      </div>

      {/* SECTION: TRANSACTIONS */}
      <div id="transactions" className="scroll-mt-32 space-y-4 pt-12 pb-12">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Database className="w-5 h-5 text-brand-600" />
          All Transactions
        </h2>
        <p className="text-xs text-slate-500 mb-2">
          Search, filter, and inspect all underlying raw ledger entries for this audit.
        </p>
        <TransactionsTable runId={runId} />
      </div>

      {/* Evidence Detail Drawer */}
      {isDrawerOpen && selectedFinding && (
        <FindingDetailDrawer
          finding={selectedFinding}
          onClose={() => {
            setIsDrawerOpen(false);
            setSelectedFindingId(null);
          }}
          onFocusGraph={() => {
            document.getElementById("graph")?.scrollIntoView({ behavior: "smooth" });
          }}
        />
      )}
    </div>
  );
}
