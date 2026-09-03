import Link from "next/link";
import {
  ShieldCheck,
  Cpu,
  Layers,
  Network,
  ArrowRight,
  User,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
interface TeamMember {
  id: string;
  name: string;
  role: string;
  responsibility: string;
  image: string;
  skills: string[];
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "kushi",
    name: "Kushi Singh",
    role: "Lead ML & Anomaly Detection Engineer",
    responsibility:
      "Architected the multi-engine IsolationForest & statistical outlier modeling pipelines. Designed automated materiality scoring and dynamic risk thresholding for high-volume SME general ledgers.",
    image: "/team/kushi_singh.png",
    skills: ["Scikit-learn", "Isolation Forest", "Statistical Outliers", "Polars"],
  },
  {
    id: "prem",
    name: "Prem Upadhyay",
    role: "Graph Forensics & Algorithmic Lead",
    responsibility:
      "Engineered the NetworkX graph cycle detection algorithms, circular round-trip money flow tracing, and Cytoscape.js interactive topological visualization for complex entity networks.",
    image: "/team/prem_upadhyay.png",
    skills: ["NetworkX", "Graph Cycle Analysis", "Cytoscape.js", "Algorithmic Forensics"],
  },
  {
    id: "amrita",
    name: "Amrita Dube",
    role: "Full Stack & Core Platform Lead",
    responsibility:
      "Built the end-to-end FastAPI backend services, Next.js 14 reactive dashboard, GSTR-2B statutory tax reconciliation pipeline, and hardened database persistence architecture.",
    image: "/team/amrita_dube.png",
    skills: ["FastAPI", "Next.js 14", "SQLAlchemy", "GST Reconciliation"],
  },
  {
    id: "shreya",
    name: "Shreya Singh",
    role: "AI Systems & Copilot Architect",
    responsibility:
      "Spearheaded the Grounded Statutory Copilot system, Groq LLM inference cascade, multi-tool forensic registry, and anti-hallucination citation validation framework.",
    image: "/team/shreya_singh.png",
    skills: ["Groq LLM", "Prompt Hardening", "Grounding Engine", "Agentic Systems"],
  },
];

