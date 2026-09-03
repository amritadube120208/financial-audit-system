"use client";

import React from "react";
import { Repeat, Clock, ArrowRight, ShieldAlert, Percent, GitCommit } from "lucide-react";
import { CycleInfo } from "../../lib/types/api";

interface RoundTripInvestigationProps {
  cycleInfo: CycleInfo | undefined | null;
  vendorName: string;
}

export const RoundTripInvestigation: React.FC<RoundTripInvestigationProps> = ({
  cycleInfo,
  vendorName,
}) => {
  if (!cycleInfo || !cycleInfo.has_cycle) return null;

  return (
    <div className="bg-gradient-to-r from-red-950 via-slate-900 to-indigo-950 text-white rounded-xl p-6 shadow-md border border-red-900/40 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-red-600/30 text-red-400 border border-red-500/40">
            <Repeat className="w-5 h-5 animate-spin" style={{ animationDuration: "12s" }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              Why This Money Flow Matters
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-red-500 text-white font-bold">
                Circular Round-Trip Red Flag
              </span>
            </h3>
            <p className="text-xs text-slate-300">
              Closed loop transaction cycle detected returning capital back to initiating accounts
            </p>
          </div>
        </div>

        <div className="text-right font-mono">
          <span className="text-xs text-slate-400 block">Circularity Index</span>
          <span className="text-lg font-bold text-red-400">
            {cycleInfo.amount_similarity_pct}% Return Ratio
          </span>
        </div>
      </div>

      {/* Cycle Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
            <GitCommit className="w-3.5 h-3.5 text-amber-400" />
            <span>Loop Hops</span>
          </div>
          <div className="text-base font-bold font-mono text-white">
            {cycleInfo.hops} Intermediate Hops
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Time Window</span>
          </div>
          <div className="text-base font-bold font-mono text-white">
            {cycleInfo.time_window_hours} Hours
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
            <Percent className="w-3.5 h-3.5 text-emerald-400" />
            <span>Amount Similarity</span>
          </div>
          <div className="text-base font-bold font-mono text-white">
            {cycleInfo.amount_similarity_pct}%
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>Audit Impact</span>
          </div>
          <div className="text-base font-bold font-mono text-red-300 truncate">
            Turnover Inflation
          </div>
        </div>
      </div>

      {/* Cycle Path Traversal */}
      {cycleInfo.cycle_path && cycleInfo.cycle_path.length > 0 && (
        <div className="p-3 bg-black/30 rounded-lg border border-white/10 text-xs">
          <span className="text-[11px] text-slate-400 block mb-1 font-semibold uppercase">
            Traversed Circular Route:
          </span>
          <div className="flex flex-wrap items-center gap-2 font-mono text-slate-200">
            {cycleInfo.cycle_path.map((node, i) => (
              <React.Fragment key={i}>
                <span
                  className={`px-2 py-1 rounded ${
                    node === vendorName
                      ? "bg-red-600/40 text-red-200 font-bold border border-red-500/50"
                      : "bg-white/10 text-slate-300"
                  }`}
                >
                  {node}
                </span>
                {i < cycleInfo.cycle_path.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <p className="text-[11px] text-slate-400 italic">
        {cycleInfo.risk_contribution || "High circularity indicates non-substantive commercial exchange aimed at window dressing financial disclosures."}
      </p>
    </div>
  );
};
