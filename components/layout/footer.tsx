import Link from "next/link";
import { ShieldCheck, ArrowUpRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-card/40 py-8 text-xs text-muted-foreground">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span className="font-semibold text-foreground">AuditGraph</span>
          <span>— Explainable Financial Audit Anomaly Triage Platform</span>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <Link href="/system-health" className="hover:text-foreground transition-colors">
            System Health
          </Link>
          <Link href="/about" className="hover:text-foreground transition-colors">
            About & Architecture
          </Link>
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="hover:text-emerald-400 flex items-center gap-1 transition-colors text-foreground"
          >
            FastAPI Docs <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
      </div>
    </footer>
  );
}
