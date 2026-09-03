"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, ShieldAlert, Cpu, Network, FileSpreadsheet } from "lucide-react";
import { formatINR } from "@/lib/utils";

interface DetectorSpec {
  id: string;
  name: string;
  category: "DETERMINISTIC RULE" | "STATISTICAL ML" | "GRAPH FORENSIC" | "RECONCILIATION";
  description: string;
  algorithm: string;
  ruleCode: string;
  threshold: string;
}

const DETECTORS: DetectorSpec[] = [
  {
    id: "graph_cycles",
    name: "Closed Graph Cycles & Circular Flows",
    category: "GRAPH FORENSIC",
    description: "Detects closed money loops where funds circulate between entities A → B → C → A to inflate ledger turnover without economic substance.",
    algorithm: "Tarjan's strongly connected components (SCC) + Simple Directed Cycle Enumeration with amount uniformity weighting.",
    ruleCode: "RULE_GRAPH_CYCLE_01",
    threshold: "Cycles of 2–4 nodes, scored using amount similarity and posting dates",
  },
  {
    id: "duplicate",
    name: "Exact & Near-Duplicate Disbursements",
    category: "DETERMINISTIC RULE",
    description: "Surfaces duplicate payments made to identical or phonetically similar vendor accounts within narrow date windows.",
    algorithm: "Multi-key hashing + Levenshtein distance on counterparty normalized identifiers with exact amount match.",
    ruleCode: "RULE_DUP_TX_02",
    threshold: "Exact invoice and amount matches; near duplicates use amount and date proximity",
  },
  {
    id: "rapid_reversal",
    name: "Rapid Reversals & Balancing Offsets",
    category: "DETERMINISTIC RULE",
    description: "Identifies transactions matched with an opposite-sign cancellation within hours, commonly used to conceal temporary overdrafts.",
    algorithm: "Bipartite ledger pairing with opposite polarity debit/credit matching and posting timestamp disparity.",
    ruleCode: "RULE_REV_TX_04",
    threshold: "Opposite-sign amounts within the configured posting window",
  },
  {
    id: "isolation_forest",
    name: "Multivariate Isolation Forest Outliers",
    category: "STATISTICAL ML",
    description: "Unsupervised machine learning isolating multi-dimensional statistical outliers across amount, time-of-day, day-of-month, and velocity.",
    algorithm: "Scikit-Learn IsolationForest with 100 estimators, contamination=0.03, and standardized financial feature vectors.",
    ruleCode: "ML_ISOFOREST_01",
    threshold: "Calibrated threshold stored in the versioned model metadata",
  },
  {
    id: "gst_mismatch",
    name: "GST-to-Ledger Invoice Mismatches",
    category: "RECONCILIATION",
    description: "Surfaces explicit GST mismatch markers in the uploaded ledger for review against independent tax records.",
    algorithm: "GSTIN tax identification cross-reference + reverse charge mechanism (RCM) reconciliation.",
    ruleCode: "RULE_GST_REC_01",
    threshold: "Explicit GST_MISMATCH marker in source narration",
  },
];

interface AnomalyMatrixProps {
  activeRunId: string | null;
}

export function AnomalyMatrix({ activeRunId }: AnomalyMatrixProps) {
  const [selectedDetector, setSelectedDetector] = useState<DetectorSpec>(DETECTORS[0]);
  return (
    <div className="border border-[rgba(237,231,220,0.13)] bg-[#101317] rounded-sm overflow-hidden">
      {/* Console Header Bar */}
      <div className="px-5 py-3.5 border-b border-[rgba(237,231,220,0.1)] bg-[#0A0C0E] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-[#EDE7DC]">
          <Cpu className="h-3.5 w-3.5 text-[#E8913C]" />
          <span className="font-semibold uppercase tracking-[0.1em]">MULTI-ENGINE FORENSIC CONSOLE</span>
          <span className="text-[#6C7378]">{"//"} DETECTOR GUIDE</span>
        </div>

      </div>

      {/* Main Console Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[rgba(237,231,220,0.1)]">
        {/* Left: Engine Selector List */}
        <div className="lg:col-span-5 p-2 space-y-1">
          {DETECTORS.map((detector) => {
            const isSelected = detector.id === selectedDetector.id;
            return (
              <button
                key={detector.id}
                onClick={() => setSelectedDetector(detector)}
                className={`w-full text-left p-3.5 rounded-sm transition-all flex items-start justify-between gap-3 ${
                  isSelected
                    ? "bg-[#0A0C0E] border border-[rgba(237,231,220,0.2)] shadow-sm"
                    : "hover:bg-[#0A0C0E]/50 border border-transparent"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isSelected ? "bg-[#E8913C]" : "bg-[#2E6B72]"
                      }`}
                    />
                    <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#6C7378]">
                      {detector.category}
                    </span>
                  </div>
                  <h4
                    className={`font-display font-semibold text-sm transition-colors ${
                      isSelected ? "text-[#EDE7DC]" : "text-[#9EA5A8]"
                    }`}
                  >
                    {detector.name}
                  </h4>
                </div>

                <span className="text-[11px] font-mono text-[#E8913C] mt-1 shrink-0">
                  {detector.ruleCode.split("_")[1]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Engine Telemetry & Inspector */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-[#0A0C0E]/40">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[rgba(237,231,220,0.1)]">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#2E6B72] block">
                  {selectedDetector.category} {"//"} {selectedDetector.ruleCode}
                </span>
                <h3 className="font-display font-bold text-xl sm:text-2xl text-[#EDE7DC] mt-1 tracking-tight">
                  {selectedDetector.name}
                </h3>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 border border-[#2E6B72]/40 text-[#2E6B72] bg-[#2E6B72]/10 rounded-sm self-start sm:self-auto">
                <CheckCircle2 className="h-3 w-3" /> DETECTION METHOD
              </span>
            </div>

            {/* Description */}
            <p className="text-sm font-body text-[#9EA5A8] leading-relaxed">
              {selectedDetector.description}
            </p>

            {/* Algorithm & Heuristics */}
            <div className="space-y-3 p-4 bg-[#101317] border border-[rgba(237,231,220,0.08)] rounded-sm text-xs font-mono">
              <div>
                <span className="text-[#6C7378] uppercase text-[10px] tracking-[0.12em] block mb-1">
                  MATHEMATICAL ENGINE / ALGORITHM
                </span>
                <span className="text-[#EDE7DC] block">{selectedDetector.algorithm}</span>
              </div>
              <div className="pt-2 border-t border-[rgba(237,231,220,0.08)]">
                <span className="text-[#6C7378] uppercase text-[10px] tracking-[0.12em] block mb-1">
                  DETECTION THRESHOLD BOUNDARY
                </span>
                <span className="text-[#E8913C] block">{selectedDetector.threshold}</span>
              </div>
            </div>

          </div>

          {/* Action CTA */}
          <div className="pt-4 border-t border-[rgba(237,231,220,0.1)] flex items-center justify-between">
            <span className="text-xs font-mono text-[#6C7378]">
              ENGINE REPOSITORY ID: <span className="text-[#EDE7DC]">{selectedDetector.id}</span>
            </span>
            <Link
              href={activeRunId ? `/audit?run=${activeRunId}` : "/audit"}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-[rgba(237,231,220,0.2)] bg-[#101317] hover:border-[#E8913C] text-[#EDE7DC] hover:text-[#E8913C] text-xs font-mono uppercase tracking-[0.12em] transition-colors"
            >
              RUN IN AUDIT WORKSPACE <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