export default function AboutPage() {
  const architectureFlow = [
    { step: "01", name: "Ledger Ingestion", desc: "SHA-256 fingerprinting & canonical decimal parsing" },
    { step: "02", name: "Schema Validation", desc: "Heterogeneous column mapping & alignment" },
    { step: "03", name: "Multi-Engine Detection", desc: "10 Rules + Isolation Forest + NetworkX graph cycles" },
    { step: "04", name: "Evidence Fusion", desc: "Renormalized scoring & logarithmic materiality dampening" },
    { step: "05", name: "Investigation Cases", desc: "Synthesized evidence packages & relational graph ties" },
    { step: "06", name: "Audit Copilot", desc: "Grounded conversational query assistant with citations" },
  ];

  const techStack = [
    {
      category: "Frontend Experience",
      items: ["Next.js (App Router)", "TypeScript", "Tailwind CSS", "Cytoscape.js Graph", "Recharts", "TanStack Query"],
    },
    {
      category: "Backend Engine",
      items: ["FastAPI Async", "Python 3.12", "SQLAlchemy ORM", "Uvicorn ASGI", "Pydantic v2 Models"],
    },
    {
      category: "Analytics & Detection",
      items: ["Scikit-learn (Isolation Forest)", "NetworkX (Directed Graph Cycles)", "Polars / Pandas (Vectorized Rules)"],
    },
    {
      category: "AI & Provenance",
      items: ["Groq LLM Acceleration", "Grounded Citation Engine", "Deterministic Fallback", "Evidence Provenance Router"],
    },
  ];

  return (
    <div className="flex-1 py-12 md:py-20 bg-[#0A0C0E] text-[#EDE7DC] font-body">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 space-y-20">
        {/* ============================================================ */}
        {/* SECTION 1: PROJECT HEADER                                    */}
        {/* ============================================================ */}
        <section className="space-y-4 border-b border-[rgba(237,231,220,0.13)] pb-12">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-[#E8913C]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E8913C]" />
            SYSTEM SPECIFICATION & ARCHITECTURE
          </div>
          <h1 className="font-display font-extrabold text-4xl sm:text-6xl text-[#EDE7DC] tracking-[-0.03em]">
            AUDITGRAPH<span className="text-[#E8913C]">.</span>
          </h1>
          <p className="text-base sm:text-lg font-mono text-[#2E6B72] tracking-[0.05em]">
            EXPLAINABLE FINANCIAL AUDIT INTELLIGENCE FOR SMES
          </p>
          <p className="text-sm sm:text-base text-[#9EA5A8] leading-relaxed max-w-3xl font-body">
            AuditGraph is an explainable anomaly triage system designed for chartered accountants and forensic auditors reviewing small and medium enterprise financial ledgers. It combines deterministic accounting rules, unsupervised machine learning, and relational graph algorithms to synthesize high-conviction investigation cases with verifiable mathematical evidence.
          </p>
        </section>

        {/* ============================================================ */}
        {/* SECTION 2: THE PROBLEM                                       */}
        {/* ============================================================ */}
        <section className="space-y-6 border-b border-[rgba(237,231,220,0.13)] pb-12">
          <div>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#6C7378] block">
              01 {"//"} AUDIT REALITY
            </span>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#EDE7DC] mt-1 tracking-tight">
              The Ledger Review Bottleneck
            </h2>
          </div>

          <div className="p-8 rounded-sm border border-[rgba(237,231,220,0.13)] bg-[#101317] space-y-4">
            <p className="text-sm text-[#EDE7DC] leading-relaxed">
              Auditors typically receive tens of thousands or hundreds of thousands of raw ledger entries during statutory and internal audits. Manually inspecting every row to identify subtle fraud topologies:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#9EA5A8] font-mono pt-2">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E8913C]" />
                Exact and near-duplicate disbursements
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E8913C]" />
                Circular round-tripping money rings
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E8913C]" />
                Backdated postings & holiday ledger entries
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E8913C]" />
                GST input tax credit reconciliations
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E8913C]" />
                Month-end & period-closing spikes
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E8913C]" />
                Suspicious round-amount payment splits
              </li>
            </ul>
            <p className="text-xs sm:text-sm text-[#9EA5A8] leading-relaxed pt-2 border-t border-[rgba(237,231,220,0.08)]">
              is extraordinarily time-consuming and error-prone. AuditGraph solves this by drastically reducing the search surface by ~94%, prioritizing the small set of transactions that genuinely deserve professional review.
            </p>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 3: THE SOLUTION                                      */}
        {/* ============================================================ */}
        <section className="space-y-6 border-b border-[rgba(237,231,220,0.13)] pb-12">
          <div>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#E8913C] block">
              02 {"//"} PARALLEL FUSION
            </span>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#EDE7DC] mt-1 tracking-tight">
              Multi-Engine Forensic Fusion
            </h2>
          </div>

          <div className="p-8 rounded-sm border border-[rgba(237,231,220,0.13)] bg-[#101317] space-y-4">
            <div className="font-mono text-xs sm:text-sm text-[#EDE7DC] font-semibold flex flex-wrap items-center gap-2">
              <span className="text-[#EDE7DC]">Deterministic Rules</span>
              <span className="text-[#E8913C]">+</span>
              <span className="text-[#EDE7DC]">Isolation Forest ML</span>
              <span className="text-[#E8913C]">+</span>
              <span className="text-[#EDE7DC]">NetworkX Graph Forensics</span>
              <span className="text-[#E8913C]">+</span>
              <span className="text-[#EDE7DC]">GST Reconciliation</span>
              <span className="text-[#E8913C]">+</span>
              <span className="text-[#EDE7DC]">Materiality Scoring</span>
              <span className="text-[#2E6B72]">→</span>
              <span className="text-[#E8913C] underline underline-offset-4">Prioritized Triage Cases</span>
            </div>
            <p className="text-xs sm:text-sm text-[#9EA5A8] leading-relaxed">
              Every surfaced case includes exact ledger row citations, computed anomaly metrics, an auditor narrative, a directed money-flow graph, and a grounded conversational copilot session.
            </p>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 4: ARCHITECTURE PIPELINE                             */}
        {/* ============================================================ */}
        <section className="space-y-6 border-b border-[rgba(237,231,220,0.13)] pb-12">
          <div>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#6C7378] block">
              03 {"//"} FLOW
            </span>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#EDE7DC] mt-1 tracking-tight">
              6-Stage Execution Pipeline
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {architectureFlow.map((step) => (
              <div
                key={step.step}
                className="p-5 rounded-sm border border-[rgba(237,231,220,0.13)] bg-[#101317] space-y-2 hover:border-[#E8913C] transition-colors"
              >
                <div className="flex items-center justify-between font-mono">
                  <span className="text-lg font-display font-extrabold text-[#E8913C]">{step.step}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#2E6B72]" />
                </div>
                <h3 className="font-display font-bold text-sm text-[#EDE7DC]">{step.name}</h3>
                <p className="text-xs font-body text-[#9EA5A8] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 5: TECH STACK                                        */}
        {/* ============================================================ */}
        <section className="space-y-6 border-b border-[rgba(237,231,220,0.13)] pb-12">
          <div>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#6C7378] block">
              04 {"//"} REPOSITORY STACK
            </span>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#EDE7DC] mt-1 tracking-tight">
              Verified Production Stack
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {techStack.map((group) => (
              <div key={group.category} className="p-6 rounded-sm border border-[rgba(237,231,220,0.13)] bg-[#101317] space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-[0.14em] text-[#E8913C]">
                  {group.category}
                </h3>
                <ul className="space-y-2 text-xs text-[#EDE7DC] font-mono">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-[#6C7378]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 6: TEAM                                              */}
        {/* ============================================================ */}
        <section className="space-y-6 border-b border-[rgba(237,231,220,0.13)] pb-12">
          <div>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#6C7378] block">
              05 {"//"} PEOPLE
            </span>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#EDE7DC] mt-1 tracking-tight">
              Project Contributors
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TEAM_MEMBERS.map((member) => (
              <div
                key={member.id}
                className="p-6 rounded-sm border border-[rgba(237,231,220,0.13)] bg-[#101317] space-y-4 text-center hover:border-[#E8913C] transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="h-24 w-24 rounded-2xl overflow-hidden border-2 border-[rgba(237,231,220,0.2)] mx-auto mb-4 shadow-md group-hover:border-[#E8913C] transition-colors">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <h3 className="font-display font-bold text-base text-[#EDE7DC]">{member.name}</h3>
                  <span className="text-xs font-mono text-[#E8913C] block mt-1 font-semibold">
                    {member.role}
                  </span>
                  <p className="text-xs font-body text-[#9EA5A8] mt-3 leading-relaxed text-left sm:text-center">
                    {member.responsibility}
                  </p>
                </div>
                {member.skills && (
                  <div className="pt-4 border-t border-[rgba(237,231,220,0.08)] flex flex-wrap gap-1.5 justify-center">
                    {member.skills.map((s) => (
                      <span
                        key={s}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-[#161A1F] text-[#9EA5A8] border border-[rgba(237,231,220,0.1)]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 7: PRINCIPLE                                         */}
        {/* ============================================================ */}
        <section className="p-6 rounded-sm border border-[rgba(237,231,220,0.13)] bg-[#101317] space-y-2 font-mono text-xs">
          <div className="flex items-center gap-2 text-[#E8913C] font-bold">
            <AlertCircle className="h-4 w-4" />
            <span>AUDIT PRINCIPLE & STATUTORY BOUNDARY</span>
          </div>
          <p className="text-[#9EA5A8] font-body text-xs sm:text-sm leading-relaxed">
            AuditGraph does not replace Chartered Accountants or financial auditors. It reduces the search problem before professional judgment begins. All risk scores, anomaly badges, and copilot answers are advisory triage priorities and review surface signals, not definitive legal fraud determinations.
          </p>
        </section>

        {/* Final CTA */}
        <div className="text-center pt-4">
          <Link
            href="/audit"
            className="inline-flex items-center gap-2 rounded-full bg-[#E8913C] hover:bg-[#E8913C]/90 text-[#0A0C0E] px-8 py-3 text-xs font-mono uppercase tracking-[0.14em] font-semibold transition-all shadow-md"
          >
            Launch Audit Workspace <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
