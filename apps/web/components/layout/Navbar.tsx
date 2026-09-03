"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  FileSpreadsheet,
  Layers,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useUiStore } from "../../stores/useUiStore";
import { cn } from "../../lib/utils/cn";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { isCopilotOpen, setIsCopilotOpen } = useUiStore();

  const navLinks = [
    { name: "Home", href: "/", icon: Layers },
    { name: "Audit", href: "/audits/new", icon: FileSpreadsheet },
    { name: "About", href: "/about", icon: CheckCircle2 },
    { name: "System Health", href: "/system-health", icon: Activity },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand: Only Title, No Description */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm tracking-wider shadow-xs group-hover:bg-brand-700 transition-colors">
              AG
            </div>
            <span className="text-base font-bold text-slate-900 tracking-tight">
              AuditGraph
            </span>
          </Link>

          {/* Navigation Links: Home, Audit, About, System Health */}
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

        {/* Right action bar: Audit Copilot */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCopilotOpen(!isCopilotOpen)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-xs transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Audit Copilot</span>
          </button>
        </div>
      </div>
    </header>
  );
};
