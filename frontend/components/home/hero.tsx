import Link from "next/link";
import { ArrowRight, ShieldAlert, Cpu, Network, CheckCircle2 } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden py-12 md:py-16 border-b border-border/40 bg-gradient-to-b from-card/60 to-background">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400 mb-6 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Deterministic Rules • Isolation Forest • Graph Forensics
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            AuditGraph
            <span className="block mt-2 text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              Explainable Financial Audit & Anomaly Detection
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
            Triage SME accounting ledgers at scale. AuditGraph applies 10 deterministic audit rules, unsupervised machine learning, and directed money-flow cycle detection to prioritize suspicious transactions with mathematical evidence.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#upload-section"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-sm hover:bg-emerald-400 transition-all shadow-emerald-500/10"
            >
              Start New Audit
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary/80 px-5 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-all"
            >
              Learn About AuditGraph
            </Link>
          </div>

          {/* Value Props Bar */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left">
            <div className="p-4 rounded-xl border border-border/80 bg-card/60 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Zero Black-Box Truth</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  The AI model is an auditor assistant, not an anomaly detector. Every finding has verifiable ledger citations.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border/80 bg-card/60 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Multi-Engine Fusion</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Combines rule thresholds, Isolation Forest density, and circular transactions with logarithmic materiality dampening.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border/80 bg-card/60 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Network className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Relational Cycles</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Detects round-tripping money rings, structured payment clusters, and rapid invoice reversals in real time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
