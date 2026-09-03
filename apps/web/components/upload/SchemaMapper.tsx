"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, ArrowRight, Hash, Database } from "lucide-react";
import { Dataset } from "../../lib/types/api";
import { formatBytes, truncateHash } from "../../lib/utils/formatters";

interface SchemaMapperProps {
  dataset: Dataset;
}

export const SchemaMapper: React.FC<SchemaMapperProps> = ({ dataset }) => {
  const standardFields = [
    { key: "transaction_id", label: "Transaction ID", required: true },
    { key: "posting_date", label: "Posting Date", required: true },
    { key: "amount", label: "Transaction Amount", required: true },
    { key: "vendor_name", label: "Vendor / Counterparty", required: true },
    { key: "invoice_number", label: "Invoice Number", required: false },
    { key: "narration", label: "Narration / Description", required: false },
  ];

  return (
    <div className="bg-white border border-border rounded-xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-brand-600" />
            Ingested Dataset Schema Mapping
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Auto-detected columns mapped to standard AuditGraph ledger schema
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-mono">
            {dataset.row_count.toLocaleString()} rows
          </span>
          <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-mono">
            {dataset.column_count} columns
          </span>
          <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
            {dataset.detected_format}
          </span>
        </div>
      </div>

      {/* Warnings */}
      {dataset.warnings && dataset.warnings.length > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            {dataset.warnings.map((w, idx) => (
              <p key={idx}>{w}</p>
            ))}
          </div>
        </div>
      )}

      {/* Visual Schema Mapping Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {standardFields.map((field) => {
          const mappedCol = dataset.schema_mapping[field.key];
          const isMapped = Boolean(mappedCol);

          return (
            <div
              key={field.key}
              className={`p-3 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                isMapped
                  ? "bg-slate-50/70 border-slate-200"
                  : "bg-red-50/50 border-red-200 text-red-700"
              }`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span>{field.label}</span>
                  {field.required && <span className="text-red-500 font-bold">*</span>}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                  <span>source</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className="font-semibold text-slate-800 truncate max-w-[120px]">
                    {mappedCol || "Not Mapped"}
                  </span>
                </div>
              </div>

              {isMapped ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Dataset Fingerprint */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-mono">
        <div className="flex items-center gap-1.5">
          <Hash className="w-3.5 h-3.5 text-slate-400" />
          <span>SHA-256: {dataset.sha256}</span>
        </div>
        <div>
          <span>Size: {formatBytes(dataset.file_size_bytes)}</span>
        </div>
      </div>
    </div>
  );
};
