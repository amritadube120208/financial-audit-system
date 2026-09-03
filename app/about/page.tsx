import Link from "next/link";
import {
  ShieldCheck,
  UploadCloud,
  FileCheck,
  Cpu,
  Layers,
  FileText,
  Network,
  Lock,
  ArrowRight,
  Github,
  Linkedin,
  Users,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { TEAM_MEMBERS } from "@/data/team";

export default function AboutPage() {
  const steps = [
    {
      num: "01",
      title: "Upload",
      desc: "Auditor uploads SME general ledger (.csv, .xlsx). Content is fingerprinted via SHA-256 for evidentiary chain of custody.",
      icon: UploadCloud,
    },
    {
      num: "02",
      title: "Validate",
      desc: "Schema mapper resolves heterogeneous accounting headers into a unified canonical ledger schema with strict decimal precision.",
      icon: FileCheck,
    },
    {
      num: "03",
      title: "Detect",
      desc: "Parallel detection suite executes 10 deterministic rules, Isolation Forest feature density, and directed graph cycle algorithms.",
      icon: Cpu,
    },
    {
      num: "04",
      title: "Score",
      desc: "Risk fusion engine renormalizes detector weights and applies logarithmic materiality dampening against SME turnover thresholds.",
      icon: Layers,
    },
    {
      num: "05",
      title: "Explain",
      desc: "Every finding is synthesized with deterministic auditor narratives, structured evidence packages, and relational money-flow graphs.",
      icon: FileText,
    },
    {
      num: "06",
      title: "Investigate",
      desc: "Auditor inspects prioritized findings, drills down to exact corpus transactions, and consults the grounded Audit Copilot.",
      icon: ShieldCheck,
    },
  ];

  const features = [
    {
      title: "10 Deterministic Audit Rules",
      desc: "Exact & near duplicates, backdated entries, period-end postings, suspicious round amounts, rapid reversals, rare counterparties, month-end spikes, and GST mismatches.",
      icon: CheckCircle2,
    },
    {
      title: "Unsupervised Isolation Forest",
      desc: "Multivariate outlier scoring across posting cadence, transaction volume, and monetary deviations without requiring pre-labeled training data.",
      icon: Cpu,
    },
    {
      title: "Relational Cycle Forensics",
      desc: "NetworkX directed graph algorithms detect circular round-tripping money rings, structured payment laundering, and rapid pass-through clusters.",
      icon: Network,
    },
    {
      title: "Materiality-Aware Risk Fusion",
      desc: "Logarithmic monetary dampening prevents negligible cent-level anomalies from dominating triage priorities over high-exposure findings.",
      icon: Layers,
    },
    {
      title: "Grounded Audit Copilot",
      desc: "Scoped conversational assistant with a strict prompt-injection firewall, deterministic fallback mode, and verifiable citation links.",
      icon: Sparkles,
    },
    {
      title: "Triple-Lock Resilience",
      desc: "Guaranteed stage availability with pre-computed SHA-256 verified recovery snapshots and dynamic weight renormalization on degraded engines.",
      icon: Lock,
    },
  ];

  return (
    <div className="flex-1 py-12">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        {/* Hero Section */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400 mb-4 font-medium">
            <ShieldCheck className="h-4 w-4" />
            About AuditGraph Architecture
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
            Explainable Anomaly Triage for SME Financial Audits
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Chartered accountants and financial auditors face tens of thousands of ledger transactions during statutory audits. Generic AI models produce black-box hallucinations that cannot be submitted as workpapers. AuditGraph solves this by combining deterministic accounting rules, machine learning, and relational graph algorithms with mathematical proof.
          </p>
        </div>

        {/* How It Works (6-Stage Stepper) */}
        <div className="my-16">
          <div className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">How AuditGraph Works</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              The rigorous end-to-end pipeline from raw ledger upload to finalized investigation workpapers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="p-5 rounded-xl border border-border/80 bg-card shadow-sm hover:border-emerald-500/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs font-bold text-emerald-400">{step.num}</span>
                      <div className="p-2 rounded-lg bg-secondary text-foreground border border-border">
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-foreground">{step.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Technical Features Grid */}
        <div className="my-16">
          <div className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Core Detection & Forensic Engines</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Capabilities verified in the AuditGraph backend runtime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="p-5 rounded-xl border border-border bg-card/60 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit mb-3">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">{feat.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team Section */}
        <div className="my-16 pt-12 border-t border-border">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-5 w-5 text-emerald-400" />
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">Our Team</h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              The engineers and researchers building AuditGraph. (Easily updated via <code className="font-mono text-foreground">data/team.ts</code>).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TEAM_MEMBERS.map((member) => (
              <div
                key={member.id}
                className="p-6 rounded-2xl border border-border bg-card shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="h-12 w-12 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-base text-foreground mb-4">
                    {member.name.slice(0, 2).toUpperCase()}
                  </div>
                  <h3 className="text-base font-bold text-foreground">{member.name}</h3>
                  <span className="text-xs font-semibold text-emerald-400 block mt-0.5 font-mono">
                    {member.role}
                  </span>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    {member.responsibility}
                  </p>
                </div>

                <div className="flex items-center gap-3 mt-5 pt-4 border-t border-border/60 text-xs">
                  {member.github && (
                    <a
                      href={member.github}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Github className="h-3.5 w-3.5" /> GitHub
                    </a>
                  )}
                  {member.linkedin && (
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Bottom Banner */}
        <div className="mt-16 p-8 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-card to-secondary text-center max-w-4xl mx-auto">
          <h3 className="text-xl font-bold text-foreground">Ready to Triage Your SME Ledger?</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
            Upload your financial files now to run the multi-engine analysis suite in less than 35 seconds.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 text-sm transition-all shadow-sm"
            >
              Start New Audit Now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
