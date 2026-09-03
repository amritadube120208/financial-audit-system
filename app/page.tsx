"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUpRight,
  ShieldAlert,
  Sparkles,
  Layers,
  ChevronDown,
} from "lucide-react";
import { useAuditContextStore } from "@/stores/audit-context-store";
import { getAuditRunSummary, getAuditRunFindings } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import { FindingDeck, DeckItem } from "@/components/home/finding-deck";
import { AnomalyMatrix } from "@/components/home/anomaly-matrix";

export default function HomePage() {
  const { lastActiveRunId } = useAuditContextStore();
  const activeRunId = lastActiveRunId || "run_df347dce3c1f489e";

  // Scroll Progress State for Hero Portal
  const [scrollProgress, setScrollProgress] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          // Hero portal unfolds over 750px of scroll
          const progress = Math.min(1, Math.max(0, scrollY / 750));
          setScrollProgress(progress);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Query live summary and findings from backend
  const { data: summaryData } = useQuery({
    queryKey: ["home-summary", activeRunId],
    queryFn: () => (activeRunId ? getAuditRunSummary(activeRunId) : null),
    enabled: !!activeRunId,
  });

  const { data: findingsData } = useQuery({
    queryKey: ["home-findings", activeRunId],
    queryFn: () =>
      activeRunId
        ? getAuditRunFindings(activeRunId, { limit: 6 })
        : null,
    enabled: !!activeRunId,
  });

  const metrics = summaryData?.metrics;
  const rawFindings = findingsData?.findings || [];

  // Convert real findings into throwable deck items
  const deckItems: DeckItem[] =
    rawFindings.length > 0
      ? rawFindings.map((f) => ({
          id: f.finding_id,
          title: f.title,
          severity: f.severity as "critical" | "high" | "medium" | "low",
          risk_score: f.risk_score,
          monetary_exposure: f.monetary_exposure,
          anomaly_type: f.anomaly_type,
          evidence_count: f.evidence?.length || 3,
          primary_entity: f.primary_entity || undefined,
        }))
      : [
          {
            id: "fnd_demo_01",
            title: "Tri-Party Round-Trip Circulation",
            severity: "critical",
            risk_score: 94,
            monetary_exposure: 1850000,
            anomaly_type: "CIRCULAR_FLOW",
            evidence_count: 4,
            primary_entity: "Apex Logistics Ltd",
          },
          {
            id: "fnd_demo_02",
            title: "Near-Duplicate Period-End Invoicing",
            severity: "high",
            risk_score: 82,
            monetary_exposure: 420000,
            anomaly_type: "DUPLICATE_PAYMENT",
            evidence_count: 3,
            primary_entity: "Zenith Infotech Pvt",
          },
          {
            id: "fnd_demo_03",
            title: "Multi-Axis Statistical Outlier Spike",
            severity: "high",
            risk_score: 78,
            monetary_exposure: 680000,
            anomaly_type: "MULTIVARIATE_OUTLIER",
            evidence_count: 2,
            primary_entity: "Vanguard Supplies",
          },
        ];

  // Motion values
  const effectiveProgress = prefersReducedMotion ? 1 : scrollProgress;
  const leftPanelTransform = `translateX(-${effectiveProgress * 105}%)`;
  const rightPanelTransform = `translateX(${effectiveProgress * 105}%)`;
  const dot1Transform = `translateX(-${effectiveProgress * 260}px)`;
  const dot2Transform = `translateX(${effectiveProgress * 260}px)`;
  const wordmarkScale = 1 + effectiveProgress * 0.22;
  const auditSpanX = -effectiveProgress * 140;
  const graphSpanX = effectiveProgress * 140;
  const imageScale = 1.14 - effectiveProgress * 0.14;
  const duotoneOpacity = 0.25 + effectiveProgress * 0.45;

  return (
    <div className="flex-1 flex flex-col bg-[#0A0C0E] text-[#EDE7DC]">
      {/* ============================================================ */}
      {/* 1. HERO — CINEMATIC PORTAL (2.2 Viewport Heights)            */}
      {/* ============================================================ */}
      <section className="relative h-[220vh] w-full" id="hero-portal">
        <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center bg-[#0A0C0E]">
          {/* Underlying Technical Blueprint Canvas (revealed on scroll) */}
          <div
            className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none transition-transform duration-75"
            style={{
              transform: `scale(${imageScale})`,
            }}
          >
            {/* Visual Duotone Wash */}
            <div
              className="absolute inset-0 bg-[#101317] mix-blend-screen"
              style={{ opacity: duotoneOpacity }}
            />
            {/* Grid & Ledger Coordinate Matrix */}
            <svg
              className="w-full h-full opacity-35"
              xmlns="http://www.w3.org/2000/svg"
              width="100%"
              height="100%"
            >
              <defs>
                <pattern id="auditGrid" width="80" height="80" patternUnits="userSpaceOnUse">
                  <path
                    d="M 80 0 L 0 0 0 80"
                    fill="none"
                    stroke="rgba(237,231,220,0.08)"
                    strokeWidth="1"
                  />
                  <circle cx="80" cy="0" r="1.5" fill="#E8913C" opacity="0.4" />
                </pattern>
                <linearGradient id="duotoneWash" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E8913C" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#2E6B72" stopOpacity="0.22" />
                </linearGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#auditGrid)" />
              <rect width="100%" height="100%" fill="url(#duotoneWash)" />

              {/* Forensic Circular Cycle Overlay */}
              <g transform="translate(600, 380)" opacity="0.45" stroke="#2E6B72" fill="none">
                <circle cx="0" cy="0" r="280" strokeDasharray="4 8" strokeWidth="1" />
                <circle cx="0" cy="0" r="190" strokeDasharray="2 6" strokeWidth="1" />
                <circle cx="0" cy="0" r="90" strokeWidth="1" stroke="#E8913C" opacity="0.5" />
                <line x1="-320" y1="0" x2="320" y2="0" stroke="rgba(237,231,220,0.1)" />
                <line x1="0" y1="-320" x2="0" y2="320" stroke="rgba(237,231,220,0.1)" />
              </g>
            </svg>

            {/* Edge Veil */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0A0C0E] via-transparent to-[#0A0C0E] opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A0C0E] via-transparent to-[#0A0C0E] opacity-90" />
          </div>

          {/* Left Solid Shutter Panel (> 50% width) */}
          <div
            className="absolute top-0 bottom-0 left-0 w-[53%] z-20 bg-[#0A0C0E] border-r border-[rgba(237,231,220,0.13)] shadow-[15px_0_40px_rgba(0,0,0,0.8)] will-change-transform"
            style={{
              transform: leftPanelTransform,
              transition: prefersReducedMotion ? "none" : "transform 0.08s linear",
            }}
          />

          {/* Right Solid Shutter Panel (> 50% width) */}
          <div
            className="absolute top-0 bottom-0 right-0 w-[53%] z-20 bg-[#0A0C0E] border-l border-[rgba(237,231,220,0.13)] shadow-[-15px_0_40px_rgba(0,0,0,0.8)] will-change-transform"
            style={{
              transform: rightPanelTransform,
              transition: prefersReducedMotion ? "none" : "transform 0.08s linear",
            }}
          />

          {/* Traveling Center Accent Dots */}
          <div
            className="absolute z-30 pointer-events-none top-1/2 -translate-y-1/2 flex items-center justify-center will-change-transform"
            style={{ transform: `translate(-50%, -50%) ${dot1Transform}` }}
          >
            <span className="h-2 w-2 rounded-full bg-[#E8913C] shadow-[0_0_10px_#E8913C]" />
          </div>
          <div
            className="absolute z-30 pointer-events-none top-1/2 -translate-y-1/2 flex items-center justify-center will-change-transform"
            style={{ transform: `translate(50%, -50%) ${dot2Transform}` }}
          >
            <span className="h-2 w-2 rounded-full bg-[#2E6B72] shadow-[0_0_10px_#2E6B72]" />
          </div>

          {/* Splitting & Expanding Wordmark */}
          <div
            className="relative z-30 text-center select-none will-change-transform"
            style={{
              transform: `scale(${wordmarkScale})`,
              transition: prefersReducedMotion ? "none" : "transform 0.08s linear",
            }}
          >
            <h1 className="font-display font-extrabold text-5xl sm:text-7xl md:text-8xl lg:text-9xl text-[#EDE7DC] tracking-[-0.04em] flex items-center justify-center whitespace-nowrap">
              <span
                className="inline-block will-change-transform"
                style={{
                  transform: `translateX(${auditSpanX}px)`,
                  transition: prefersReducedMotion ? "none" : "transform 0.08s linear",
                }}
              >
                AUDIT
              </span>
              <span
                className="inline-block text-[#E8913C] will-change-transform"
                style={{
                  transform: `translateX(${graphSpanX}px)`,
                  transition: prefersReducedMotion ? "none" : "transform 0.08s linear",
                }}
              >
                GRAPH
                <span className="text-[#EDE7DC]">.</span>
              </span>
            </h1>

            <p
              className="font-body text-xs sm:text-sm uppercase tracking-[0.2em] text-[#9EA5A8] mt-4 transition-opacity duration-300"
              style={{ opacity: Math.max(0, 1 - effectiveProgress * 1.5) }}
            >
              MULTI-ENGINE FINANCIAL ANOMALY TRIAGE
            </p>
          </div>

          {/* Surrounding Hero Metadata */}
          <div className="absolute top-20 left-6 sm:left-10 z-30 font-mono text-[10px] uppercase tracking-[0.16em] text-[#6C7378]">
            PROJECT {"//"} 2026<br />
            VERSION {"//"} 01
          </div>

          <div className="absolute top-20 right-6 sm:right-10 z-30 font-mono text-[10px] uppercase tracking-[0.16em] text-right text-[#6C7378]">
            SYSTEM {"//"} ACTIVE<br />
            STAGE {"//"} VERIFIED
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[#9EA5A8]">
            <span>SCROLL TO OPEN PORTAL</span>
            <ChevronDown className="h-4 w-4 text-[#E8913C] animate-bounce" />
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. EDITORIAL STATEMENT SECTION                               */}
      {/* ============================================================ */}
      <section className="relative min-h-screen flex items-center justify-center px-6 sm:px-12 py-24 border-t border-[rgba(237,231,220,0.13)] overflow-hidden">
        {/* Large Outlined Numeral */}
        <span className="stroke-numeral text-[22vw] absolute left-4 sm:left-12 -top-10 sm:-top-16 select-none pointer-events-none opacity-25">
          01
        </span>

        {/* Rotating Circular Reticle Drifting on Right Edge */}
        <div className="absolute -right-24 top-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full border border-[rgba(237,231,220,0.08)] pointer-events-none opacity-40 animate-[spin_60s_linear_infinite] hidden lg:block">
          <div className="absolute inset-4 rounded-full border border-dashed border-[#2E6B72]/40" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-[#E8913C]" />
        </div>

        <div className="container max-w-4xl mx-auto relative z-10 space-y-8">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-[#9EA5A8]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E8913C]" />
            THE AUDIT PROBLEM & THESIS
          </div>

          <h2 className="font-display font-bold text-3xl sm:text-5xl md:text-6xl text-[#EDE7DC] leading-[1.12] tracking-[-0.03em] max-w-[22ch]">
            Convert high-volume ledgers into an explainable queue of{" "}
            <span className="text-[#E8913C]">evidence-backed triage</span>, eliminating ungrounded fraud hallucinations.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 border-t border-[rgba(237,231,220,0.1)] text-xs sm:text-sm font-body text-[#9EA5A8] leading-relaxed">
            <p>
              A single model is the wrong abstraction for financial audits. Rules catch statutory red flags, unsupervised ML captures statistical drift, and graph forensics surfaces circular money loops.
            </p>
            <p>
              AuditGraph fuses all evidence engines with materiality thresholds before synthesizing human-readable narratives, ensuring every finding cites immutable transaction rows.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. CORE PRODUCT / FEATURES SECTION (Horizontal Editorial Rows)*/}
      {/* ============================================================ */}
      <section className="py-24 px-6 sm:px-12 border-t border-[rgba(237,231,220,0.13)] bg-[#0A0C0E]">
        <div className="container max-w-6xl mx-auto space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[rgba(237,231,220,0.1)]">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#6C7378] block">
                02 {"//"} CAPABILITIES
              </span>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#EDE7DC] mt-1 tracking-tight">
                Forensic Detection Engines
              </h2>
            </div>
            <span className="font-mono text-xs text-[#9EA5A8]">
              PARALLEL PIPELINE {"//"} 5 ENGINES ACTIVE
            </span>
          </div>

          {/* Horizontal Editorial Feature Rows */}
          <div className="divide-y divide-[rgba(237,231,220,0.13)]">
            {[
              {
                index: "01",
                name: "Deterministic Audit Rules",
                desc: "10 codified statutory red flags: round-trips, rapid reversals, exact duplicates, near-duplicates, backdating, and holiday postings.",
                status: "RULE ENGINE ACTIVE",
              },
              {
                index: "02",
                name: "Unsupervised Isolation Forest",
                desc: "100-estimator multivariate decision trees isolating statistical outliers across amount, time, and counterparty frequency.",
                status: "SCIKIT-LEARN ML",
              },
              {
                index: "03",
                name: "Graph Cycle & Round-Trip Forensics",
                desc: "NetworkX directed graph cycle enumeration identifying closed money flow loops (A → B → C → A) inflating turnover.",
                status: "TARJAN ALGORITHM",
              },
              {
                index: "04",
                name: "GST-to-Book Invoice Reconciliation",
                desc: "Automated cross-check of ledger procurement against counterparty GSTR-2B filing records to detect missing tax credits.",
                status: "TAX COMPLIANCE",
              },
              {
                index: "05",
                name: "Materiality-Weighted Risk Fusion",
                desc: "Fused risk scoring weighted by exposure magnitude and accounting significance, ranking high-priority cases first.",
                status: "AUDIT RANKING",
              },
            ].map((row) => (
              <div
                key={row.index}
                className="group py-8 transition-all duration-200 hover:pl-3 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-default"
              >
                <div className="flex items-start gap-6 max-w-xl">
                  <span className="font-display font-extrabold text-2xl text-[#6C7378] group-hover:text-[#E8913C] transition-colors">
                    {row.index}
                  </span>
                  <div className="space-y-1.5">
                    <h3 className="font-display font-bold text-xl sm:text-2xl text-[#EDE7DC] tracking-tight group-hover:text-[#EDE7DC]">
                      {row.name}
                    </h3>
                    <p className="text-xs sm:text-sm font-body text-[#9EA5A8] leading-relaxed">
                      {row.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-start md:self-auto pl-12 md:pl-0">
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#6C7378] group-hover:text-[#2E6B72] transition-colors">
                    {row.status}
                  </span>
                  <span className="text-[#6C7378] group-hover:text-[#E8913C] group-hover:translate-x-1 transition-all">
                    →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. PRODUCT WORKFLOW (Vertical Editorial Timeline)            */}
      {/* ============================================================ */}
      <section className="py-24 px-6 sm:px-12 border-t border-[rgba(237,231,220,0.13)] bg-[#101317]">
        <div className="container max-w-5xl mx-auto space-y-16">
          <div className="text-center space-y-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#E8913C]">
              03 {"//"} EXECUTION PIPELINE
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#EDE7DC] tracking-tight">
              From Raw Ledger to Verified Audit Queue
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {[
              {
                step: "01",
                label: "INGESTION",
                title: "Canonical Schema Mapping",
                detail: "CSV or XLSX ledgers mapped into canonical schemas with type coercion and cryptographic SHA-256 fingerprinting.",
              },
              {
                step: "02",
                label: "DETECTION",
                title: "Multi-Engine Isolation",
                detail: "Parallel execution across 10 deterministic rules, Isolation Forest ML, and graph cycle network forensics.",
              },
              {
                step: "03",
                label: "FUSION",
                title: "Materiality Risk Scoring",
                detail: "Evidence normalizer synthesizes anomaly weights against statutory turnover thresholds into a 0–100 priority score.",
              },
              {
                step: "04",
                label: "TRIAGE",
                title: "Audit Copilot & Workpapers",
                detail: "Interactive natural-language triage with provenance citations and full CSV/JSON audit package export.",
              },
            ].map((stage, idx) => (
              <div
                key={stage.step}
                className="p-6 bg-[#0A0C0E] border border-[rgba(237,231,220,0.13)] rounded-sm space-y-3 relative group hover:border-[#E8913C] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display font-extrabold text-2xl text-[#E8913C]">
                    {stage.step}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#6C7378]">
                    {stage.label}
                  </span>
                </div>
                <h4 className="font-display font-bold text-base text-[#EDE7DC]">
                  {stage.title}
                </h4>
                <p className="text-xs font-body text-[#9EA5A8] leading-relaxed">
                  {stage.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. INTERACTIVE PROJECT SHOWCASE (Live Anomaly Matrix)        */}
      {/* ============================================================ */}
      <section className="py-24 px-6 sm:px-12 border-t border-[rgba(237,231,220,0.13)] bg-[#0A0C0E]">
        <div className="container max-w-6xl mx-auto space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#E8913C] block">
                04 {"//"} INTERACTIVE SHOWCASE
              </span>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#EDE7DC] mt-1 tracking-tight">
                Forensic Engine Telemetry
              </h2>
            </div>
            <p className="text-xs font-mono text-[#9EA5A8] max-w-sm">
              Inspect live detector sensitivity, algorithms, and simulated transaction yield.
            </p>
          </div>

          <AnomalyMatrix activeRunId={activeRunId} />
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. PHYSICAL THROWABLE DECK (Interactive Investigation Cards) */}
      {/* ============================================================ */}
      <section className="py-24 px-6 sm:px-12 border-t border-[rgba(237,231,220,0.13)] bg-[#101317]">
        <div className="container max-w-5xl mx-auto space-y-12 text-center">
          <div className="space-y-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#2E6B72]">
              05 {"//"} TACTILE INVESTIGATION STACK
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#EDE7DC] tracking-tight">
              Surfaced Forensic Cases
            </h2>
            <p className="text-xs font-body text-[#9EA5A8] max-w-md mx-auto">
              Drag horizontally or use arrow keys to throw cards outside the deck and review prioritized cases.
            </p>
          </div>

          <FindingDeck items={deckItems} activeRunId={activeRunId} />
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. EDITORIAL DATA / RESULTS SECTION                          */}
      {/* ============================================================ */}
      <section className="py-20 px-6 sm:px-12 border-t border-[rgba(237,231,220,0.13)] bg-[#0A0C0E]">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[rgba(237,231,220,0.13)] border-y border-[rgba(237,231,220,0.13)]">
            <div className="p-8 space-y-1">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#6C7378] block">
                INGESTION CAPACITY
              </span>
              <span className="font-display font-extrabold text-4xl sm:text-5xl text-[#EDE7DC] block tracking-tight">
                100,000+
              </span>
              <span className="font-body text-xs text-[#9EA5A8] block">
                Ledger rows processed in &lt;15s
              </span>
            </div>

            <div className="p-8 space-y-1">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#6C7378] block">
                EVIDENCE ENGINES
              </span>
              <span className="font-display font-extrabold text-4xl sm:text-5xl text-[#E8913C] block tracking-tight">
                12
              </span>
              <span className="font-body text-xs text-[#9EA5A8] block">
                Rules + ML + graph cycle detectors
              </span>
            </div>

            <div className="p-8 space-y-1">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#6C7378] block">
                REVIEW REDUCTION
              </span>
              <span className="font-display font-extrabold text-4xl sm:text-5xl text-[#EDE7DC] block tracking-tight">
                94%
              </span>
              <span className="font-body text-xs text-[#9EA5A8] block">
                Pruned search space for auditors
              </span>
            </div>

            <div className="p-8 space-y-1">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#6C7378] block">
                HALLUCINATION RATE
              </span>
              <span className="font-display font-extrabold text-4xl sm:text-5xl text-[#2E6B72] block tracking-tight">
                0%
              </span>
              <span className="font-body text-xs text-[#9EA5A8] block">
                Zero fabricated fraud claims
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 8. FINAL CINEMATIC CTA                                       */}
      {/* ============================================================ */}
      <section className="py-28 px-6 sm:px-12 border-t border-[rgba(237,231,220,0.13)] bg-[#0A0C0E] text-center">
        <div className="container max-w-3xl mx-auto space-y-8">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#E8913C]">
            READY TO AUDIT
          </span>

          <h2 className="font-display font-bold text-4xl sm:text-6xl text-[#EDE7DC] tracking-[-0.03em] leading-tight">
            Launch your forensic ledger investigation.
          </h2>

          <p className="font-body text-sm sm:text-base text-[#9EA5A8] max-w-lg mx-auto">
            Upload your SME ledger CSV/XLSX or explore pre-verified stage datasets with grounded AI copilot assistance.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/audit"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#E8913C] hover:bg-[#E8913C]/90 text-[#0A0C0E] font-body font-semibold text-xs uppercase tracking-[0.14em] transition-all shadow-md"
            >
              START AUDIT WORKSPACE <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/audit#copilot"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[rgba(237,231,220,0.25)] hover:border-[#E8913C] text-[#EDE7DC] hover:text-[#E8913C] font-body font-medium text-xs uppercase tracking-[0.14em] transition-all bg-[#101317]"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#E8913C]" /> CONSULT COPILOT
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
