"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { uploadDatasetFile } from "../../lib/api/datasets";
import { Dataset } from "../../lib/types/api";
import { formatBytes } from "../../lib/utils/formatters";
import { ErrorEnvelopeAlert } from "../system/ErrorEnvelopeAlert";

interface FileDropzoneProps {
  onDatasetUploaded: (dataset: Dataset) => void;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({ onDatasetUploaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<Error | null>(null);
  const [fileHash, setFileHash] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const calculateSha256 = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const handleFile = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(ext || "")) {
      setUploadError(new Error("Please upload a CSV or XLSX spreadsheet."));
      return;
    }

    setUploadError(null);
    setSelectedFile(file);
    try {
      const hash = await calculateSha256(file);
      setFileHash(hash);
    } catch {
      // Browser crypto fallback
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const dataset = await uploadDatasetFile(selectedFile);
      onDatasetUploaded(dataset);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err : new Error("Failed to upload dataset"));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? "border-brand-500 bg-brand-50/50"
            : "border-slate-300 hover:border-brand-400 bg-slate-50/50 hover:bg-slate-50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-600">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Click to browse or drag and drop general ledger
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports CSV, XLSX up to 100,000+ transaction rows
            </p>
          </div>
        </div>
      </div>

      {uploadError && <ErrorEnvelopeAlert error={uploadError} />}

      {selectedFile && (
        <div className="bg-white border border-border rounded-lg p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">{selectedFile.name}</p>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                <span>{formatBytes(selectedFile.size)}</span>
                <span>•</span>
                <span className="font-mono text-[11px] truncate max-w-[200px]" title={fileHash}>
                  SHA-256: {fileHash ? `${fileHash.slice(0, 10)}...` : "Calculating..."}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleUpload();
            }}
            disabled={isUploading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Ingesting Dataset...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Validate & Ingest</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
