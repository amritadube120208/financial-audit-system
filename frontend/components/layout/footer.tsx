import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto relative bg-[#0A0C0E] border-t border-[rgba(237,231,220,0.13)] overflow-hidden">
      {/* Editorial Metadata Strip */}
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 pt-10 pb-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-[11px] font-mono text-[#6C7378] tracking-[0.08em]">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-2 text-[#EDE7DC]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E8913C]" />
            <span className="font-display font-bold tracking-tight text-xs">AUDITGRAPH</span>
            <span className="text-[#6C7378]">• STAGE RUNTIME</span>
          </div>
          <span className="hidden sm:inline text-[rgba(237,231,220,0.2)]">|</span>
          <span>MULTI-ENGINE FORENSIC AUDIT SUITE</span>
        </div>

        <div className="flex flex-wrap items-center gap-6 font-body text-[11px] uppercase tracking-[0.12em] text-[#9EA5A8]">
          <Link href="/" className="hover:text-[#EDE7DC] transition-colors">
            HOME
          </Link>
          <Link href="/audit" className="hover:text-[#EDE7DC] transition-colors">
            AUDIT
          </Link>
          <Link href="/about" className="hover:text-[#EDE7DC] transition-colors">
            ABOUT
          </Link>
          <Link href="/system-health" className="hover:text-[#EDE7DC] transition-colors">
            SYSTEM HEALTH
          </Link>
          <a
            href="/docs"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#E8913C] flex items-center gap-1 transition-colors text-[#EDE7DC]"
          >
            API DOCS <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Massive Cropped Editorial Wordmark */}
      <div className="w-full select-none pointer-events-none overflow-hidden flex justify-center translate-y-[28%] sm:translate-y-[24%]">
        <span className="font-display font-extrabold text-[15vw] sm:text-[16vw] leading-none tracking-[-0.05em] text-[rgba(237,231,220,0.06)] whitespace-nowrap">
          AUDITGRAPH<span className="text-[#E8913C]/20">.</span>
        </span>
      </div>
    </footer>
  );
}
