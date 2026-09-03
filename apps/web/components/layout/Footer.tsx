import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border bg-surface mt-16 py-8 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="font-medium text-slate-700">AuditGraph Enterprise</span>
          <span>•</span>
          <span>Explainable Multi-Engine Anomaly Triage for Statutory & Tax Audits</span>
        </div>

        <div className="text-center md:text-right text-[11px] text-slate-500 max-w-xl">
          <strong className="text-slate-600">Statutory Notice:</strong> Priority scores reflect algorithmic audit prioritization based on historical variances, graph circularity, and rule compliance. Not an automated fraud determination.
        </div>
      </div>
    </footer>
  );
};
