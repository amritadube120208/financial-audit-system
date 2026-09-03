import Link from "next/link";
import { ShieldAlert, ArrowRight, UploadCloud } from "lucide-react";

export default function AuditEmptyPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
      <div className="max-w-md w-full text-center p-8 rounded-2xl border border-border bg-card shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground mb-4">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-bold text-foreground">No Active Audit Run Selected</h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
          Upload an SME accounting ledger on the Home page to initialize the multi-engine triage pipeline.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-4 py-2.5 text-sm transition-all shadow-sm"
          >
            <UploadCloud className="h-4 w-4" />
            Upload Dataset on Home
          </Link>
        </div>
      </div>
    </div>
  );
}
