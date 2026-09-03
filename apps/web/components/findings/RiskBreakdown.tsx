"use client";

import React from "react";
import { DetectorContributions } from "../../lib/types/api";

interface RiskBreakdownProps {
  contributions?: DetectorContributions;
  riskScore: number;
  className?: string;
}

export const RiskBreakdown: React.FC<RiskBreakdownProps> = ({
  contributions = { rules: 35.0, ml: 25.0, graph: 25.0, materiality: 15.0 },
  riskScore,
  className = "",
}) => {
  const families = [
    { label: "Rules", pct: contributions.rules, color: "bg-blue-500", text: "text-blue-700" },
    { label: "ML Anomaly", pct: contributions.ml, color: "bg-purple-500", text: "text-purple-700" },
    { label: "Graph Cycles", pct: contributions.graph, color: "bg-amber-500", text: "text-amber-700" },
    { label: "Materiality", pct: contributions.materiality, color: "bg-emerald-500", text: "text-emerald-700" },
  ];

  return (
    <div className={`space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs ${className}`}>
      <div className="flex items-center justify-between">
        <span className="font-bold text-slate-800">Risk Fusion Weight Contribution</span>
        <span className="font-mono font-bold text-brand-700 text-sm">
          Priority Score: {riskScore}/100
        </span>
      </div>

      {/* Segmented Weight Bar */}
      <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-slate-200">
        {families.map((fam) => (
          <div
            key={fam.label}
            className={`${fam.color} transition-all duration-300`}
            style={{ width: `${fam.pct}%` }}
            title={`${fam.label}: ${fam.pct}%`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
        {families.map((fam) => (
          <div key={fam.label} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${fam.color}`} />
            <span className="text-slate-600 truncate">{fam.label}:</span>
            <strong className="font-mono text-slate-900">{fam.pct}%</strong>
          </div>
        ))}
      </div>

      {/* Mandatory Statutory Disclaimer */}
      <div className="pt-2 border-t border-slate-200/80 text-[10px] text-slate-500 italic">
        "This is an audit-priority score, not a fraud probability."
      </div>
    </div>
  );
};
