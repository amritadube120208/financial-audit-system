"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  ArrowUpDown,
  AlertOctagon,
  FileQuestion,
  Loader2,
} from "lucide-react";
import { getFindings } from "../../lib/api/findings";
import { Finding, Severity } from "../../lib/types/api";
import { StatusBadge } from "../system/StatusBadge";
import { formatINR, formatDate, formatNumber } from "../../lib/utils/formatters";
import { useUiStore } from "../../stores/useUiStore";
import { ErrorEnvelopeAlert } from "../system/ErrorEnvelopeAlert";

interface FindingsTableProps {
  runId: string;
}

export const FindingsTable: React.FC<FindingsTableProps> = ({ runId }) => {
  const {
    selectedSeverity,
    setSelectedSeverity,
    setSelectedFindingId,
    searchQuery,
    setSearchQuery,
    selectedDetector,
    setSelectedDetector,
  } = useUiStore();

  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  const limit = 20;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["findings", runId, selectedSeverity, selectedDetector, searchQuery, cursor],
    queryFn: () =>
      getFindings(runId, {
        severity: selectedSeverity !== "ALL" ? selectedSeverity : undefined,
        detector: selectedDetector !== "ALL" ? selectedDetector : undefined,
        search: searchQuery || undefined,
        limit,
        cursor,
      }),
  });

  const handleNextPage = () => {
    if (data?.next_cursor) {
      setCursorHistory((prev) => [...prev, cursor || "0"]);
      setCursor(data.next_cursor);
    }
  };

  const handlePrevPage = () => {
    if (cursorHistory.length > 0) {
      const prevCursor = cursorHistory[cursorHistory.length - 1];
      setCursorHistory((prev) => prev.slice(0, -1));
      setCursor(prevCursor === "0" ? undefined : prevCursor);
    }
  };

  const detectors = ["ALL", "RULES", "GRAPH_CYCLES", "ISOLATION_FOREST"];
  const severities: (Severity | "ALL")[] = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"];

  return (
    <div id="findings" className="bg-white border border-border rounded-xl shadow-sm overflow-hidden space-y-4">
      {/* Header & Filter Bar */}
      <div className="p-5 border-b border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-brand-600" />
              Prioritized Findings Investigation Queue
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked descending by multi-engine fused priority score
            </p>
          </div>

          <div className="text-xs font-mono text-slate-500">
            {data ? (
              <span>Showing {Array.isArray(data?.items) ? data.items.length : 0} of {data?.total ?? 0} prioritized findings</span>
            ) : (
              <span>Loading findings...</span>
            )}
          </div>
        </div>

        {/* Filters Controls */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search title, voucher, vendor, or rule code..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCursor(undefined);
                setCursorHistory([]);
              }}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
            />
          </div>

          {/* Severity Tabs */}
          <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-1 bg-slate-50">
            {severities.map((sev) => (
              <button
                key={sev}
                onClick={() => {
                  setSelectedSeverity(sev);
                  setCursor(undefined);
                  setCursorHistory([]);
                }}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  selectedSeverity === sev
                    ? "bg-white text-slate-900 shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Detector Filter */}
          <select
            value={selectedDetector}
            onChange={(e) => {
              setSelectedDetector(e.target.value);
              setCursor(undefined);
              setCursorHistory([]);
            }}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-medium"
          >
            <option value="ALL">All Detectors</option>
            <option value="RULES">Rules Engine</option>
            <option value="GRAPH_CYCLES">Graph Cycles</option>
            <option value="ISOLATION_FOREST">Isolation Forest</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="p-6">
          <ErrorEnvelopeAlert error={error} onRetry={() => refetch()} />
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4">Risk</th>
              <th className="py-3 px-3">Severity</th>
              <th className="py-3 px-4">Finding Title</th>
              <th className="py-3 px-3">Voucher ID</th>
              <th className="py-3 px-3">Detector</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-3">Posting Date</th>
              <th className="py-3 px-4">Counterparty</th>
              <th className="py-3 px-3 text-center">Evidence</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              // Loading Skeleton
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-3 px-4"><div className="h-4 w-8 bg-slate-200 rounded" /></td>
                  <td className="py-3 px-3"><div className="h-4 w-16 bg-slate-200 rounded" /></td>
                  <td className="py-3 px-4"><div className="h-4 w-48 bg-slate-200 rounded" /></td>
                  <td className="py-3 px-3"><div className="h-4 w-20 bg-slate-200 rounded" /></td>
                  <td className="py-3 px-3"><div className="h-4 w-20 bg-slate-200 rounded" /></td>
                  <td className="py-3 px-4 text-right"><div className="h-4 w-20 bg-slate-200 rounded ml-auto" /></td>
                  <td className="py-3 px-3"><div className="h-4 w-20 bg-slate-200 rounded" /></td>
                  <td className="py-3 px-4"><div className="h-4 w-28 bg-slate-200 rounded" /></td>
                  <td className="py-3 px-3 text-center"><div className="h-4 w-8 bg-slate-200 rounded mx-auto" /></td>
                  <td className="py-3 px-4 text-center"><div className="h-6 w-16 bg-slate-200 rounded mx-auto" /></td>
                </tr>
              ))
            ) : Array.isArray(data?.items) && data.items.length > 0 ? (
              data.items.map((finding: Finding) => (
                <tr
                  key={finding.finding_id}
                  onClick={() => setSelectedFindingId(finding.finding_id)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                >
                  {/* Risk Score */}
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[11px] ${
                        finding.risk_score >= 85
                          ? "bg-red-100 text-red-800"
                          : finding.risk_score >= 70
                          ? "bg-orange-100 text-orange-800"
                          : finding.risk_score >= 40
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {finding.risk_score}
                    </span>
                  </td>

                  {/* Severity Badge */}
                  <td className="py-3 px-3">
                    <StatusBadge type="severity" value={finding.severity} size="sm" />
                  </td>

                  {/* Finding Title */}
                  <td className="py-3 px-4 font-medium text-slate-900 group-hover:text-brand-600 transition-colors max-w-xs truncate" title={finding.title}>
                    {finding.title}
                  </td>

                  {/* Transaction ID */}
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                    {finding.transaction_id}
                  </td>

                  {/* Detector */}
                  <td className="py-3 px-3">
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {finding.primary_detector}
                    </span>
                  </td>

                  {/* Amount */}
                  <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                    {formatINR(finding.amount)}
                  </td>

                  {/* Posting Date */}
                  <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                    {formatDate(finding.posting_date)}
                  </td>

                  {/* Counterparty */}
                  <td className="py-3 px-4 text-slate-700 max-w-[140px] truncate" title={finding.vendor_name}>
                    {finding.vendor_name}
                  </td>

                  {/* Evidence Count */}
                  <td className="py-3 px-3 text-center">
                    <span className="font-mono px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px]">
                      {finding.evidence?.length || 0}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setSelectedFindingId(finding.finding_id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 font-semibold transition-colors text-[11px]"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Evidence</span>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              // Empty State
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-500">
                  <FileQuestion className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No findings matched your filter</p>
                  <p className="text-xs text-slate-400 mt-0.5">Try selecting "All" severities or adjusting search keywords.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {data && (
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing {Array.isArray(data?.items) ? data.items.length : 0} items (Page cursor: {cursor || "Start"})
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={cursorHistory.length === 0}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <button
              onClick={handleNextPage}
              disabled={!data.has_more}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
