"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldAlert,
  Activity,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Tv,
  CheckCircle2,
  AlertCircle,
  Database
} from "lucide-react";
import { getHealth, getVersion } from "../../lib/api/health";
import { useUiStore } from "../../stores/useUiStore";
import { cn } from "../../lib/utils/cn";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { isPresentationMode, togglePresentationMode, isCopilotOpen, setIsCopilotOpen } = useUiStore();

  const { data: health, isSuccess: isHealthOk } = useQuery({
    queryKey: ["healthz"],
    queryFn: getHealth,
    refetchInterval: 15000,
  });

  const { data: version } = useQuery({
    queryKey: ["version"],
    queryFn: getVersion,
    staleTime: 60000,
  });

  const navLinks = [
    { name: "Home", href: "/", icon: Layers },
    { name: "Audit", href: "/audits/new", icon: FileSpreadsheet },
    { name: "About", href: "/about", icon: CheckCircle2 },
    { name: "System Health", href: "/system-health", icon: Activity },
  ];

  if (isPresentationMode) {
    return (
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 px-6 py-2.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-brand-500 flex items-center justify-center text-white font-bold tracking-tight">
            AG
          </div>
          <div>
            <div className="text-sm font-semibold tracking-wide flex items-center gap-2">
              AuditGraph
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                Presentation Mode
              </span>
            </div>
            <div className="text-xs text-slate-400">Explainable Multi-Engine Anomaly Triage</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCopilotOpen(!isCopilotOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Audit Copilot
          </button>
          <button
            onClick={togglePresentationMode}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors"
          >
            <Tv className="w-3.5 h-3.5" />
            Exit Presentation
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center text-white font-black text-lg tracking-wider shadow-sm group-hover:bg-brand-700 transition-colors">
              AG
            </div>
            <div>
              <div className="text-base font-bold text-slate-900 tracking-tight leading-none flex items-center gap-2">
                AuditGraph
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  {version?.pipeline_version || "v2.4.1"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 tracking-tight mt-0.5">
                Explainable Financial Audit Intelligence
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-slate-100 text-slate-900 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right action bar: Health indicator, Presentation mode, Copilot */}
        <div className="flex items-center gap-3">
          {/* Live Backend Health Status */}
          <Link
            href="/system-health"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-50 hover:bg-slate-100 transition-colors border-slate-200"
            title={isHealthOk ? "FastAPI Backend Connected & Healthy" : "Checking Backend Connection..."}
          >
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                isHealthOk ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              )}
            />
            <span className="text-slate-700 hidden sm:inline">
              {isHealthOk ? "Backend Online" : "Connecting..."}
            </span>
          </Link>

          {/* Presentation Mode Toggle */}
          <button
            onClick={togglePresentationMode}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
            title="Toggle presentation mode for projectors and hackathon demo"
          >
            <Tv className="w-3.5 h-3.5 text-slate-500" />
            <span>Present</span>
          </button>

          {/* Audit Copilot Button */}
          <button
            onClick={() => setIsCopilotOpen(!isCopilotOpen)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Audit Copilot</span>
          </button>
        </div>
      </div>
    </header>
  );
};
