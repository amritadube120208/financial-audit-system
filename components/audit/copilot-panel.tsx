"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Bot, User, Sparkles, AlertCircle, CheckCircle2, ChevronRight, X, ShieldAlert } from "lucide-react";
import { createCopilotSession, sendCopilotMessage, getCopilotMessages, getErrorMessage } from "@/lib/api";
import type { CopilotMessage, FindingItem } from "@/lib/types";
import { formatINR } from "@/lib/utils";

interface CopilotPanelProps {
  runId?: string | null;
  activeFinding?: FindingItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const CANONICAL_STAGE_RUN_ID = "run_df347dce3c1f489e";

export function CopilotPanel({ runId, activeFinding, isOpen, onClose }: CopilotPanelProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize session
  useEffect(() => {
    let mounted = true;
    async function init() {
      setErrorMessage(null);
      const targetRunId = runId?.trim() || CANONICAL_STAGE_RUN_ID;
      try {
        const session = await createCopilotSession(targetRunId, `Audit ${targetRunId.slice(0, 8)}`);
        if (mounted) {
          setSessionId(session.session_id);
          // Initial greeting
          setMessages([
            {
              message_id: "welcome",
              session_id: session.session_id,
              run_id: targetRunId,
              role: "assistant",
              answer:
                "Hello, I am your AuditGraph AI Copilot. I can inspect ledger findings, explain statistical anomaly flags, query counterparty transaction volumes, or provide audit evidence citations. How can I assist your investigation?",
              mode: "deterministic_fallback",
              confidence: "high",
              grounded: true,
              safety_note: "Auditor review signal only, not a legal fraud determination.",
            },
          ]);
        }
      } catch (err) {
        // If targetRunId failed and it wasn't the default canonical run, fall back to canonical run
        if (targetRunId !== CANONICAL_STAGE_RUN_ID) {
          try {
            const fallbackSession = await createCopilotSession(CANONICAL_STAGE_RUN_ID, "Audit Default");
            if (mounted) {
              setSessionId(fallbackSession.session_id);
              setMessages([
                {
                  message_id: "welcome",
                  session_id: fallbackSession.session_id,
                  run_id: CANONICAL_STAGE_RUN_ID,
                  role: "assistant",
                  answer:
                    "Connected to the canonical audit run (run_df347dce3c1f489e). How can I assist your investigation?",
                  mode: "deterministic_fallback",
                  confidence: "high",
                  grounded: true,
                  safety_note: "Auditor review signal only, not a legal fraud determination.",
                },
              ]);
            }
            return;
          } catch {
            // fall through to error message
          }
        }
        if (mounted) setErrorMessage(getErrorMessage(err));
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, [runId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || !sessionId || isLoading) return;

    setInput("");
    setErrorMessage(null);

    // Optimistic user message
    const userMsg: CopilotMessage = {
      message_id: `user_${Date.now()}`,
      session_id: sessionId,
      run_id: runId || "run_df347dce3c1f489e",
      role: "user",
      content: query,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await sendCopilotMessage(sessionId, query, activeFinding?.finding_id);
      setMessages((prev) => [...prev, { ...response, role: "assistant" }]);
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-[#101317] border-l border-[rgba(237,231,220,0.13)] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col font-body">
      {/* Drawer Header */}
      <div className="p-4 border-b border-[rgba(237,231,220,0.1)] bg-[#0A0C0E] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-sm bg-[#101317] text-[#E8913C] flex items-center justify-center border border-[rgba(237,231,220,0.15)]">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-sm text-[#EDE7DC]">
                AUDIT COPILOT
              </span>
              <span className="text-[#E8913C] font-bold">.</span>
              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#2E6B72] px-1.5 py-0.2 bg-[#2E6B72]/10 border border-[#2E6B72]/30 rounded-sm">
                GROUNDED
              </span>
            </div>
            <span className="font-mono text-[10px] text-[#6C7378] block">
              GROQ LLM {"//"} AUDIT PROVENANCE ENGINE
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-sm text-[#6C7378] hover:text-[#EDE7DC] hover:bg-[#0A0C0E] transition-colors"
          title="Close Copilot Drawer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Active Investigation Context Banner */}
      {activeFinding && (
        <div className="p-3 bg-[#0A0C0E] border-b border-[rgba(237,231,220,0.1)] text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-display font-semibold text-[#EDE7DC] truncate max-w-[200px]" title={activeFinding.title}>
              CASE: {activeFinding.title}
            </span>
            <span className="font-mono text-[#E8913C] font-bold">
              RISK: {activeFinding.risk_score}/100
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-[#9EA5A8]">
            <span className="uppercase">SEVERITY: {activeFinding.severity}</span>
            <span>EXPOSURE: {formatINR(activeFinding.monetary_exposure)}</span>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map((m, idx) => {
          const isUser = m.role === "user";
          return (
            <div key={m.message_id || idx} className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
              {!isUser && (
                <div className="h-6 w-6 rounded-sm bg-[#0A0C0E] text-[#E8913C] flex items-center justify-center shrink-0 mt-0.5 border border-[rgba(237,231,220,0.15)]">
                  <Bot className="h-3.5 w-3.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-sm p-3 space-y-2 ${
                  isUser
                    ? "bg-[#E8913C] text-[#0A0C0E] font-medium"
                    : "bg-[#0A0C0E] text-[#EDE7DC] border border-[rgba(237,231,220,0.12)]"
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{isUser ? m.content : m.answer}</p>

                {!isUser && m.citations && m.citations.length > 0 && (
                  <div className="pt-2 border-t border-[rgba(237,231,220,0.1)] text-[10px] space-y-1 font-mono">
                    <span className="text-[#6C7378] font-semibold block uppercase tracking-[0.1em]">Citations:</span>
                    {m.citations.map((c, i) => (
                      <div key={i} className="text-[#2E6B72] truncate">
                        • [{c.type}] {c.label} ({c.id})
                      </div>
                    ))}
                  </div>
                )}

                {!isUser && m.safety_note && (
                  <div className="text-[9px] text-[#6C7378] italic pt-1 font-mono">
                    {m.safety_note}
                  </div>
                )}
              </div>

              {isUser && (
                <div className="h-6 w-6 rounded-sm bg-[#101317] text-[#EDE7DC] flex items-center justify-center shrink-0 mt-0.5 border border-[rgba(237,231,220,0.2)]">
                  <User className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs font-mono text-[#9EA5A8] pl-8">
            <span className="h-3.5 w-3.5 border-2 border-[#E8913C] border-t-transparent rounded-full animate-spin" />
            <span>Consulting audit ledger & detectors...</span>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Quick Action Buttons */}
      <div className="px-4 py-2.5 border-t border-[rgba(237,231,220,0.1)] bg-[#0A0C0E] flex flex-wrap gap-1.5 text-[10px] font-mono">
        <button
          onClick={() => handleSend("Why is this risky?")}
          className="px-2.5 py-1 rounded-sm bg-[#101317] hover:border-[#E8913C] text-[#EDE7DC] hover:text-[#E8913C] border border-[rgba(237,231,220,0.15)] transition-colors"
        >
          Why is this risky?
        </button>
        <button
          onClick={() => handleSend("Trace money flows and circular counterparty paths.")}
          className="px-2.5 py-1 rounded-sm bg-[#101317] hover:border-[#E8913C] text-[#EDE7DC] hover:text-[#E8913C] border border-[rgba(237,231,220,0.15)] transition-colors"
        >
          Trace Money
        </button>
        <button
          onClick={() => handleSend("Explain the statistical anomaly scoring risk.")}
          className="px-2.5 py-1 rounded-sm bg-[#101317] hover:border-[#E8913C] text-[#EDE7DC] hover:text-[#E8913C] border border-[rgba(237,231,220,0.15)] transition-colors"
        >
          Explain Risk
        </button>
        <button
          onClick={() => handleSend("Summarize any GST reconciliation or invoice evidence.")}
          className="px-2.5 py-1 rounded-sm bg-[#101317] hover:border-[#E8913C] text-[#EDE7DC] hover:text-[#E8913C] border border-[rgba(237,231,220,0.15)] transition-colors"
        >
          GST Evidence
        </button>
        <button
          onClick={() => handleSend("What if the graph cycle is removed from the fusion score?")}
          className="px-2.5 py-1 rounded-sm bg-[#101317] hover:border-[#E8913C] text-[#EDE7DC] hover:text-[#E8913C] border border-[rgba(237,231,220,0.15)] transition-colors"
        >
          What If Graph Removed?
        </button>
        <button
          onClick={() => handleSend("What are the next audit verification steps for workpapers?")}
          className="px-2.5 py-1 rounded-sm bg-[#101317] hover:border-[#E8913C] text-[#EDE7DC] hover:text-[#E8913C] border border-[rgba(237,231,220,0.15)] transition-colors"
        >
          Next Audit Steps
        </button>
      </div>

      {/* Error Bar */}
      {errorMessage && (
        <div className="px-4 py-2 bg-[#E8913C]/10 text-[#E8913C] text-[11px] font-mono border-t border-[#E8913C]/40">
          {errorMessage}
        </div>
      )}

      {/* Input Bar */}
      <div className="p-3 border-t border-[rgba(237,231,220,0.1)] bg-[#0A0C0E] flex items-center gap-2">
        <input
          type="text"
          placeholder="Ask Copilot about findings, rules, or entities..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 h-9 px-3 rounded-sm border border-[rgba(237,231,220,0.15)] bg-[#101317] text-xs text-[#EDE7DC] placeholder:text-[#6C7378] focus:outline-none focus:border-[#E8913C]"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || isLoading}
          className="h-9 w-9 rounded-sm bg-[#E8913C] hover:bg-[#E8913C]/90 text-[#0A0C0E] flex items-center justify-center transition-colors disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
