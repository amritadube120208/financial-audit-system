import { Cpu, ShieldCheck, Network, Layers, Sparkles } from "lucide-react";
import type { DetectorInfo } from "@/lib/types";

interface DetectorBreakdownProps {
  detectors: Record<string, DetectorInfo>;
}

export function DetectorBreakdown({ detectors }: DetectorBreakdownProps) {
  const entries = Object.entries(detectors || {});

  const familyIcons: Record<string, typeof Cpu> = {
    rules: ShieldCheck,
    ml: Cpu,
    graph: Network,
    scoring: Layers,
  };

  const familyBadges: Record<string, string> = {
    rules: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    ml: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    graph: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    scoring: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  };

  return (
    <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Multi-Engine Detector Execution</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Breakdown of detector families, detected anomaly clusters, and individual runtimes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {entries.map(([name, info]) => {
          const family = info.family || "rules";
          const Icon = familyIcons[family] || ShieldCheck;
          const badgeClass = familyBadges[family] || familyBadges.rules;

          return (
            <div
              key={name}
              className="p-3.5 rounded-xl border border-border/70 bg-secondary/30 hover:bg-secondary/50 transition-colors flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-semibold text-xs text-foreground font-mono truncate" title={name}>
                  {name}
                </span>
                <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded border ${badgeClass}`}>
                  {family}
                </span>
              </div>

              <div className="flex items-end justify-between text-xs mt-2 pt-2 border-t border-border/40 font-mono">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Findings</span>
                  <span className="font-bold text-foreground">{info.findings_count}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground block">Duration</span>
                  <span className="text-muted-foreground">{info.duration_ms}ms</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
