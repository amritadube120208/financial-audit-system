"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Bot, Network, ShieldAlert, FileText } from "lucide-react";
import {
  getAuditRun,
  getAuditRunSummary,
  getAuditRunFindings,
  getFindingGraph,
} from "@/lib/api";
import { subscribeToAuditEvents } from "@/lib/sse";
import type { AuditStatus, AuditProgressEvent, FindingItem } from "@/lib/types";
import { useAuditUiStore } from "@/stores/audit-ui-store";
import { useAuditContextStore } from "@/stores/audit-context-store";

import { AuditHeader } from "@/components/audit/audit-header";
import { ProgressTimeline } from "@/components/audit/progress-timeline";
import { KpiOverview } from "@/components/audit/kpi-overview";
import { RiskFunnel } from "@/components/audit/risk-funnel";
import { SeverityChart } from "@/components/audit/severity-chart";
import { DetectorBreakdown } from "@/components/audit/detector-breakdown";
import { FindingsTable } from "@/components/audit/findings-table";
import { FindingDrawer } from "@/components/audit/finding-drawer";
import { GraphViewer } from "@/components/audit/graph-viewer";
import { CopilotPanel } from "@/components/audit/copilot-panel";

export default function AuditRunPage() {
  const params = useParams();
  const runId = params?.runId as string;
  const { setLastActiveRunId } = useAuditContextStore();

  const {
    selectedFindingId,
    isFindingDrawerOpen,
    openFindingDrawer,
    closeFindingDrawer,
    isCopilotOpen,
    toggleCopilot,
    setCopilotOpen,
  } = useAuditUiStore();

  const [liveEvent, setLiveEvent] = useState<AuditProgressEvent | null>(null);
  const [isPollingFallback, setIsPollingFallback] = useState(false);

  // Sync active runId to store
  useEffect(() => {
    if (runId) setLastActiveRunId(runId);
  }, [runId, setLastActiveRunId]);

  // 1. Query Run Status
  const {
    data: runData,
    refetch: refetchRun,
    isLoading: isRunLoading,
  } = useQuery({
    queryKey: ["audit-run", runId],
    queryFn: () => getAuditRun(runId),
    enabled: !!runId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Poll every 2s if still running and polling fallback is active
      if (status && !["READY", "DEGRADED", "FAILED"].includes(status)) {
        return isPollingFallback ? 2000 : 5000;
      }
      return false;
    },
  });

  const currentStatus: AuditStatus = runData?.status || "CREATED";
  const isFinalized = ["READY", "DEGRADED"].includes(currentStatus);

  // 2. Wire SSE stream
  useEffect(() => {
    if (!runId || isFinalized) return;

    const unsubscribe = subscribeToAuditEvents(runId, {
      onEvent: (evt) => {
        setLiveEvent(evt);
        if (["READY", "DEGRADED", "FAILED"].includes(evt.state)) {
          refetchRun();
        }
      },
      onError: () => {
        // Switch to polling fallback
        setIsPollingFallback(true);
      },
      onComplete: () => {
        refetchRun();
      },
    });

    return () => {
      unsubscribe();
    };
  }, [runId, isFinalized, refetchRun]);

  // 3. Query Run Summary when finalized
  const { data: summaryData, refetch: refetchSummary } = useQuery({
    queryKey: ["audit-summary", runId],
    queryFn: () => getAuditRunSummary(runId),
    enabled: !!runId && isFinalized,
  });

  // 4. Query Findings when finalized
  const { data: findingsData, isLoading: isFindingsLoading, refetch: refetchFindings } = useQuery({
    queryKey: ["audit-findings", runId],
    queryFn: () => getAuditRunFindings(runId, { limit: 100 }),
    enabled: !!runId && isFinalized,
  });

  const findingsList = useMemo(() => findingsData?.findings || [], [findingsData]);

  // Active finding object
  const activeFinding = useMemo(() => {
    if (!selectedFindingId) return findingsList[0] || null;
    return findingsList.find((f) => f.finding_id === selectedFindingId) || null;
  }, [findingsList, selectedFindingId]);

  // 5. Query Graph Data for active finding (if it has a graph) or first available graph finding
  const graphFindingId = useMemo(() => {
    if (activeFinding?.has_graph) return activeFinding.finding_id;
    const firstWithGraph = findingsList.find((f) => f.has_graph);
    return firstWithGraph?.finding_id || null;
  }, [activeFinding, findingsList]);

  const { data: graphData, isLoading: isGraphLoading } = useQuery({
    queryKey: ["finding-graph", graphFindingId],
    queryFn: () => (graphFindingId ? getFindingGraph(graphFindingId) : null),
    enabled: !!graphFindingId,
  });

  const handleRefreshAll = () => {
    refetchRun();
    if (isFinalized) {
      refetchSummary();
      refetchFindings();
    }
  };

  return (
    <div className="flex-1 pb-16">
      <AuditHeader
        runId={runId}
        summary={summaryData}
        status={currentStatus}
        currentStage={runData?.current_stage}
        onRefresh={handleRefreshAll}
      />

      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        {/* Progress View (shown while running or initializing) */}
        {!isFinalized && (
          <ProgressTimeline
            status={currentStatus}
            progress={runData?.progress || liveEvent?.progress || 0}
            currentStage={runData?.current_stage || liveEvent?.stage || "initializing"}
            latestEvent={liveEvent}
            isPollingFallback={isPollingFallback}
          />
        )}

        {/* Finalized Audit Results View */}
        {isFinalized && (
          <>
            {/* KPI Cards */}
            {summaryData?.metrics && <KpiOverview metrics={summaryData.metrics} />}

            {/* Analytics Grid: Funnel & Severity */}
            {summaryData?.metrics && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-6">
                <div className="lg:col-span-2">
                  <RiskFunnel metrics={summaryData.metrics} />
                </div>
                <div className="lg:col-span-1">
                  <SeverityChart metrics={summaryData.metrics} />
                </div>
              </div>
            )}

            {/* Detector Breakdown */}
            {summaryData?.detectors && (
              <DetectorBreakdown detectors={summaryData.detectors} />
            )}

            {/* Cytoscape Relational Graph Forensics */}
            <GraphViewer graphData={graphData || null} isLoading={isGraphLoading} />

            {/* Ranked Findings Table */}
            <FindingsTable
              findings={findingsList}
              isLoading={isFindingsLoading}
              onSelectFinding={openFindingDrawer}
              selectedFindingId={selectedFindingId}
            />
          </>
        )}
      </div>

      {/* Floating Copilot Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={toggleCopilot}
          className="flex items-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-3 shadow-xl shadow-emerald-500/20 transition-all group"
        >
          <Bot className="h-5 w-5 group-hover:scale-110 transition-transform" />
          <span className="text-xs">Audit Copilot</span>
        </button>
      </div>

      {/* Slide-Over Finding Evidence Drawer */}
      <FindingDrawer
        finding={activeFinding}
        isOpen={isFindingDrawerOpen}
        onClose={closeFindingDrawer}
        runId={runId}
      />

      {/* AI Copilot Panel */}
      <CopilotPanel
        runId={runId}
        activeFindingId={selectedFindingId}
        isOpen={isCopilotOpen}
        onClose={() => setCopilotOpen(false)}
      />
    </div>
  );
}
