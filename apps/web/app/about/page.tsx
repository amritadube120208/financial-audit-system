"use client";

import React from "react";
import {
  Sparkles,
  Network,
  Cpu,
  Calculator,
  ShieldAlert,
  CheckCircle2,
  Users,
  Code2,
  Database,
  BrainCircuit,
  Binary,
  Layers,
} from "lucide-react";

interface TeamMember {
  name: string;
  role: string;
  image: string;
  contribution: string;
  skills: string[];
}

const teamMembers: TeamMember[] = [
  {
    name: "Kushi Singh",
    role: "Lead ML & Anomaly Detection Engineer",
    image: "/team/kushi_singh.png",
    contribution:
      "Architected the multi-engine IsolationForest & statistical outlier modeling pipelines. Designed automated materiality scoring and dynamic risk thresholding for high-volume SME general ledgers.",
    skills: ["Scikit-learn", "Isolation Forest", "Statistical Outliers", "Polars"],
  },
  {
    name: "Prem Upadhyay",
    role: "Graph Forensics & Algorithmic Lead",
    image: "/team/prem_upadhyay.png",
    contribution:
      "Engineered the NetworkX graph cycle detection algorithms, circular round-trip money flow tracing, and Cytoscape.js interactive topological visualization for complex entity networks.",
    skills: ["NetworkX", "Graph Cycle Analysis", "Cytoscape.js", "Algorithmic Forensics"],
  },
  {
    name: "Amrita Dube",
    role: "Full Stack & Core Platform Lead",
    image: "/team/amrita_dube.png",
    contribution:
      "Built the end-to-end FastAPI backend services, Next.js 14 reactive dashboard, GSTR-2B statutory tax reconciliation pipeline, and hardened database persistence architecture.",
    skills: ["FastAPI", "Next.js 14", "SQLAlchemy", "GST Reconciliation"],
  },
  {
    name: "Shreya Singh",
    role: "AI Systems & Copilot Architect",
    image: "/team/shreya_singh.png",
    contribution:
      "Spearheaded the Grounded Statutory Copilot system, Groq LLM inference cascade, multi-tool forensic registry, and anti-hallucination citation validation framework.",
    skills: ["Groq LLM", "Prompt Hardening", "Grounding Engine", "Agentic Systems"],
  },
];

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-14 py-12 px-4 sm:px-6">
      {/* SECTION 1: HERO HEADER */}
      <section className="space-y-4 border-b border-slate-200 pb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          <span>Explainable Financial Audit Intelligence for SMEs</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">AUDITGRAPH</h1>
        <p className="text-lg text-slate-600 leading-relaxed max-w-3xl">
          A multi-engine anomaly triage and forensic platform designed to empower Chartered
          Accountants to navigate massive general ledgers, prioritize high-risk investigation cases,
          and trace suspicious money flows with verified, explainable evidence.
        </p>
      </section>

      {/* SECTION 2: THE PROBLEM */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-6 bg-brand-600 rounded-full" />
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">The Problem</h2>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Statutory auditors routinely receive tens of thousands or hundreds of thousands of ledger
            entries from SMEs. Manually uncovering circular round-tripping, backdated vouchers,
            GST input tax credit mismatches, and structured anomalies is labor-intensive, error-prone,
            and often impractical within statutory deadlines. Auditors require an analytical filter
            that prioritizes the small, critical subset of transactions deserving rigorous professional scrutiny.
          </p>
        </div>
      </section>

      {/* SECTION 3: THE MULTI-ENGINE SOLUTION */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-6 bg-brand-600 rounded-full" />
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">The Multi-Engine Solution</h2>
        </div>
        <div className="bg-gradient-to-br from-slate-50 to-brand-50/40 border border-slate-200 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm font-semibold text-slate-700">
            <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-blue-600" /> Statutory Rules
            </span>
            <span className="text-slate-400 font-bold">+</span>
            <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-purple-600" /> ML Anomaly Triage
            </span>
            <span className="text-slate-400 font-bold">+</span>
            <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center gap-1.5">
              <Network className="w-4 h-4 text-amber-600" /> Graph Forensics
            </span>
            <span className="text-slate-400 font-bold">+</span>
            <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> GST Reconciliation
            </span>
            <span className="text-slate-400 font-bold">→</span>
            <span className="px-4 py-2 bg-brand-600 text-white rounded-xl shadow-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-300" /> Prioritized Investigation Cases
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 4: PIPELINE ARCHITECTURE */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-6 bg-brand-600 rounded-full" />
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">How AuditGraph Works</h2>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xs">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-52 text-center px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
              General Ledger Ingestion (CSV / XLSX)
            </div>
            <div className="h-4 border-l-2 border-slate-300"></div>
            <div className="w-52 text-center px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
              Deterministic Schema Validation
            </div>
            <div className="h-4 border-l-2 border-slate-300"></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-xl">
              <div className="px-3 py-2 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-blue-600" /> Rules Engine
              </div>
              <div className="px-3 py-2 bg-purple-50 border border-purple-200 text-purple-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-purple-600" /> IsolationForest
              </div>
              <div className="px-3 py-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5">
                <Network className="w-3.5 h-3.5 text-amber-600" /> Cycle Detector
              </div>
              <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> GSTR-2B ITC
              </div>
            </div>
            <div className="h-4 border-l-2 border-slate-300"></div>
            <div className="w-52 text-center px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
              Risk Fusion & Deduplication
            </div>
            <div className="h-4 border-l-2 border-slate-300"></div>
            <div className="w-64 text-center px-4 py-3 bg-brand-600 text-white rounded-xl text-sm font-bold shadow-xs flex items-center justify-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-300" /> Ranked Investigation Cases
            </div>
            <div className="h-4 border-l-2 border-slate-300"></div>
            <div className="w-60 text-center px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs">
              <Sparkles className="w-4 h-4 text-indigo-600" /> Grounded Forensic Copilot
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: ENGINEERING TEAM */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-6 bg-brand-600 rounded-full" />
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Core Engineering Team</h2>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-600 rounded-full">
            4 Contributors
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teamMembers.map((member) => (
            <div
              key={member.name}
              className="group bg-white border border-slate-200 hover:border-brand-300 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-100 shadow-sm group-hover:border-brand-500 transition-colors"
                  />
                  <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                    ✓
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                    {member.name}
                  </h3>
                  <p className="text-xs font-semibold text-brand-600">{member.role}</p>
                  <p className="text-xs text-slate-600 leading-relaxed pt-1">{member.contribution}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-1.5">
                {member.skills.map((skill) => (
                  <span
                    key={skill}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 6: TECH STACK MATRIX */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-6 bg-brand-600 rounded-full" />
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Technology Architecture</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Code2 className="w-4 h-4 text-brand-600" />
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Frontend</h3>
            </div>
            <ul className="space-y-2 text-xs font-medium text-slate-700">
              <li>• Next.js 14 (App Router)</li>
              <li>• TypeScript & React 18</li>
              <li>• Tailwind CSS & Lucide</li>
              <li>• Cytoscape.js Graph Engine</li>
            </ul>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-brand-600" />
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Backend</h3>
            </div>
            <ul className="space-y-2 text-xs font-medium text-slate-700">
              <li>• FastAPI & Uvicorn</li>
              <li>• Python 3.12 Engine</li>
              <li>• SQLAlchemy & SQLite</li>
              <li>• Async Pydantic v2</li>
            </ul>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Binary className="w-4 h-4 text-brand-600" />
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Analytics</h3>
            </div>
            <ul className="space-y-2 text-xs font-medium text-slate-700">
              <li>• Scikit-learn (IsolationForest)</li>
              <li>• NetworkX Directed Graphs</li>
              <li>• Polars High-Speed I/O</li>
              <li>• DuckDB Analytical Engine</li>
            </ul>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <BrainCircuit className="w-4 h-4 text-brand-600" />
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">AI & Copilot</h3>
            </div>
            <ul className="space-y-2 text-xs font-medium text-slate-700">
              <li>• Groq Compound Inference</li>
              <li>• Dynamic Citation Grounding</li>
              <li>• Anti-Hallucination Barrier</li>
              <li>• Deterministic Fallback</li>
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 7: PROJECT PRINCIPLE */}
      <section className="p-8 bg-slate-900 rounded-2xl text-center space-y-3 shadow-lg">
        <ShieldAlert className="w-9 h-9 text-amber-400 mx-auto" />
        <h2 className="text-xl font-bold text-white tracking-tight">Statutory Forensic Principle</h2>
        <p className="text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
          AuditGraph is designed to augment, not replace, Chartered Accountants. It serves as an
          analytical triage platform to compress massive ledger search spaces before statutory
          investigative judgment begins. All findings establish <strong>audit review priority</strong> and
          evidence trails, not definitive determinations of fraud.
        </p>
      </section>
    </div>
  );
}
