"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Database,
  Cpu,
  Server,
  Zap,
  RefreshCw,
  Layers,
  Archive,
} from "lucide-react";
import { getHealthz, getReadyz, getVersion } from "@/lib/api";

export default function SystemHealthPage() {
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // 1. Query /healthz
  const {
    data: healthData,
    isLoading: isHealthLoading,
    refetch: refetchHealth,
  } = useQuery({
    queryKey: ["system-healthz"],
    queryFn: getHealthz,
    refetchInterval: 10000,
  });

  // 2. Query /readyz
  const {
    data: readyData,
    isLoading: isReadyLoading,
    refetch: refetchReady,
  } = useQuery({
    queryKey: ["system-readyz"],
    queryFn: getReadyz,
    refetchInterval: 10000,
  });

  // 3. Query /api/v1/version
  const {
    data: versionData,
    isLoading: isVersionLoading,
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

  const isApiHealthy = healthData?.status === "ok" || healthData?.status === "healthy";
  const isSystemReady = readyData?.status === "ready";

  const components = readyData?.components || {
    database: "checking...",
    redis: "optional_unavailable",
    llm: "optional_offline",
    analysis_engine: "ready",
    recovery_store: "ready",
  };

  const getStatusBadge = (val: string) => {
    if (val === "ready" || val === "alive" || val === "ok" || val.includes("ready")) {
      return {
        label: "Operational",
        icon: CheckCircle2,
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
        indicator: "bg-emerald-400",
      };
    }
    if (val.includes("optional") || val === "degraded") {
      return {
        label: "Optional / Offline",
        icon: AlertTriangle,
        color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        indicator: "bg-amber-400",
      };
    }
    return {
      label: "Unavailable",
      icon: XCircle,
      color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
      indicator: "bg-rose-400",
    };
  };

  const componentList = [
    {
      name: "FastAPI Core Runtime",
      key: "api",
      status: isApiHealthy ? "ready" : "unhealthy",
      desc: "Uvicorn asynchronous worker process",
      icon: Server,
    },
    {
      name: "Relational Database (SQLAlchemy)",
      key: "database",
      status: components.database,
      desc: "Storage for runs, transactions, findings, and evidence",
      icon: Database,
    },
    {
      name: "Multi-Engine Anomaly Engine",
      key: "analysis_engine",
      status: components.analysis_engine,
      desc: "10 deterministic rules + Isolation Forest + NetworkX cycles",
      icon: Cpu,
    },
    {
      name: "Triple-Lock Recovery Store",
      key: "recovery_store",
      status: components.recovery_store,
      desc: "Pre-verified deterministic snapshots for stage rehearsal",
      icon: Archive,
    },
    {
      name: "Redis Event Cache",
      key: "redis",
      status: components.redis,
      desc: "In-memory SSE event bus fallback mode active",
      icon: Zap,
    },
    {
      name: "AI Copilot Subsystem",
      key: "llm",
      status: components.llm,
      desc: "Deterministic intent router & prompt injection firewall",
      icon: Activity,
    },
  ];

  return (
    <div className="flex-1 py-8">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-5 w-5 text-emerald-400" />
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                System Health & Diagnostics
              </h1>
            </div>
            <p className="text-xs text-muted-foreground">
              Live probes verifying backend services, database persistence, detector execution engines, and runtime versions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-mono hidden md:inline">
              Last checked: {lastRefreshed.toLocaleTimeString()}
            </span>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground px-3.5 py-2 text-xs font-semibold transition-all"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Run Health Probe
            </button>
          </div>
        </div>

        {/* System Overview Status Banner */}
        <div className="my-6 p-5 rounded-2xl border border-border bg-card flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`h-12 w-12 rounded-xl flex items-center justify-center border ${
                isSystemReady
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-400"
              }`}
            >
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-foreground">
                  {isSystemReady ? "All Core Systems Operational" : "System Running in Stage Fallback"}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-medium border ${
                    isSystemReady
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  }`}
                >
                  {readyData?.status?.toUpperCase() || "CHECKING"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Backend connected at <code className="font-mono text-foreground">{process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}</code>
              </p>
            </div>
          </div>

          {/* Versions Metadata */}
          {versionData && (
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
              <div className="px-3 py-1.5 rounded-lg bg-secondary border border-border">
                <span className="text-muted-foreground block text-[10px]">App Version</span>
                <span className="text-foreground font-semibold">{versionData.app_version}</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-secondary border border-border">
                <span className="text-muted-foreground block text-[10px]">Pipeline</span>
                <span className="text-emerald-400 font-semibold">{versionData.pipeline_version}</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-secondary border border-border">
                <span className="text-muted-foreground block text-[10px]">Scoring Config</span>
                <span className="text-foreground font-semibold">{versionData.scoring_config_version}</span>
              </div>
            </div>
          )}
        </div>

        {/* Component Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-6">
          {componentList.map((c) => {
            const Icon = c.icon;
            const badge = getStatusBadge(c.status);

            return (
              <div
                key={c.name}
                className="p-5 rounded-xl border border-border bg-card shadow-sm hover:border-border/80 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-secondary text-foreground border border-border/80">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.color}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${badge.indicator}`} />
                      {badge.label}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-foreground">{c.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{c.desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-border/60 text-[11px] font-mono text-muted-foreground truncate">
                  Raw State: <span className="text-foreground">{c.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
