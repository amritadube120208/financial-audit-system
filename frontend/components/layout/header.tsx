"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getHealthz } from "@/lib/api";

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Live health probe for backend status dot
  const { data: healthData } = useQuery({
    queryKey: ["header-health"],
    queryFn: getHealthz,
    refetchInterval: 15000,
  });

  const isOnline = healthData?.status === "ok" || healthData?.status === "healthy";

  const navItems = [
    { label: "HOME", href: "/" },
    { label: "AUDIT", href: "/audit", active: pathname.startsWith("/audit") },
    { label: "ABOUT", href: "/about", active: pathname === "/about" },
    { label: "SYSTEM HEALTH", href: "/system-health", active: pathname === "/system-health" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[58px] bg-[#0A0C0E]/85 backdrop-blur-[14px] border-b border-[rgba(237,231,220,0.13)]">
      <div className="container mx-auto h-full max-w-7xl flex items-center justify-between px-4 sm:px-6">
        {/* Project Wordmark with Amber Period */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-display font-extrabold text-base sm:text-lg tracking-[-0.03em] text-[#EDE7DC] flex items-center">
            AUDITGRAPH
            <span className="text-[#E8913C] ml-0.5 animate-pulse">.</span>
          </span>
          <span className="hidden sm:inline-block text-[10px] font-mono uppercase tracking-[0.14em] text-[#6C7378] px-1.5 py-0.5 border border-[rgba(237,231,220,0.1)] rounded-sm">
            STAGE 01
          </span>
        </Link>

        {/* Center Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-7 text-[11.5px] uppercase tracking-[0.14em] font-body font-medium">
          {navItems.map((item) => {
            const isActive =
              item.active !== undefined
                ? item.active
                : pathname === item.href;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "relative py-1 transition-colors duration-200",
                  isActive
                    ? "text-[#EDE7DC] font-semibold"
                    : "text-[#9EA5A8] hover:text-[#EDE7DC]"
                )}
              >
                {item.label}
                {isActive && (
                  <span className="absolute -bottom-1.5 left-0 right-0 h-[1.5px] bg-[#E8913C]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Controls: Status & Compact Pill CTA */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Subtle Live Dot */}
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.1em] text-[#9EA5A8]">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                isOnline ? "bg-[#2E6B72] shadow-[0_0_8px_#2E6B72]" : "bg-[#E8913C]"
              )}
            />
            <span className="hidden lg:inline">{isOnline ? "ONLINE" : "OFFLINE"}</span>
          </div>

          {/* Compact Pill Primary Action */}
          <Link
            href="/audit"
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full border border-[rgba(237,231,220,0.2)] bg-[#101317] hover:border-[#E8913C] text-[#EDE7DC] hover:text-[#E8913C] text-[11px] uppercase tracking-[0.12em] font-body font-semibold transition-all duration-200"
          >
            <span>LAUNCH AUDIT</span>
            <ArrowUpRight className="h-3 w-3" />
          </Link>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-1.5 text-[#9EA5A8] hover:text-[#EDE7DC] transition-colors"
            aria-label="Toggle Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="md:hidden absolute top-[58px] left-0 right-0 bg-[#0A0C0E]/95 border-b border-[rgba(237,231,220,0.13)] backdrop-blur-xl p-6 flex flex-col gap-4">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="text-xs uppercase tracking-[0.15em] font-body text-[#EDE7DC] hover:text-[#E8913C] py-2 border-b border-[rgba(237,231,220,0.06)]"
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-[#6C7378]">
            <span>SYSTEM STATE</span>
            <span className="text-[#2E6B72]">{isOnline ? "● ONLINE" : "● OFFLINE"}</span>
          </div>
        </div>
      )}
    </header>
  );
}
