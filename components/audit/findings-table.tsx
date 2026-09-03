"use client";

import { useState } from "react";
import { Search, Eye, ArrowUpRight } from "lucide-react";
import type { FindingItem, Severity } from "@/lib/types";
import { formatINR } from "@/lib/utils";

interface FindingsTableProps {
  findings: FindingItem[];
  isLoading: boolean;
  onSelectFinding: (findingId: string) => void;
  selectedFindingId: string | null;
}

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
    <div className="border border-[rgba(237,231,220,0.13)] bg-[#101317] rounded-sm overflow-hidden my-6">
      {/* Header & Filter Controls */}
      <div className="p-4 sm:p-5 border-b border-[rgba(237,231,220,0.1)] bg-[#0A0C0E] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E8913C]" />
            <span className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-[#6C7378]">
              INVESTIGATION QUEUE {"//"} RANKED TRIAGE
            </span>
          </div>
          <h3 className="font-display font-bold text-base sm:text-lg text-[#EDE7DC] mt-0.5 tracking-tight">
            Surfaced Findings ({filtered.length})
          </h3>
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6C7378]" />
            <input
              type="text"
              placeholder="Search case or vendor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 pr-2.5 rounded-sm border border-[rgba(237,231,220,0.13)] bg-[#101317] text-xs text-[#EDE7DC] placeholder:text-[#6C7378] focus:outline-none focus:border-[#E8913C]"
            />
          </div>

          {/* Severity Dropdown */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="h-8 px-2.5 rounded-sm border border-[rgba(237,231,220,0.13)] bg-[#101317] text-xs text-[#EDE7DC] focus:outline-none focus:border-[#E8913C]"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Min Risk Filter */}
          <select
            value={minRisk}
            onChange={(e) => setMinRisk(Number(e.target.value))}
            className="h-8 px-2.5 rounded-sm border border-[rgba(237,231,220,0.13)] bg-[#101317] text-xs text-[#EDE7DC] focus:outline-none focus:border-[#E8913C]"
          >
            <option value="0">All Risk Scores</option>
            <option value="50">Risk &gt;= 50</option>
            <option value="75">Risk &gt;= 75</option>
            <option value="90">Risk &gt;= 90</option>
          </select>
        </div>
      </div>

      {/* Desktop Multi-column Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0A0C0E] text-[#6C7378] uppercase text-[10.5px] tracking-[0.14em] border-b border-[rgba(237,231,220,0.1)] font-mono">
            <tr>
              <th className="py-3 px-4 font-normal">Severity</th>
              <th className="py-3 px-4 font-normal">Risk</th>
              <th className="py-3 px-4 font-normal">Investigation Title</th>
              <th className="py-3 px-4 font-normal">Primary Entity</th>
              <th className="py-3 px-4 font-normal">Exposure</th>
              <th className="py-3 px-4 font-normal">Txns</th>
              <th className="py-3 px-4 font-normal">Detector Family</th>
              <th className="py-3 px-4 font-normal text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(237,231,220,0.08)] font-body">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-[#9EA5A8]">
                  <div className="flex items-center justify-center gap-2 font-mono text-xs">
                    <span className="h-3.5 w-3.5 border-2 border-[#E8913C] border-t-transparent rounded-full animate-spin" />
                    <span>Loading prioritized investigations...</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-[#6C7378] font-mono text-xs">
                  NO FINDINGS MATCH THE CURRENT CRITERIA.
                </td>
              </tr>
            ) : (
              filtered.map((f) => {
                const isSelected = selectedFindingId === f.finding_id;

                return (
                  <tr
                    key={f.finding_id}
                    onClick={() => onSelectFinding(f.finding_id)}
                    className={`cursor-pointer transition-colors duration-150 ${
                      isSelected
                        ? "bg-[#0A0C0E] border-l-2 border-l-[#E8913C]"
                        : "hover:bg-[#0A0C0E]/60"
                    }`}
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase tracking-[0.12em] border ${
                          f.severity === "critical"
                            ? "text-[#E8913C] border-[#E8913C]/40 bg-[#E8913C]/10"
                            : f.severity === "high"
                            ? "text-[#EDE7DC] border-[rgba(237,231,220,0.25)] bg-[#0A0C0E]"
                            : "text-[#9EA5A8] border-[rgba(237,231,220,0.12)] bg-[#0A0C0E]"
                        }`}
                      >
                        {f.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold whitespace-nowrap">
                      <span
                        className={
                          f.risk_score >= 80
                            ? "text-[#E8913C]"
                            : f.risk_score >= 60
                            ? "text-[#EDE7DC]"
                            : "text-[#2E6B72]"
                        }
                      >
                        {f.risk_score}
                      </span>
                      <span className="text-[#6C7378] text-[10px]">/100</span>
                    </td>
                    <td className="py-3.5 px-4 font-display font-semibold text-[#EDE7DC] max-w-xs truncate">
                      {f.title}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#9EA5A8] truncate max-w-[140px]">
                      {f.primary_entity || "-"}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#EDE7DC] whitespace-nowrap">
                      {formatINR(f.monetary_exposure)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#9EA5A8]">
                      {f.transaction_count}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#6C7378] text-[11px] uppercase">
                      {f.detector_family}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectFinding(f.finding_id);
                        }}
                        className="inline-flex items-center gap-1 border border-[rgba(237,231,220,0.2)] bg-[#0A0C0E] hover:border-[#E8913C] text-[#EDE7DC] hover:text-[#E8913C] px-2.5 py-1 text-xs font-mono uppercase tracking-[0.1em] transition-colors rounded-sm"
                      >
                        <Eye className="h-3 w-3" />
                        INVESTIGATE
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Two-Column Collapsed Layout (Prevents Horizontal Overflow) */}
      <div className="md:hidden divide-y divide-[rgba(237,231,220,0.1)]">
        {filtered.map((f) => (
          <div
            key={f.finding_id}
            onClick={() => onSelectFinding(f.finding_id)}
            className="p-4 space-y-2 hover:bg-[#0A0C0E]/50 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#E8913C]">
                {f.severity} {"//"} RISK {f.risk_score}/100
              </span>
              <span className="font-mono text-xs font-bold text-[#EDE7DC]">
                {formatINR(f.monetary_exposure)}
              </span>
            </div>
            <h4 className="font-display font-semibold text-sm text-[#EDE7DC]">
              {f.title}
            </h4>
            <div className="flex items-center justify-between text-[11px] font-mono text-[#9EA5A8] pt-1">
              <span>{f.primary_entity || "Multiple Counterparties"}</span>
              <span className="text-[#E8913C] flex items-center gap-0.5">
                DETAILS <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
