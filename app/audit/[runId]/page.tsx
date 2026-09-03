import { Suspense } from "react";
import { AuditWorkspace } from "@/components/audit/audit-workspace";

export default function AuditRunDynamicPage({ params }: { params: { runId: string } }) {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-12 text-muted-foreground text-xs font-mono">
          Loading Audit Run {params.runId}...
        </div>
      }
    >
      <AuditWorkspace initialRunId={params.runId} />
    </Suspense>
  );
}
