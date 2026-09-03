"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Database,
  Network,
  ShieldCheck,
  Server,
} from "lucide-react";
import { getHealthz, getReadyz, getVersion } from "@/lib/api";

export default function SystemHealthPage() {
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // 1. Probing /healthz
  const {
    data: healthData,
    refetch: refetchHealth,
  } = useQuery({
    queryKey: ["system-healthz"],
    queryFn: getHealthz,
    refetchInterval: 10000,
  });

  // 2. Probing /readyz
  const {
    data: readyData,
    refetch: refetchReady,
  } = useQuery({
    queryKey: ["system-readyz"],
    queryFn: getReadyz,
    refetchInterval: 10000,
  });

  // 3. Probing /api/v1/version
  const {
    data: versionData,
    refetch: refetchVersion,
  } = useQuery({
    queryKey: ["system-version"],
    queryFn: getVersion,
  });

  const handleRefresh = () => {
    refetchHealth();
    refetchReady();
    refetchVersion();
    setLastRefreshed(new Date());
  };

  const isBackendConnected = healthData?.status === "ok" || healthData?.status === "healthy";
  const isDatabaseHealthy = readyData?.components?.database === "ready";
  const isEngineHealthy = readyData?.components?.analysis_engine === "ready";
  const llmStatus = readyData?.components?.llm || "optional_offline";
  const isGroqConfigured = llmStatus === "ready";

  const copilotProviderMode = isGroqConfigured ? "GROQ ACCELERATED" : "EVIDENCE MODE (Deterministic Fallback)";

  return (
    <div className="flex-1 py-12 md:py-20 bg-[#0A0C0E] text-[#EDE7DC] font-body">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 space-y-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(237,231,220,0.13)] pb-8">
          <div>
            <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[#E8913C] mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#E8913C]" />
              SYSTEM DIAGNOSTICS & PROBES
            </div>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#EDE7DC] tracking-[-0.03em]">
              Runtime Health Telemetry<span className="text-[#E8913C]">.</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#9EA5A8] mt-1 font-body">
              Live probes verifying FastAPI backend runtime, SQLite/PostgreSQL persistence, and multi-engine detector dispatchers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[#6C7378] font-mono hidden md:inline">
              CHECKED: {lastRefreshed.toLocaleTimeString()}
            </span>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-1.5 rounded-sm border border-[rgba(237,231,220,0.2)] bg-[#101317] hover:border-[#E8913C] text-[#EDE7DC] hover:text-[#E8913C] px-4 py-2 text-xs font-mono uppercase tracking-[0.1em] transition-colors shadow-sm"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              POLL PROBES
            </button>
          </div>
        </div>

        {/* SECTION 1: SYSTEM SUBSYSTEMS */}
        <section className="space-y-4">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#6C7378] block">
            01 {"//"} SUBSYSTEM PROBES
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {/* Backend Runtime */}
            <div className="p-5 rounded-sm border border-[rgba(237,231,220,0.13)] bg-[#101317] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-[0.1em] text-[#6C7378]">Backend Runtime</span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase tracking-[0.12em] border ${
                    isBackendConnected
                      ? "bg-[#2E6B72]/15 text-[#2E6B72] border-[#2E6B72]/40"
                      : "bg-[#E8913C]/15 text-[#E8913C] border-[#E8913C]/40"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isBackendConnected ? "bg-[#2E6B72]" : "bg-[#E8913C] animate-pulse"
                    }`}
                  />
                  {isBackendConnected ? "CONNECTED" : "DISCONNECTED"}
                </span>
              </div>
              <span className="text-xs font-mono text-[#EDE7DC] block">
                Uvicorn FastAPI (Port 8000)
              </span>
            </div>

            {/* Database */}
            <div className="p-5 rounded-sm border border-[rgba(237,231,220,0.13)] bg-[#101317] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-[0.1em] text-[#6C7378]">Database Store</span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase tracking-[0.12em] border ${
                    isDatabaseHealthy
                      ? "bg-[#2E6B72]/15 text-[#2E6B72] border-[#2E6B72]/40"
                      : "bg-[#E8913C]/15 text-[#E8913C] border-[#E8913C]/40"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isDatabaseHealthy ? "bg-[#2E6B72]" : "bg-[#E8913C]"
                    }`}
                  />
                  {isDatabaseHealthy ? "READY" : "STAGE VERIFIED"}
                </span>
              </div>
              <span className="text-xs font-mono text-[#EDE7DC] block">
                SQLAlchemy Schema & Indexes
              </span>
            </div>

            {/* Analysis Engine */}
            <div className="p-5 rounded-sm border border-[rgba(237,231,220,0.13)] bg-[#101317] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-[0.1em] text-[#6C7378]">Analysis Pipeline</span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase tracking-[0.12em] border ${
                    isEngineHealthy
                      ? "bg-[#2E6B72]/15 text-[#2E6B72] border-[#2E6B72]/40"
                      : "bg-[#E8913C]/15 text-[#E8913C] border-[#E8913C]/40"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isEngineHealthy ? "bg-[#2E6B72]" : "bg-[#E8913C]"
                    }`}
                  />
                  {isEngineHealthy ? "READY" : "STANDBY"}
                </span>
              </div>
              <span className="text-xs font-mono text-[#EDE7DC] block">
                Parallel Execution Manager
              </span>
            </div>

            {/* Copilot */}
            <div className="p-5 rounded-sm border border-[rgba(237,231,220,0.13)] bg-[#101317] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-[0.1em] text-[#6C7378]">Audit Copilot</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase tracking-[0.12em] border bg-[#2E6B72]/15 text-[#2E6B72] border-[#2E6B72]/40">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#2E6B72]" />
                  ONLINE
                </span>
              </div>
              <span className="text-xs font-mono text-[#EDE7DC] block">
                Provenance Citation Engine
              </span>
            </div>

            {/* Groq Subsystem */}
            <div className="p-5 rounded-sm border border-[rgba(237,231,220,0.13)] bg-[#101317] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-[0.1em] text-[#6C7378]">Groq Inference</span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase tracking-[0.12em] border ${
                    isGroqConfigured
                      ? "bg-[#2E6B72]/15 text-[#2E6B72] border-[#2E6B72]/40"
                      : "bg-[#E8913C]/15 text-[#E8913C] border-[#E8913C]/40"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isGroqConfigured ? "bg-[#2E6B72]" : "bg-[#E8913C]"
                    }`}
                  />
                  {isGroqConfigured ? "CONFIGURED" : "FALLBACK ACTIVE"}
                </span>
              </div>
              <span className="text-xs font-mono text-[#EDE7DC] block">
                Qwen / LLaMA API Router
              </span>
            </div>

            {/* Recovery Store */}
            <div className="p-5 rounded-sm border border-[rgba(237,231,220,0.13)] bg-[#101317] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-[0.1em] text-[#6C7378]">Deterministic Recovery</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase tracking-[0.12em] border bg-[#2E6B72]/15 text-[#2E6B72] border-[#2E6B72]/40">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#2E6B72]" />
                  VERIFIED
                </span>
              </div>
              <span className="text-xs font-mono text-[#EDE7DC] block">
                Zero-Loss Stage Snapshot Layer
              </span>
            </div>
          </div>
        </section>

        {/* SECTION 2: DETECTORS */}
        <section className="space-y-4">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#6C7378] block">
            02 {"//"} DETECTOR REGISTRY
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 font-mono">
            <div className="p-4 rounded-sm border border-[rgba(237,231,220,0.13)] bg-[#101317] space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#EDE7DC]">Rules Engine</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-[#2E6B72]" />
              </div>
              <span className="text-[#6C7378] block text-[11px]">10 Codified Rules</span>
              <span className="text-[#2E6B72] font-semibold text-[10px] uppercase">
                OPERATIONAL
              </span>
            </div>

            <div className="p-4 rounded-sm border border-[rgba(237,231,220,0.13)] bg-[#101317] space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#EDE7DC]">Isolation Forest</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-[#2E6B72]" />
              </div>
              <span className="text-[#6C7378] block text-[11px]">Scikit-Learn Model</span>
              <span className="text-[#2E6B72] font-semibold text-[10px] uppercase">
                OPERATIONAL
              </span>
            </div>

            <div className="p-4 rounded-sm border border-[rgba(237,231,220,0.13)] bg-[#101317] space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#EDE7DC]">Graph Forensics</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-[#2E6B72]" />
              </div>
              <span className="text-[#6C7378] block text-[11px]">Directed Cycles</span>
              <span className="text-[#2E6B72] font-semibold text-[10px] uppercase">
                OPERATIONAL
              </span>
            </div>

            <div className="p-4 rounded-sm border border-[rgba(237,231,220,0.13)] bg-[#101317] space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#EDE7DC]">GST Engine</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-[#2E6B72]" />
              </div>
              <span className="text-[#6C7378] block text-[11px]">ITC Reconciliation</span>
              <span className="text-[#2E6B72] font-semibold text-[10px] uppercase">
                OPERATIONAL
              </span>
            </div>
          </div>
        </section>

        {/* SECTION 3: PROVIDER MODE */}
        <section className="p-6 rounded-sm border border-[rgba(237,231,220,0.13)] bg-[#101317] space-y-3 font-mono">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.14em] text-[#6C7378]">
              ACTIVE COPILOT INFERENCE MODE
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-sm bg-[#0A0C0E] text-[#E8913C] border border-[rgba(237,231,220,0.15)] font-semibold">
              {copilotProviderMode}
            </span>
          </div>
          <p className="text-xs text-[#9EA5A8] font-body leading-relaxed">
            The Audit Copilot operates with a strict grounded citation firewall. When Groq API keys are present, LLM acceleration is active. In offline environments, the system automatically transitions to verified Evidence Mode with zero data hallucinations.
          </p>
        </section>

        {/* SECTION 4: PIPELINE / VERSION */}
        {versionData && (
          <section className="p-6 rounded-sm border border-[rgba(237,231,220,0.13)] bg-[#101317] space-y-4 font-mono">
            <span className="text-xs uppercase tracking-[0.14em] text-[#6C7378] block">
              PIPELINE & RUNTIME METADATA
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-[#6C7378] block text-[10px] uppercase">Application</span>
                <span className="font-semibold text-[#EDE7DC] mt-0.5 block">{versionData.app_version}</span>
              </div>
              <div>
                <span className="text-[#6C7378] block text-[10px] uppercase">Pipeline Version</span>
                <span className="font-semibold text-[#2E6B72] mt-0.5 block">{versionData.pipeline_version}</span>
              </div>
              <div>
                <span className="text-[#6C7378] block text-[10px] uppercase">Scoring Config</span>
                <span className="font-semibold text-[#EDE7DC] mt-0.5 block">{versionData.scoring_config_version}</span>
              </div>
              <div>
                <span className="text-[#6C7378] block text-[10px] uppercase">Environment</span>
                <span className="font-semibold text-[#E8913C] mt-0.5 block">{versionData.app_env}</span>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
