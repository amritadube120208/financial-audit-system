import { Suspense } from "react";
import { AuditWorkspace } from "@/components/audit/audit-workspace";

export default function AuditPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-12 text-muted-foreground text-xs font-mono">
          Loading Audit Workspace...
        </div>
      }
    >
      <AuditWorkspace />
    </Suspense>
  );
}
