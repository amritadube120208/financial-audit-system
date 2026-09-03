"use client";

import { useState } from "react";
import { Search, Filter, AlertTriangle, ShieldAlert, ArrowUpDown, ChevronRight, Eye } from "lucide-react";
import type { FindingItem, Severity } from "@/lib/types";
import { formatINR } from "@/lib/utils";

interface FindingsTableProps {
  findings: FindingItem[];
  isLoading: boolean;
  onSelectFinding: (findingId: string) => void;
  selectedFindingId: string | null;
}

const SEVERITY_BADGES: Record<Severity, string> = {
  critical: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  high: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  low: "bg-blue-500/10 text-blue-400 border-blue-500/30",
};

export function FindingsTable({
  findings,
  isLoading,
  onSelectFinding,
  selectedFindingId,
}: FindingsTableProps) {
  const [search, setSearch] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [minRisk, setMinRisk] = useState<number>(0);

  const filtered = findings.filter((f) => {
    if (selectedSeverity !== "all" && f.severity !== selectedSeverity) return false;
    if (f.risk_score < minRisk) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = f.title.toLowerCase().includes(q);
      const matchEntity = f.primary_entity?.toLowerCase().includes(q);
      const matchType = f.anomaly_type.toLowerCase().includes(q);
      if (!matchTitle && !matchEntity && !matchType) return false;
    }
    return true;
  });

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden my-6">
      {/* Header & Filter Controls */}
      <div className="p-5 border-b border-border/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-emerald-400" />
            Ranked Investigation Findings ({filtered.length})
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Surfaced cases ordered by normalized multi-engine risk score and materiality exposure.
          </p>
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search findings, entities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 pr-3 rounded-lg border border-border bg-secondary/50 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Severity Dropdown */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-border bg-secondary/50 text-xs text-foreground focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical Only</option>
            <option value="high">High Only</option>
            <option value="medium">Medium Only</option>
            <option value="low">Low Only</option>
          </select>

          {/* Min Risk Filter */}
          <select
            value={minRisk}
            onChange={(e) => setMinRisk(Number(e.target.value))}
            className="h-8 px-2.5 rounded-lg border border-border bg-secondary/50 text-xs text-foreground focus:outline-none focus:border-emerald-500"
          >
            <option value="0">All Risk Scores</option>
            <option value="50">Risk &gt;= 50</option>
            <option value="75">Risk &gt;= 75</option>
            <option value="90">Risk &gt;= 90</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-secondary/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/60">
            <tr>
              <th className="py-3 px-4 font-semibold">Severity</th>
              <th className="py-3 px-4 font-semibold">Risk</th>
              <th className="py-3 px-4 font-semibold">Investigation Title</th>
              <th className="py-3 px-4 font-semibold">Primary Entity</th>
              <th className="py-3 px-4 font-semibold">Exposure</th>
              <th className="py-3 px-4 font-semibold">Txns</th>
              <th className="py-3 px-4 font-semibold">Detector</th>
              <th className="py-3 px-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    <span>Loading prioritized investigations...</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-muted-foreground">
                  No suspicious findings match the current filter criteria.
                </td>
              </tr>
            ) : (
              filtered.map((f) => {
                const isSelected = selectedFindingId === f.finding_id;
                const badge = SEVERITY_BADGES[f.severity] || SEVERITY_BADGES.medium;

                return (
                  <tr
                    key={f.finding_id}
                    onClick={() => onSelectFinding(f.finding_id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-emerald-500/10 hover:bg-emerald-500/15"
                        : "hover:bg-secondary/30"
                    }`}
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${badge}`}
                      >
                        {f.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold whitespace-nowrap">
                      <span
                        className={
                          f.risk_score >= 80
                            ? "text-rose-400"
                            : f.risk_score >= 60
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }
                      >
                        {f.risk_score}
                      </span>
                      <span className="text-muted-foreground text-[10px]">/100</span>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate font-medium text-foreground">
                      {f.title}
                    </td>
                    <td className="py-3 px-4 font-mono text-muted-foreground truncate max-w-[120px]">
                      {f.primary_entity || "-"}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-foreground whitespace-nowrap">
                      {formatINR(f.monetary_exposure)}
                    </td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      {f.transaction_count}
                    </td>
                    <td className="py-3 px-4 font-mono text-muted-foreground text-[11px] capitalize">
                      {f.detector_family}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectFinding(f.finding_id);
                        }}
                        className="inline-flex items-center gap-1 rounded bg-secondary hover:bg-secondary/80 text-foreground px-2.5 py-1 text-[11px] font-medium transition-all"
                      >
                        <Eye className="h-3 w-3" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
