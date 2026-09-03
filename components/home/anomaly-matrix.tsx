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
  sampleFlagged: number;
  sampleExposure: number;
  status: "ACTIVE" | "VERIFIED";
}

const DETECTORS: DetectorSpec[] = [
  {
    id: "graph_cycles",
    name: "Closed Graph Cycles & Circular Flows",
    category: "GRAPH FORENSIC",
    description: "Detects closed money loops where funds circulate between entities A → B → C → A to inflate ledger turnover without economic substance.",
    algorithm: "Tarjan's strongly connected components (SCC) + Simple Directed Cycle Enumeration with amount uniformity weighting.",
    ruleCode: "RULE_GRAPH_CYCLE_01",
    threshold: "Cycle length ≤ 5, uniform amount delta ≤ 3.5%, elapsed ≤ 72h",
    sampleFlagged: 3,
    sampleExposure: 1450000,
    status: "ACTIVE",
  },
  {
    id: "duplicate",
    name: "Exact & Near-Duplicate Disbursements",
    category: "DETERMINISTIC RULE",
    description: "Surfaces duplicate payments made to identical or phonetically similar vendor accounts within narrow date windows.",
    algorithm: "Multi-key hashing + Levenshtein distance on counterparty normalized identifiers with exact amount match.",
    ruleCode: "RULE_DUP_TX_02",
    threshold: "Identical amount + posting date Δ ≤ 48h + counterparty similarity ≥ 0.92",
    sampleFlagged: 5,
    sampleExposure: 382000,
    status: "ACTIVE",
  },
  {
    id: "rapid_reversal",
    name: "Rapid Reversals & Balancing Offsets",
    category: "DETERMINISTIC RULE",
    description: "Identifies transactions matched with an opposite-sign cancellation within hours, commonly used to conceal temporary overdrafts.",
    algorithm: "Bipartite ledger pairing with opposite polarity debit/credit matching and posting timestamp disparity.",
    ruleCode: "RULE_REV_TX_04",
    threshold: "Credit-debit inverse match within 24 hours of posting date",
    sampleFlagged: 2,
    sampleExposure: 890000,
    status: "ACTIVE",
  },
  {
    id: "isolation_forest",
    name: "Multivariate Isolation Forest Outliers",
    category: "STATISTICAL ML",
    description: "Unsupervised machine learning isolating multi-dimensional statistical outliers across amount, time-of-day, day-of-month, and velocity.",
    algorithm: "Scikit-Learn IsolationForest with 100 estimators, contamination=0.03, and standardized financial feature vectors.",
    ruleCode: "ML_ISOFOREST_01",
    threshold: "Anomaly score ≤ -0.65 across standardized ledger vectors",
    sampleFlagged: 7,
    sampleExposure: 620000,
    status: "ACTIVE",
  },
  {
    id: "gst_mismatch",
    name: "GST-to-Ledger Invoice Mismatches",
    category: "RECONCILIATION",
    description: "Cross-checks ledger purchase tax credits against counterparty GSTR-2B filing returns to uncover ineligible ITC claims.",
    algorithm: "GSTIN tax identification cross-reference + reverse charge mechanism (RCM) reconciliation.",
    ruleCode: "RULE_GST_REC_01",
    threshold: "Invoice mismatch > ₹5,000 or missing vendor GSTIN in GSTR-2B",
    sampleFlagged: 4,
    sampleExposure: 512000,
    status: "ACTIVE",
  },
];

interface AnomalyMatrixProps {
  activeRunId: string;
}

export function AnomalyMatrix({ activeRunId }: AnomalyMatrixProps) {
  const [selectedDetector, setSelectedDetector] = useState<DetectorSpec>(DETECTORS[0]);
  const [sensitivity, setSensitivity] = useState<"standard" | "stringent">("standard");

  const exposureMultiplier = sensitivity === "stringent" ? 1.35 : 1.0;
  const flaggedMultiplier = sensitivity === "stringent" ? 1.6 : 1.0;

  return (
    <div className="border border-[rgba(237,231,220,0.13)] bg-[#101317] rounded-sm overflow-hidden">
      {/* Console Header Bar */}
      <div className="px-5 py-3.5 border-b border-[rgba(237,231,220,0.1)] bg-[#0A0C0E] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-[#EDE7DC]">
          <Cpu className="h-3.5 w-3.5 text-[#E8913C]" />
          <span className="font-semibold uppercase tracking-[0.1em]">MULTI-ENGINE FORENSIC CONSOLE</span>
          <span className="text-[#6C7378]">{"//"} LIVE TRIAGE MATRIX</span>
        </div>

        {/* Sensitivity Toggle */}
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-[#9EA5A8]">THRESHOLD MODE:</span>
          <div className="inline-flex rounded-sm p-0.5 border border-[rgba(237,231,220,0.13)] bg-[#101317]">
            <button
              onClick={() => setSensitivity("standard")}
              className={`px-2.5 py-0.5 rounded-sm transition-colors ${
                sensitivity === "standard"
                  ? "bg-[#E8913C] text-[#0A0C0E] font-semibold"
                  : "text-[#9EA5A8] hover:text-[#EDE7DC]"
              }`}
            >
              STANDARD (STAGE)
            </button>
            <button
              onClick={() => setSensitivity("stringent")}
              className={`px-2.5 py-0.5 rounded-sm transition-colors ${
                sensitivity === "stringent"
                  ? "bg-[#E8913C] text-[#0A0C0E] font-semibold"
                  : "text-[#9EA5A8] hover:text-[#EDE7DC]"
              }`}
            >
              STRINGENT (HIGH)
            </button>
          </div>
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
                <CheckCircle2 className="h-3 w-3" /> VERIFIED DETECTOR
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

            {/* Live Triage Impact Metrics */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-4 border border-[rgba(237,231,220,0.1)] bg-[#101317] rounded-sm">
                <span className="text-[10.5px] uppercase font-mono tracking-[0.12em] text-[#6C7378] block">
                  CANDIDATE TRANSACTIONS
                </span>
                <span className="font-display font-bold text-2xl text-[#EDE7DC] mt-1 block">
                  {Math.round(selectedDetector.sampleFlagged * flaggedMultiplier)}
                </span>
                <span className="text-[10px] font-mono text-[#9EA5A8] mt-0.5 block">
                  Isolated from 100,000+ rows
                </span>
              </div>

              <div className="p-4 border border-[rgba(237,231,220,0.1)] bg-[#101317] rounded-sm">
                <span className="text-[10.5px] uppercase font-mono tracking-[0.12em] text-[#6C7378] block">
                  ESTIMATED EXPOSURE
                </span>
                <span className="font-display font-bold text-2xl text-[#E8913C] mt-1 block">
                  {formatINR(Math.round(selectedDetector.sampleExposure * exposureMultiplier))}
                </span>
                <span className="text-[10px] font-mono text-[#9EA5A8] mt-0.5 block">
                  Subject to statutory review
                </span>
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-4 border-t border-[rgba(237,231,220,0.1)] flex items-center justify-between">
            <span className="text-xs font-mono text-[#6C7378]">
              ENGINE REPOSITORY ID: <span className="text-[#EDE7DC]">{selectedDetector.id}</span>
            </span>
            <Link
              href={`/audit?run=${activeRunId}`}
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
