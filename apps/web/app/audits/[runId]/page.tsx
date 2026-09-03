"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertTriangle, Network, ShieldCheck, FileCheck, Layers } from "lucide-react";
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
import { AuditCopilotSheet } from "../../../components/copilot/AuditCopilotSheet";
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
      {summary && <DashboardHeader summary={summary} />}

      {/* KPI Cards */}
      {summary && <KpiCards summary={summary} />}

      {/* Funnel & Severity Visualizations */}
      {summary && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RiskFunnel summary={summary} />
          <SeverityDistribution summary={summary} />
        </div>
      )}

      {/* Navigation Tabs for Audit Investigation Console */}
      <div className="border-b border-slate-200">
        <div className="flex items-center gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("findings")}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === "findings"
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Prioritized Findings Queue</span>
          </button>

          <button
            onClick={() => setActiveTab("graph")}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === "graph"
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Network className="w-4 h-4" />
            <span>Transaction Money-Flow Graph</span>
          </button>

          <button
            onClick={() => setActiveTab("gst")}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === "gst"
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>GSTR-2B Reconciliation</span>
          </button>
        </div>
      </div>

      {/* Active Tab View */}
      {activeTab === "findings" && <FindingsTable runId={runId} />}

      {activeTab === "graph" && (
        <MoneyFlowGraph
          findingId={selectedFindingId || "FND-88120"}
          vendorName={selectedFinding?.vendor_name || "Zenith Trading & Logistics"}
        />
      )}

      {activeTab === "gst" && <GstPanel runId={runId} />}

      {/* Evidence Detail Drawer */}
      {isDrawerOpen && selectedFinding && (
        <FindingDetailDrawer
          finding={selectedFinding}
          onClose={() => {
            setIsDrawerOpen(false);
            setSelectedFindingId(null);
          }}
          onFocusGraph={() => {
            setActiveTab("graph");
          }}
        />
      )}

      {/* Audit Copilot Slide-out Assistant */}
      <AuditCopilotSheet runId={runId} />
    </div>
  );
}
