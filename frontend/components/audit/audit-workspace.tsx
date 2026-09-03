"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ShieldAlert,
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ArrowDown,
  Layers,
  Bot,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  Download,
  Filter,
  FileText,
} from "lucide-react";

import {
  uploadDataset,
  createAuditRun,
  getAuditRun,
  getAuditRunSummary,
  getAuditRunFindings,
  getFindingGraph,
  getAuditRunTransactions,
  getExportUrl,
  getErrorMessage,
} from "@/lib/api";
import { subscribeToAuditEvents } from "@/lib/sse";
import type {
  AuditStatus,
  AuditProgressEvent,
  DatasetUploadResponse,
  FindingItem,
  CanonicalTransaction,
} from "@/lib/types";
import { formatINR, formatBytes, formatNumber } from "@/lib/utils";
import { useAuditContextStore } from "@/stores/audit-context-store";
import { useAuditUiStore } from "@/stores/audit-ui-store";

import { ProgressTimeline } from "@/components/audit/progress-timeline";
import { KpiOverview } from "@/components/audit/kpi-overview";
import { RiskFunnel } from "@/components/audit/risk-funnel";
import { SeverityChart } from "@/components/audit/severity-chart";
import { DetectorBreakdown } from "@/components/audit/detector-breakdown";
import { FindingsTable } from "@/components/audit/findings-table";
import { FindingDrawer } from "@/components/audit/finding-drawer";
import { GraphViewer } from "@/components/audit/graph-viewer";
import { CopilotPanel } from "@/components/audit/copilot-panel";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { TransactionDrawer } from "@/components/transactions/transaction-drawer";

const PAGE_SIZE = 50;

interface AuditWorkspaceProps {
  initialRunId?: string;
}

