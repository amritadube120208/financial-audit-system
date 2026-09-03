import { Suspense } from "react";
import { AuditWorkspace } from "@/components/audit/audit-workspace";

export default async function AuditRunDynamicPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-12 text-muted-foreground text-xs font-mono">
          Loading Audit Run {runId}...
        </div>
      }
    >
      <AuditWorkspace initialRunId={runId} />
    </Suspense>
  );
}
