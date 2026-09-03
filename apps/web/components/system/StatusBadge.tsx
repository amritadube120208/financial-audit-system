import React from "react";
import { Severity, AuditRunStatus, AnalysisMode } from "../../lib/types/api";
import { cn } from "../../lib/utils/cn";

interface StatusBadgeProps {
  type?: "severity" | "status" | "mode";
  value: Severity | AuditRunStatus | AnalysisMode | string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  type = "status",
  value,
  size = "md",
  className,
}) => {
  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs font-semibold",
    lg: "px-3 py-1.5 text-sm font-semibold",
  }[size];

  // Severity color rules
  if (type === "severity" || ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(value)) {
    const sevColors: Record<string, string> = {
      CRITICAL: "bg-red-50 text-red-700 border-red-200 ring-1 ring-red-300/40",
      HIGH: "bg-orange-50 text-orange-700 border-orange-200 ring-1 ring-orange-300/40",
      MEDIUM: "bg-amber-50 text-amber-800 border-amber-200 ring-1 ring-amber-300/40",
      LOW: "bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-300/40",
    };
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border uppercase tracking-wider font-mono",
          sevColors[value] || "bg-slate-100 text-slate-700 border-slate-200",
          sizeClasses,
          className
        )}
      >
        <span
          className={cn("w-1.5 h-1.5 rounded-full", {
            "bg-red-500 animate-pulse": value === "CRITICAL",
            "bg-orange-500": value === "HIGH",
            "bg-amber-500": value === "MEDIUM",
            "bg-emerald-500": value === "LOW",
          })}
        />
        {value}
      </span>
    );
  }

  // Analysis Mode badges (LIVE, DEGRADED, RECOVERY)
  if (type === "mode" || ["LIVE", "DEGRADED", "RECOVERY"].includes(value)) {
    const modeColors: Record<string, string> = {
      LIVE: "bg-emerald-50 text-emerald-800 border-emerald-300",
      DEGRADED: "bg-amber-50 text-amber-900 border-amber-300 ring-1 ring-amber-400",
      RECOVERY: "bg-indigo-50 text-indigo-800 border-indigo-300",
    };
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md border font-mono uppercase tracking-wider",
          modeColors[value] || "bg-slate-100 text-slate-800 border-slate-300",
          sizeClasses,
          className
        )}
      >
        {value === "LIVE" && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
        {value === "DEGRADED" && <span className="text-amber-600 font-bold">⚠️</span>}
        {value === "RECOVERY" && <span className="text-indigo-600 font-bold">🛡️</span>}
        {value} MODE
      </span>
    );
  }

  // AuditRunStatus badges
  const statusColors: Record<string, string> = {
    READY: "bg-emerald-50 text-emerald-700 border-emerald-200",
    CREATED: "bg-slate-100 text-slate-700 border-slate-200",
    INGESTING: "bg-blue-50 text-blue-700 border-blue-200",
    VALIDATING: "bg-sky-50 text-sky-700 border-sky-200",
    DETECTING: "bg-indigo-50 text-indigo-700 border-indigo-200",
    SCORING: "bg-purple-50 text-purple-700 border-purple-200",
    EXPLAINING: "bg-cyan-50 text-cyan-700 border-cyan-200",
    DEGRADED: "bg-amber-50 text-amber-800 border-amber-300",
    FAILED: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border font-medium",
        statusColors[value] || "bg-slate-100 text-slate-700 border-slate-200",
        sizeClasses,
        className
      )}
    >
      {value}
    </span>
  );
};
