"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { ShieldCheck, Activity, Info, FileText, Database, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuditContextStore } from "@/stores/audit-context-store";

export function Header() {
  const pathname = usePathname();
  const params = useParams();
  const { lastActiveRunId } = useAuditContextStore();

  // Active runId from route params or fallback to store
  const currentRunId = (params?.runId as string) || lastActiveRunId;

  const auditHref = currentRunId ? `/audit/${currentRunId}` : "/audit";
  const transactionHref = currentRunId
    ? `/audit/${currentRunId}/transactions`
    : "/audit/transactions";

  const navItems = [
    { label: "Home", href: "/", icon: FileText, exact: true },
    {
      label: "Audit",
      href: auditHref,
      active: pathname.startsWith("/audit") && !pathname.includes("/transactions"),
      badge: currentRunId ? currentRunId.slice(0, 8) : undefined,
    },
    {
      label: "Transaction",
      href: transactionHref,
      active: pathname.includes("/transactions"),
    },
    {
      label: "System Health",
      href: "/system-health",
      icon: Activity,
      active: pathname === "/system-health",
    },
    {
      label: "About",
      href: "/about",
      icon: Info,
      active: pathname === "/about",
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base tracking-tight text-foreground flex items-center gap-1.5">
                AuditGraph
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  SME Forensic
                </span>
              </span>
              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                Explainable Anomaly Triage
              </span>
            </div>
          </Link>
        </div>

        {/* Primary Navigation — EXACT ORDER: Home -> Audit -> Transaction -> System Health -> About */}
        <nav className="flex items-center gap-1 sm:gap-1.5">
          {navItems.map((item) => {
            const isActive =
              item.active !== undefined
                ? item.active
                : item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5",
                  isActive
                    ? "bg-secondary text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                )}
              >
                {item.label}
                {item.badge && (
                  <span className="hidden md:inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Status / Action */}
        <div className="hidden lg:flex items-center gap-3">
          {currentRunId ? (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/5 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-muted-foreground">Active Run:</span>
              <span className="font-mono text-emerald-300">{currentRunId.slice(0, 10)}...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-border bg-secondary/40 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-slate-500" />
              <span>Ready for Upload</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
