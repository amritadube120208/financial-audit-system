import { Cpu, ShieldCheck, Network, Layers } from "lucide-react";
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

  return (
    <div className="p-6 rounded-sm border border-[rgba(237,231,220,0.13)] bg-[#101317]">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E8913C]" />
            <span className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-[#6C7378]">
              ENGINE DISPATCH TELEMETRY
            </span>
          </div>
          <h3 className="font-display font-bold text-base text-[#EDE7DC] mt-0.5 tracking-tight">
            Multi-Engine Detector Execution
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-mono">
        {entries.map(([name, info]) => {
          const family = info.family || "rules";
          const Icon = familyIcons[family] || ShieldCheck;

          return (
            <div
              key={name}
              className="p-4 rounded-sm border border-[rgba(237,231,220,0.1)] bg-[#0A0C0E] hover:border-[rgba(237,231,220,0.2)] transition-colors flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-semibold text-xs text-[#EDE7DC] truncate" title={name}>
                  {name}
                </span>
                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded-sm border border-[#2E6B72]/40 bg-[#2E6B72]/10 text-[#2E6B72]">
                  {family}
                </span>
              </div>

              <div className="flex items-end justify-between text-xs mt-2 pt-2 border-t border-[rgba(237,231,220,0.08)]">
                <div>
                  <span className="text-[10px] text-[#6C7378] block">Findings</span>
                  <span className="font-bold text-[#E8913C]">{info.findings_count}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#6C7378] block">Runtime</span>
                  <span className="text-[#9EA5A8]">{info.duration_ms}ms</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