export function AuditWorkspace({ initialRunId }: AuditWorkspaceProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const queryRunId = searchParams?.get("run");
  const queryCaseId = searchParams?.get("case");

  const { lastActiveRunId, setLastActiveRunId, addRecentRun } = useAuditContextStore();
  const {
    selectedFindingId,
    isFindingDrawerOpen,
    openFindingDrawer,
    closeFindingDrawer,
    isCopilotOpen,
    toggleCopilot,
    setCopilotOpen,
  } = useAuditUiStore();

  const { clearActiveRun } = useAuditContextStore();
  const [activeRunId, setActiveRunId] = useState<string | null>(
    initialRunId || queryRunId || lastActiveRunId || null
  );

  const handleNewAudit = () => {
    clearActiveRun();
    setActiveRunId(null);
    setSelectedFile(null);
    setDatasetInfo(null);
    setUploadProgress(null);
    setUploadError(null);
    setLiveEvent(null);
    useAuditUiStore.getState().reset();
    setTxnSearch("");
    setActiveTxnSearch("");
    setTxnPage(0);
    setSelectedTxn(null);
    setIsTxnDrawerOpen(false);
    setIsPollingFallback(false);
    void queryClient.cancelQueries();
    queryClient.clear();
    router.replace("/audit");
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", "/audit");
    }
  };

  // Sync run ID changes
  useEffect(() => {
    const id = initialRunId || queryRunId;
    if (id) {
      setActiveRunId(id);
      setLastActiveRunId(id);
    }
  }, [initialRunId, queryRunId, setLastActiveRunId]);

  // Open Copilot if hash is #copilot
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#copilot") {
      setCopilotOpen(true);
    }
  }, [setCopilotOpen]);

  // Open specific case if passed in query param
  useEffect(() => {
    if (queryCaseId) {
      openFindingDrawer(queryCaseId);
    }
  }, [queryCaseId, openFindingDrawer]);

  // Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [datasetInfo, setDatasetInfo] = useState<DatasetUploadResponse | null>(null);
  const [isStartingAnalysis, setIsStartingAnalysis] = useState(false);

  // Progress & Polling Fallback
  const [liveEvent, setLiveEvent] = useState<AuditProgressEvent | null>(null);
  const [isPollingFallback, setIsPollingFallback] = useState(false);

  // Transactions State
  const [txnSearch, setTxnSearch] = useState("");
  const [activeTxnSearch, setActiveTxnSearch] = useState("");
  const [txnPage, setTxnPage] = useState(0);
  const [selectedTxn, setSelectedTxn] = useState<CanonicalTransaction | null>(null);
  const [isTxnDrawerOpen, setIsTxnDrawerOpen] = useState(false);

  // 1. Query Run Status
  const {
    data: runData,
    refetch: refetchRun,
    isLoading: isRunLoading,
  } = useQuery({
    queryKey: ["audit-run", activeRunId],
    queryFn: () => (activeRunId ? getAuditRun(activeRunId) : null),
    enabled: !!activeRunId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status && !["READY", "DEGRADED", "FAILED"].includes(status)) {
        return isPollingFallback ? 2000 : 4000;
      }
      return false;
    },
  });

  const currentStatus: AuditStatus = runData?.status || "CREATED";
  const isFinalized = ["READY", "DEGRADED"].includes(currentStatus);

  // 2. Wire SSE stream
  useEffect(() => {
    if (!activeRunId || isFinalized) return;

    const unsubscribe = subscribeToAuditEvents(activeRunId, {
      onEvent: (evt) => {
        setLiveEvent(evt);
        if (["READY", "DEGRADED", "FAILED"].includes(evt.state)) {
          refetchRun();
        }
      },
      onError: () => {
        setIsPollingFallback(true);
      },
      onComplete: () => {
        refetchRun();
      },
    });

    return () => {
      unsubscribe();
    };
  }, [activeRunId, isFinalized, refetchRun]);

  // 3. Query Summary when finalized
  const { data: summaryData, refetch: refetchSummary } = useQuery({
    queryKey: ["audit-summary", activeRunId],
    queryFn: () => (activeRunId ? getAuditRunSummary(activeRunId) : null),
    enabled: !!activeRunId && isFinalized,
  });

  // 4. Query Findings when finalized
  const { data: findingsData, isLoading: isFindingsLoading, refetch: refetchFindings } = useQuery({
    queryKey: ["audit-findings", activeRunId],
    queryFn: () => (activeRunId ? getAuditRunFindings(activeRunId, { limit: 100 }) : null),
    enabled: !!activeRunId && isFinalized,
  });

  const findingsList = useMemo(() => findingsData?.findings || [], [findingsData]);

  // Active finding object
  const activeFinding = useMemo(() => {
    if (!selectedFindingId) return findingsList[0] || null;
    return findingsList.find((f) => f.finding_id === selectedFindingId) || null;
  }, [findingsList, selectedFindingId]);

  // Query Graph for active finding
  const graphFindingId = useMemo(() => {
    if (activeFinding?.has_graph) return activeFinding.finding_id;
    return null;
  }, [activeFinding]);

  const { data: graphData, isLoading: isGraphLoading } = useQuery({
    queryKey: ["finding-graph", graphFindingId],
    queryFn: () => (graphFindingId ? getFindingGraph(graphFindingId) : null),
    enabled: !!graphFindingId,
  });

  // 5. Query Transactions for active run
  const {
    data: txnsData,
    isLoading: isTxnsLoading,
    refetch: refetchTxns,
  } = useQuery({
    queryKey: ["audit-transactions", activeRunId, activeTxnSearch, txnPage],
    queryFn: () =>
      activeRunId && isFinalized
        ? getAuditRunTransactions(activeRunId, {
            search: activeTxnSearch || undefined,
            limit: PAGE_SIZE,
            offset: txnPage * PAGE_SIZE,
          })
        : null,
    enabled: !!activeRunId && isFinalized,
  });

  const transactions = txnsData?.transactions || [];
  const totalTxnsReturned = txnsData?.total_returned || 0;

  // File Upload Handlers
  const handleFileDrop = (file: File) => {
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (![".csv", ".xlsx"].includes(ext)) {
      setUploadError("Only CSV (.csv) and Excel (.xlsx) accounting ledgers are accepted.");
      return;
    }
    handleNewAudit();
    setSelectedFile(file);
    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(0);

    uploadDataset(file, (pct) => setUploadProgress(pct))
      .then((res) => {
        setDatasetInfo(res);
      })
      .catch((err) => {
        setUploadError(getErrorMessage(err));
        setSelectedFile(null);
      })
      .finally(() => {
        setIsUploading(false);
        setUploadProgress(null);
      });
  };

  const handleStartAnalysis = async () => {
    if (!datasetInfo) return;
    setIsStartingAnalysis(true);
    setUploadError(null);

    try {
      const run = await createAuditRun({ dataset_id: datasetInfo.dataset_id });
      setActiveRunId(run.run_id);
      setLastActiveRunId(run.run_id);
      addRecentRun({
        runId: run.run_id,
        filename: datasetInfo.filename,
        rowCount: datasetInfo.row_count,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      setUploadError(getErrorMessage(err));
    } finally {
      setIsStartingAnalysis(false);
    }
  };

  const handleTxnSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setTxnPage(0);
    setActiveTxnSearch(txnSearch);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="flex-1 pb-24">
      {/* ============================================================ */}
      {/* LOCAL SUB-NAVIGATION (Smooth scroll between sections)        */}
      {/* ============================================================ */}
      <div className="sticky top-[58px] z-30 w-full border-b border-[rgba(237,231,220,0.13)] bg-[#0A0C0E]/90 backdrop-blur-[14px] py-2.5">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-4 sm:gap-6 uppercase tracking-[0.12em] text-[#9EA5A8]">
            <button
              onClick={() => scrollToSection("overview")}
              className="hover:text-[#EDE7DC] transition-colors"
            >
              OVERVIEW
            </button>
            <button
              onClick={() => scrollToSection("upload-section")}
              className="hover:text-[#EDE7DC] transition-colors"
            >
              INGEST & SCHEMA
            </button>
            {isFinalized && (
              <>
                <button
                  onClick={() => scrollToSection("investigations")}
                  className="hover:text-[#E8913C] transition-colors font-semibold text-[#EDE7DC]"
                >
                  CASES ({findingsList.length})
                </button>
                <button
                  onClick={() => scrollToSection("transactions")}
                  className="hover:text-[#E8913C] transition-colors font-semibold text-[#EDE7DC]"
                >
                  TRANSACTIONS ({summaryData?.metrics?.total_transactions || 0})
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeRunId && isFinalized && (
              <>
                <a
                  href={`/api/v1/audit-runs/${activeRunId}/report/printable`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-sm border border-[#E8913C]/50 bg-[#E8913C]/10 hover:bg-[#E8913C] text-[#E8913C] hover:text-[#0A0C0E] transition-colors font-mono font-semibold uppercase"
                >
                  <FileText className="h-3 w-3" /> REPORT
                </a>
                <a
                  href={getExportUrl(activeRunId, "csv")}
                  download
                  className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-sm border border-[rgba(237,231,220,0.15)] bg-[#101317] hover:border-[#E8913C] text-[#EDE7DC] hover:text-[#E8913C] transition-colors font-mono"
                >
                  <Download className="h-3 w-3" /> CSV
                </a>
                <a
                  href={getExportUrl(activeRunId, "json")}
                  download
                  className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-sm border border-[rgba(237,231,220,0.15)] bg-[#101317] hover:border-[#E8913C] text-[#EDE7DC] hover:text-[#E8913C] transition-colors font-mono"
                >
                  <Download className="h-3 w-3" /> JSON
                </a>
              </>
            )}
            {activeRunId && (
              <button
                onClick={handleNewAudit}
                className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-sm border border-[rgba(237,231,220,0.2)] bg-[#101317] hover:border-[#E8913C] text-[#9EA5A8] hover:text-[#EDE7DC] transition-colors font-mono uppercase"
              >
                NEW AUDIT
              </button>
            )}
            <button
              onClick={toggleCopilot}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#101317] text-[#EDE7DC] border border-[rgba(237,231,220,0.2)] hover:border-[#E8913C] hover:text-[#E8913C] font-semibold text-xs tracking-[0.08em] transition-colors font-mono"
            >
              <Bot className="h-3.5 w-3.5 text-[#E8913C]" /> COPILOT
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 1: AUDIT WORKSPACE HEADER                            */}
      {/* ============================================================ */}
      <div id="overview" className="border-b border-[rgba(237,231,220,0.13)] bg-[#0A0C0E] py-8">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2 font-mono text-xs">
                <span className="text-[#6C7378] uppercase tracking-[0.14em]">
                  {activeRunId ? "ACTIVE AUDIT" : "AUDIT WORKSPACE"}
                </span>
                {activeRunId && (
                  <>
                    <span className="text-[#6C7378]">•</span>
                    <span className="text-[#EDE7DC] bg-[#101317] px-2 py-0.5 rounded-sm border border-[rgba(237,231,220,0.12)]">
                      {datasetInfo?.filename || summaryData?.dataset?.filename || "Ledger Ingested"}
                    </span>
                    <span className="text-[#6C7378]">•</span>
                    <span className="text-[#EDE7DC] bg-[#101317] px-2 py-0.5 rounded-sm border border-[rgba(237,231,220,0.12)]">
                      {activeRunId}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-sm border font-medium flex items-center gap-1.5 ${
                        isFinalized
                          ? "bg-[#2E6B72]/15 text-[#2E6B72] border-[#2E6B72]/40"
                          : "bg-[#E8913C]/15 text-[#E8913C] border-[#E8913C]/40"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isFinalized ? "bg-[#2E6B72]" : "bg-[#E8913C] animate-pulse"
                        }`}
                      />
                      {currentStatus}
                    </span>
                  </>
                )}
              </div>

              <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#EDE7DC] tracking-tight">
                {activeRunId
                  ? (datasetInfo?.filename || summaryData?.dataset?.filename || "Financial Ledger Investigation")
                  : "No Active Audit Engagement"}
              </h1>
              <p className="text-xs sm:text-sm font-body text-[#9EA5A8] mt-1 max-w-3xl">
                {activeRunId
                  ? "Multi-engine anomaly triage running on uploaded ledger data. Inspect red flags and trace evidence."
                  : "Upload a financial ledger (.csv or .xlsx) below to begin multi-engine forensic anomaly triage."}
              </p>
            </div>

            {activeRunId && (
              <button
                onClick={() => {
                  refetchRun();
                  if (isFinalized) {
                    refetchSummary();
                    refetchFindings();
                    refetchTxns();
                  }
                }}
                className="p-2 rounded-sm border border-[rgba(237,231,220,0.13)] bg-[#101317] hover:border-[#E8913C] text-[#9EA5A8] hover:text-[#EDE7DC] transition-colors self-start md:self-auto"
                title="Refresh Workspace"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 space-y-12 mt-8">
        {/* ============================================================ */}
        {/* SECTION 2 & 3: UPLOAD & SCHEMA VALIDATION                     */}
        {/* ============================================================ */}
        <section id="upload-section" className="space-y-6">
          <div className="border-b border-[rgba(237,231,220,0.13)] pb-3">
            <h2 className="font-display font-bold text-base text-[#EDE7DC] flex items-center gap-2">
              <UploadCloud className="h-4 w-4 text-[#E8913C]" />
              Upload & Ingest Ledger
            </h2>
            <p className="text-xs font-body text-[#9EA5A8] mt-0.5">
              Select or drop an SME general ledger (.csv, .xlsx). The file is verified with SHA-256 for audit immutability.
            </p>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files?.[0]) handleFileDrop(e.dataTransfer.files[0]);
            }}
            className="rounded-sm border-2 border-dashed border-[rgba(237,231,220,0.16)] bg-[#101317] p-8 text-center hover:border-[#E8913C] transition-colors"
          >
            <input
              type="file"
              id="file-upload"
              accept=".csv,.xlsx"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileDrop(e.target.files[0]);
              }}
              className="hidden"
            />
            <label htmlFor="file-upload" className="cursor-pointer space-y-3 block">
              <div className="h-12 w-12 rounded-sm bg-[#0A0C0E] border border-[rgba(237,231,220,0.13)] text-[#E8913C] flex items-center justify-center mx-auto">
                <UploadCloud className="h-6 w-6" />
              </div>
              <div>
                <span className="text-sm font-display font-semibold text-[#EDE7DC]">
                  {isUploading ? "Uploading & Fingerprinting..." : "Click to select or drag & drop financial ledger"}
                </span>
                <p className="text-xs font-body text-[#9EA5A8] mt-1">
                  Supports .csv and .xlsx files up to 100 MB.
                </p>
              </div>
            </label>

            {isUploading && uploadProgress !== null && (
              <div className="mt-4 max-w-xs mx-auto">
                <div className="h-1.5 w-full bg-[#0A0C0E] rounded-full overflow-hidden border border-[rgba(237,231,220,0.1)]">
                  <div
                    className="h-full bg-[#E8913C] transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-[#9EA5A8] mt-1 block">
                  {uploadProgress}%
                </span>
              </div>
            )}

            {isUploading && uploadProgress !== null && (
              <div className="mt-4 max-w-xs mx-auto">
                <div className="h-1.5 w-full bg-[#0A0C0E] rounded-full overflow-hidden border border-[rgba(237,231,220,0.1)]">
                  <div
                    className="h-full bg-[#E8913C] transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-[#9EA5A8] mt-1 block">
                  {uploadProgress}%
                </span>
              </div>
            )}
          </div>

          {uploadError && (
            <div className="p-3.5 rounded-sm border border-[#E8913C]/40 bg-[#E8913C]/10 text-[#E8913C] text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* SECTION 3: SCHEMA / VALIDATION (Directly beneath upload) */}
          {datasetInfo && (
            <div className="rounded-sm border border-[rgba(237,231,220,0.13)] bg-[#101317] p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(237,231,220,0.1)]">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#2E6B72]" />
                    <h3 className="text-sm font-display font-bold text-[#EDE7DC]">
                      Dataset Validated: {datasetInfo.filename}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-sm font-mono bg-[#2E6B72]/15 text-[#2E6B72] border border-[#2E6B72]/40 font-semibold">
                      {datasetInfo.schema_status}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-[#6C7378] mt-1 block">
                    ID: {datasetInfo.dataset_id} • SHA-256: {datasetInfo.sha256.slice(0, 16)}...
                  </span>
                </div>

                <button
                  onClick={handleStartAnalysis}
                  disabled={isStartingAnalysis}
                  className="inline-flex items-center justify-center gap-2 rounded-sm bg-[#E8913C] hover:bg-[#E8913C]/90 text-[#0A0C0E] px-5 py-2 text-xs font-mono uppercase tracking-[0.1em] font-semibold transition-colors disabled:opacity-50"
                >
                  {isStartingAnalysis ? (
                    <>
                      <span className="h-3.5 w-3.5 border-2 border-[#0A0C0E] border-t-transparent rounded-full animate-spin" />
                      ANALYZING LEDGER...
                    </>
                  ) : (
                    <>ANALYZE LEDGER</>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                <div>
                  <span className="text-[#6C7378] block text-[10.5px] uppercase tracking-[0.12em]">Rows</span>
                  <span className="font-bold text-[#EDE7DC] mt-0.5 block">
                    {formatNumber(datasetInfo.row_count)}
                  </span>
                </div>
                <div>
                  <span className="text-[#6C7378] block text-[10.5px] uppercase tracking-[0.12em]">Columns</span>
                  <span className="font-bold text-[#EDE7DC] mt-0.5 block">
                    {datasetInfo.column_count}
                  </span>
                </div>
                <div>
                  <span className="text-[#6C7378] block text-[10.5px] uppercase tracking-[0.12em]">Size</span>
                  <span className="font-medium text-[#EDE7DC] mt-0.5 block">
                    {formatBytes(datasetInfo.size_bytes)}
                  </span>
                </div>
                <div>
                  <span className="text-[#6C7378] block text-[10.5px] uppercase tracking-[0.12em]">Format</span>
                  <span className="font-medium text-[#E8913C] mt-0.5 block uppercase">
                    {datasetInfo.detected_format}
                  </span>
                </div>
              </div>

              {/* Canonical Schema Mapping */}
              <div className="pt-2">
                <span className="text-[10.5px] font-mono text-[#6C7378] uppercase tracking-[0.14em] block mb-2">
                  CANONICAL COLUMN ALIGNMENTS
                </span>
                <div className="max-h-40 overflow-y-auto rounded-sm border border-[rgba(237,231,220,0.1)] bg-[#0A0C0E] text-xs font-mono">
                  <table className="w-full text-left">
                    <thead className="bg-[#0A0C0E] text-[#6C7378] uppercase text-[10px] tracking-[0.12em] border-b border-[rgba(237,231,220,0.1)] sticky top-0">
                      <tr>
                        <th className="py-2 px-3">File Column</th>
                        <th className="py-2 px-3">Canonical Field</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(237,231,220,0.06)]">
                      {Object.entries(datasetInfo.canonical_mapping || {}).map(([src, can]) => (
                        <tr key={src} className="hover:bg-[#101317]/50">
                          <td className="py-1.5 px-3 text-[#9EA5A8]">{src}</td>
                          <td className="py-1.5 px-3 text-[#EDE7DC] font-semibold">{can}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ============================================================ */}
        {/* SECTION 4: ANALYSIS PROGRESS (Real state machine pipeline)   */}
        {/* ============================================================ */}
        {activeRunId && !isFinalized && (
          <section className="space-y-4">
            <div className="border-b border-[rgba(237,231,220,0.13)] pb-2">
              <h2 className="font-display font-bold text-lg text-[#EDE7DC]">Analysis Pipeline Execution</h2>
            </div>
            <ProgressTimeline
              status={currentStatus}
              progress={runData?.progress || liveEvent?.progress || 0}
              currentStage={runData?.current_stage || liveEvent?.stage || "initializing"}
              latestEvent={liveEvent}
              isPollingFallback={isPollingFallback}
            />
          </section>
        )}

        {/* ============================================================ */}
        {/* SECTION 5: AUDIT SUMMARY (When analysis completes)           */}
        {/* ============================================================ */}
        {activeRunId && isFinalized && summaryData?.metrics && (
          <section className="space-y-6">
            <div className="border-b border-[rgba(237,231,220,0.13)] pb-2">
              <h2 className="font-display font-bold text-lg text-[#EDE7DC]">Audit Triage Summary</h2>
              <p className="text-xs font-body text-[#9EA5A8] mt-0.5">
                Multi-engine anomaly detection results across {formatNumber(summaryData.metrics.total_transactions)} ledger entries.
              </p>
            </div>

            <KpiOverview metrics={summaryData.metrics} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RiskFunnel metrics={summaryData.metrics} />
              </div>
              <div className="lg:col-span-1">
                <SeverityChart metrics={summaryData.metrics} />
              </div>
            </div>

            {summaryData.detectors && (
              <DetectorBreakdown detectors={summaryData.detectors} />
            )}
          </section>
        )}

        {/* ============================================================ */}
        {/* SECTION 6: INVESTIGATION QUEUE & FORENSICS GRAPH             */}
        {/* ============================================================ */}
        {activeRunId && isFinalized && (
          <section id="investigations" className="space-y-6">
            <div className="border-b border-[rgba(237,231,220,0.13)] pb-2">
              <h2 className="font-display font-bold text-lg text-[#EDE7DC]">Investigation Queue</h2>
              <p className="text-xs font-body text-[#9EA5A8] mt-0.5">
                Surfaced cases ranked by combined risk score and monetary exposure. Click Investigate to inspect evidence.
              </p>
            </div>

            {/* Directed Relational Money Flow Graph */}
            <GraphViewer graphData={graphData || null} isLoading={isGraphLoading} />

            {/* Ranked Findings Table */}
            <FindingsTable
              findings={findingsList}
              isLoading={isFindingsLoading}
              onSelectFinding={openFindingDrawer}
              selectedFindingId={selectedFindingId}
            />
          </section>
        )}

        {/* ============================================================ */}
        {/* SECTION 7: TRANSACTIONS (ON SAME PAGE!)                      */}
        {/* ============================================================ */}
        {activeRunId && isFinalized && (
          <section id="transactions" className="space-y-6 pt-6 border-t border-[rgba(237,231,220,0.13)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[rgba(237,231,220,0.13)] pb-3">
              <div>
                <h2 className="font-display font-bold text-lg text-[#EDE7DC] flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-[#E8913C]" />
                  Ledger Transactions
                </h2>
                <p className="text-xs font-body text-[#9EA5A8] mt-0.5">
                  Canonical transaction corpus belonging to this audit run ({formatNumber(summaryData?.metrics?.total_transactions || 0)} entries).
                </p>
              </div>

              {/* Search & Pagination Bar */}
              <div className="flex items-center gap-2">
                <form onSubmit={handleTxnSearch} className="flex items-center gap-1.5">
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6C7378]" />
                    <input
                      type="text"
                      placeholder="Search vendor, invoice..."
                      value={txnSearch}
                      onChange={(e) => setTxnSearch(e.target.value)}
                      className="h-8 pl-8 pr-2.5 rounded-sm border border-[rgba(237,231,220,0.13)] bg-[#101317] text-xs text-[#EDE7DC] placeholder:text-[#6C7378] focus:outline-none focus:border-[#E8913C]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-8 px-3 rounded-sm bg-[#101317] hover:border-[#E8913C] border border-[rgba(237,231,220,0.15)] text-xs font-mono uppercase tracking-[0.1em] text-[#EDE7DC] hover:text-[#E8913C] transition-colors"
                  >
                    FILTER
                  </button>
                </form>

                <div className="flex items-center gap-1 text-xs font-mono text-[#9EA5A8]">
                  <button
                    onClick={() => setTxnPage((p) => Math.max(0, p - 1))}
                    disabled={txnPage === 0 || isTxnsLoading}
                    className="p-1.5 rounded-sm border border-[rgba(237,231,220,0.13)] bg-[#101317] hover:border-[#E8913C] text-[#EDE7DC] disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <span className="px-1.5">PG {txnPage + 1}</span>
                  <button
                    onClick={() => setTxnPage((p) => p + 1)}
                    disabled={totalTxnsReturned < PAGE_SIZE || isTxnsLoading}
                    className="p-1.5 rounded-sm border border-[rgba(237,231,220,0.13)] bg-[#101317] hover:border-[#E8913C] text-[#EDE7DC] disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <TransactionTable
              transactions={transactions}
              isLoading={isTxnsLoading}
              onSelectTransaction={(txn) => {
                setSelectedTxn(txn);
                setIsTxnDrawerOpen(true);
              }}
              selectedTransactionId={selectedTxn?.transaction_id || null}
            />
          </section>
        )}
      </div>

      {/* Slide-over Investigation Evidence Drawer */}
      <FindingDrawer
        key={`${activeRunId}:${activeFinding?.finding_id}`}
        finding={activeFinding}
        isOpen={isFindingDrawerOpen}
        onClose={closeFindingDrawer}
        runId={activeRunId || ""}
      />

      {/* Slide-over Transaction Detail Drawer */}
      <TransactionDrawer
        transaction={selectedTxn}
        isOpen={isTxnDrawerOpen}
        onClose={() => setIsTxnDrawerOpen(false)}
        runId={activeRunId || ""}
      />

      {/* AI Copilot Panel */}
      <CopilotPanel
        key={activeRunId || "empty"}
        runId={activeRunId || ""}
        activeFinding={activeFinding}
        isOpen={isCopilotOpen}
        onClose={() => setCopilotOpen(false)}
      />
    </div>
  );
}
