"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { FileCheck, AlertTriangle, CheckCircle2, XCircle, Building } from "lucide-react";
import { getGstReconciliation } from "../../lib/api/findings";
import { formatINR } from "../../lib/utils/formatters";

interface GstPanelProps {
  runId: string;
}

export const GstPanel: React.FC<GstPanelProps> = ({ runId }) => {
  const { data: gst, isLoading } = useQuery({
    queryKey: ["gst", runId],
    queryFn: () => getGstReconciliation(runId),
  });

  if (isLoading) {
    return (
      <div className="bg-white border border-border rounded-xl p-6 shadow-sm text-xs text-slate-500">
        Loading GST reconciliation metrics...
      </div>
    );
  }

  if (!gst || !gst.enabled) {
    return (
      <div className="bg-white border border-border rounded-xl p-8 shadow-sm text-center space-y-2">
        <FileCheck className="w-8 h-8 text-slate-300 mx-auto" />
        <h3 className="text-sm font-semibold text-slate-700">
          GST reconciliation not enabled for this audit
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          To run automated GSTR-2B purchase register matching, enable the GST Reconciliation toggle when configuring the audit engagement.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-brand-600" />
            GSTR-2B vs Books Purchase Reconciliation
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated invoice tax matching & Input Tax Credit (ITC) eligibility verification
          </p>
        </div>

        {/* Metric summary badges */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
            {gst.total_matched} Matched
          </span>
          <span className="px-2.5 py-1 rounded-md bg-red-50 text-red-700 border border-red-200 font-semibold">
            {gst.total_mismatched} Discrepancies
          </span>
          <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-mono font-bold">
            Diff: {formatINR(gst.total_discrepancy_inr)}
          </span>
        </div>
      </div>

      {/* GST Discrepancy Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Invoice Number</th>
              <th className="py-2.5 px-3">Counterparty</th>
              <th className="py-2.5 px-3">GSTIN</th>
              <th className="py-2.5 px-3 text-right">Books Amount</th>
              <th className="py-2.5 px-3 text-right">GST Snapshot</th>
              <th className="py-2.5 px-3 text-right">Difference</th>
              <th className="py-2.5 px-3 text-right">Tax (18%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {gst.items && gst.items.length > 0 ? (
              gst.items.slice(0, 15).map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-3">
                    {item.status === "MATCHED" ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Matched
                      </span>
                    ) : item.status === "MISMATCHED" ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] border border-amber-200">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        Mismatch
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded text-[11px] border border-red-200">
                        <XCircle className="w-3 h-3 text-red-600" />
                        Missing GST
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-medium text-slate-800">
                    {item.invoice_number}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 max-w-xs truncate">
                    {item.vendor_name}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                    {item.gstin}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800">
                    {formatINR(item.books_amount)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                    {formatINR(item.gst_snapshot_amount)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-red-600">
                    {item.difference > 0 ? `+${formatINR(item.difference)} (${item.difference_pct}%)` : "—"}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                    {formatINR(item.tax_amount)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-6 text-center text-slate-400">
                  No purchase records evaluated.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
