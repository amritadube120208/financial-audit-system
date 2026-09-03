"use client";

import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileSpreadsheet, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { uploadDataset, createAuditRun, getErrorMessage } from "@/lib/api";
import type { DatasetUploadResponse } from "@/lib/types";
import { ValidationCard } from "./validation-card";
import { useAuditContextStore } from "@/stores/audit-context-store";

export function UploadDropzone() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setLastActiveRunId } = useAuditContextStore();

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [datasetInfo, setDatasetInfo] = useState<DatasetUploadResponse | null>(null);
  const [isStartingRun, setIsStartingRun] = useState(false);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (![".csv", ".xlsx"].includes(ext)) {
      setErrorMessage("Only CSV (.csv) and Excel (.xlsx) accounting ledgers are accepted.");
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const result = await uploadDataset(file, (pct) => setUploadProgress(pct));
      setDatasetInfo(result);
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
      setSelectedFile(null);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleStartAudit = async () => {
    if (!datasetInfo) return;
    setIsStartingRun(true);
    setErrorMessage(null);

    try {
      const run = await createAuditRun({ dataset_id: datasetInfo.dataset_id });
      setLastActiveRunId(run.run_id);
      // Navigate directly to the Audit page per requirement
      router.push(`/audit/${run.run_id}`);
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
      setIsStartingRun(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setDatasetInfo(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div id="upload-section" className="py-12">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">Upload Accounting Ledger</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Accepts standard SME general ledger files (.csv, .xlsx). Data is hashed with SHA-256 for audit immutability.
          </p>
        </div>

        {/* Dropzone Box */}
        {!datasetInfo && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all ${
              isDragging
                ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/5"
                : "border-border/80 bg-card/40 hover:border-emerald-500/50 hover:bg-card/70"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
              <UploadCloud className="h-7 w-7" />
            </div>

            <h3 className="text-base font-semibold text-foreground">
              {isUploading ? "Uploading & Fingerprinting..." : "Drag and drop your financial file here"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1.5 max-w-sm mx-auto">
              or click to browse your computer. Supports SME General Ledgers, Bank Feeds, and GST Return Snapshots.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3 text-xs text-muted-foreground font-mono">
              <span className="px-2.5 py-1 rounded bg-secondary border border-border/80">.CSV</span>
              <span className="px-2.5 py-1 rounded bg-secondary border border-border/80">.XLSX</span>
              <span>Max 100 MB</span>
            </div>

            {/* Upload Progress */}
            {isUploading && uploadProgress !== null && (
              <div className="mt-6 max-w-xs mx-auto">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Uploading...</span>
                  <span className="font-mono">{uploadProgress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-4 p-4 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-xs flex items-start gap-3">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block">Validation Error:</span>
              <p className="mt-0.5 text-foreground/90">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Verified Dataset Card */}
        {datasetInfo && (
          <div>
            <div className="flex justify-end mb-2">
              <button
                onClick={resetUpload}
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" /> Upload Different File
              </button>
            </div>
            <ValidationCard
              dataset={datasetInfo}
              isStartingRun={isStartingRun}
              onStartAudit={handleStartAudit}
            />
          </div>
        )}
      </div>
    </div>
  );
}
