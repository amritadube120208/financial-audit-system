import { CheckCircle2, Circle, AlertCircle, RefreshCw, Radio } from "lucide-react";
import type { AuditStatus, AuditProgressEvent } from "@/lib/types";

interface ProgressTimelineProps {
  status: AuditStatus;
  progress: number;
  currentStage: string;
  latestEvent?: AuditProgressEvent | null;
  isPollingFallback: boolean;
}

const STAGES = [
  { key: "INGESTING", label: "Ingest Ledger", desc: "Hash verification & parsing" },
  { key: "VALIDATING", label: "Schema Validation", desc: "Canonical column alignment" },
  { key: "FEATURIZING", label: "Feature Engineering", desc: "Temporal & monetary vectors" },
  { key: "DETECTING", label: "Multi-Engine Detection", desc: "10 Rules + ML + Graph cycles" },
  { key: "SCORING", label: "Risk Fusion", desc: "Materiality dampening & fusion" },
  { key: "EXPLAINING", label: "Audit Explanations", desc: "Evidence packaging & graphs" },
  { key: "READY", label: "Audit Finalized", desc: "Top-K investigations ready" },
];

export function ProgressTimeline({
  status,
  progress,
  currentStage,
  latestEvent,
  isPollingFallback,
}: ProgressTimelineProps) {
  const isFailed = status === "FAILED";
  const pct = Math.min(100, Math.max(0, Math.round(progress * 100)));

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm my-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Audit Pipeline In Execution
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time multi-engine audit state machine. Each detector executes in parallel with enforced deadlines.
          </p>
        </div>

        {isPollingFallback && (
          <div className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300">
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            <span>Live event stream unavailable — monitoring audit status via polling.</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs font-mono text-muted-foreground mb-2">
          <span>Overall Progress</span>
          <span className="text-foreground font-semibold">{pct}%</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Stage Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {STAGES.map((stage, idx) => {
          const stageIdx = STAGES.findIndex((s) => s.key === stage.key);
          const currentIdx = STAGES.findIndex((s) => s.key === status) || 0;
          const isDone = stageIdx < currentIdx || status === "READY" || status === "DEGRADED";
          const isCurrent = stage.key === status || (status === "FEATURIZING" && stage.key === "FEATURIZING");

          return (
            <div
              key={stage.key}
              className={`p-3 rounded-xl border text-left transition-all ${
                isDone
                  ? "border-emerald-500/30 bg-emerald-500/5 text-foreground"
                  : isCurrent
                  ? "border-emerald-500 bg-emerald-500/10 shadow-sm"
                  : "border-border/60 bg-secondary/30 text-muted-foreground"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono text-muted-foreground">0{idx + 1}</span>
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : isCurrent ? (
                  <RefreshCw className="h-4 w-4 text-emerald-400 animate-spin" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground/40" />
                )}
              </div>
              <span className="font-semibold text-xs block truncate">{stage.label}</span>
              <span className="text-[11px] text-muted-foreground block mt-0.5 leading-tight line-clamp-2">
                {stage.desc}
              </span>
            </div>
          );
        })}
      </div>

      {latestEvent && latestEvent.message && (
        <div className="mt-6 p-3 rounded-lg border border-border/80 bg-background/50 font-mono text-xs text-muted-foreground flex items-center gap-2">
          <span className="text-emerald-400">&gt;</span>
          <span>{latestEvent.message}</span>
          <span className="ml-auto text-[10px] text-muted-foreground/60">{latestEvent.timestamp.slice(11, 19)}</span>
        </div>
      )}
    </div>
  );
}
