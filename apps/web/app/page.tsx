"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileSpreadsheet,
  Play,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Network,
  Cpu,
  Calculator,
  CheckCircle2,
  TrendingDown,
  Layers,
} from "lucide-react";
import { FileDropzone } from "../components/upload/FileDropzone";
import { SchemaMapper } from "../components/upload/SchemaMapper";
import { AuditConfigPanel } from "../components/upload/AuditConfigPanel";
import { Dataset } from "../lib/types/api";

export default function LandingPage() {
  const router = useRouter();
  const [activeDataset, setActiveDataset] = useState<Dataset | null>(null);

  const engines = [
    {
      title: "1. Deterministic Rules",
      weight: "35% Baseline Weight",
      desc: "Instant statutory checks for duplicate invoices, weekend posting violations, round-sum structuring, and fiscal year-end cutoff rushes.",
      icon: Calculator,
      color: "text-blue-600 bg-blue-50 border-blue-200",
    },
    {
      title: "2. ML Anomaly Detection",
      weight: "25% Baseline Weight",
      desc: "Unsupervised IsolationForest and multi-variate statistical modeling identifying severe counterparty disbursement and velocity anomalies.",
      icon: Cpu,
      color: "text-purple-600 bg-purple-50 border-purple-200",
    },
    {
      title: "3. Transaction Graph",
      weight: "25% Baseline Weight",
      desc: "Directed graph traversal detecting multi-hop circular round-tripping, vendor-customer layering, and artificial turnover inflation.",
      icon: Network,
      color: "text-amber-600 bg-amber-50 border-amber-200",
    },
    {
      title: "4. Materiality Analysis",
      weight: "15% Baseline Weight",
      desc: "Audit benchmark scaling aligned with ICAI/statutory materiality thresholds, paired with GSTR-2B purchase register reconciliation.",
      icon: ShieldAlert,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    },
  ];

  return (
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto space-y-6 pt-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          <span>Explainable Multi-Engine Financial Anomaly Triage for SME Audits</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Turn <span className="text-brand-600 font-mono">100,000+</span> ledger transactions into a prioritized audit queue.
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Detect duplicate entries, unusual behavior, round-tripping, backdating, GST mismatches and other audit red flags with explainable evidence.
        </p>

        {/* Primary and Secondary CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <a
            href="#upload-section"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Start New Audit</span>
          </a>

          <Link
            href="/audits/run-demo-sme-2026"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold rounded-xl border border-slate-300 shadow-xs transition-all"
          >
            <Play className="w-4 h-4 text-brand-600 fill-brand-600" />
            <span>View Demo Audit (100k Rows)</span>
          </Link>
        </div>
      </section>

      {/* Four Evidence Engines Grid */}
      <section className="space-y-4 pt-4">
        <div className="text-center space-y-1">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Four Orthogonal Evidence Engines
          </h2>
          <p className="text-sm font-semibold text-slate-800">
            Grounded multi-model evidence synthesis for explainable CA triage
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {engines.map((eng) => {
            const Icon = eng.icon;
            return (
              <div
                key={eng.title}
                className="bg-white border border-border rounded-xl p-5 shadow-sm space-y-2.5 transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg border ${eng.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-slate-500">
                    {eng.weight}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">{eng.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{eng.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Upload and Configuration Workflow Area */}
      <section id="upload-section" className="pt-6 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Launch New Audit Engagement
          </h2>
          <p className="text-xs text-slate-500">
            Upload client general ledger to calculate fingerprints, detect schema, and configure detectors
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
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
      </section>
    </div>
  );
}
