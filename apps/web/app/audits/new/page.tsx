"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileSpreadsheet, ShieldAlert } from "lucide-react";
import { FileDropzone } from "../../../components/upload/FileDropzone";
import { SchemaMapper } from "../../../components/upload/SchemaMapper";
import { AuditConfigPanel } from "../../../components/upload/AuditConfigPanel";
import { Dataset } from "../../../lib/types/api";

export default function NewAuditPage() {
  const [activeDataset, setActiveDataset] = useState<Dataset | null>(null);

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Landing</span>
        </Link>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <FileSpreadsheet className="w-6 h-6 text-brand-600" />
          <span>New SME Audit Engagement</span>
        </h1>
        <p className="text-xs text-slate-500">
          Upload accounting ledger vouchers (CSV or XLSX) to initiate multi-engine anomaly triage
        </p>
      </div>

      <div className="space-y-6">
        {!activeDataset ? (
          <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
            <FileDropzone onDatasetUploaded={(ds) => setActiveDataset(ds)} />
          </div>
        ) : (
          <div className="space-y-6">
            <SchemaMapper dataset={activeDataset} />
            <AuditConfigPanel dataset={activeDataset} />
          </div>
        )}
      </div>
    </div>
  );
}
