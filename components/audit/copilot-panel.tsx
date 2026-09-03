"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Bot, User, Sparkles, AlertCircle, CheckCircle2, ChevronRight, X } from "lucide-react";
import { createCopilotSession, sendCopilotMessage, getCopilotMessages, getErrorMessage } from "@/lib/api";
import type { CopilotMessage } from "@/lib/types";

interface CopilotPanelProps {
  runId: string;
  activeFindingId?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CopilotPanel({ runId, activeFindingId, isOpen, onClose }: CopilotPanelProps) {
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
      try {
        const session = await createCopilotSession(runId, `Audit ${runId.slice(0, 8)}`);
        if (mounted) {
          setSessionId(session.session_id);
          // Initial greeting
          setMessages([
            {
              message_id: "welcome",
              session_id: session.session_id,
              run_id: runId,
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
        if (mounted) setErrorMessage(getErrorMessage(err));
      }
    }
    if (runId) init();
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
      run_id: runId,
      role: "user",
      content: query,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await sendCopilotMessage(sessionId, query, activeFindingId);
      setMessages((prev) => [...prev, { ...response, role: "assistant" }]);
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border/80 flex items-center justify-between bg-secondary/30">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              Audit Copilot
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Grounded
              </span>
            </h3>
            <span className="text-[11px] text-muted-foreground block font-mono">
              Session: {sessionId?.slice(0, 12) || "initializing..."}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map((m, idx) => {
          const isUser = m.role === "user";
          return (
            <div key={m.message_id || idx} className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
              {!isUser && (
                <div className="h-6 w-6 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/20">
                  <Bot className="h-3.5 w-3.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-xl p-3 space-y-2 ${
                  isUser
                    ? "bg-emerald-500 text-slate-950 font-medium"
                    : "bg-secondary/70 text-foreground border border-border/60"
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{isUser ? m.content : m.answer}</p>

                {!isUser && m.citations && m.citations.length > 0 && (
                  <div className="pt-2 border-t border-border/50 text-[10px] space-y-1 font-mono">
                    <span className="text-muted-foreground font-semibold block uppercase">Citations:</span>
                    {m.citations.map((c, i) => (
                      <div key={i} className="text-emerald-400 truncate">
                        • [{c.type}] {c.label} ({c.id})
                      </div>
                    ))}
                  </div>
                )}

                {!isUser && m.safety_note && (
                  <div className="text-[9px] text-muted-foreground/80 italic pt-1">
                    {m.safety_note}
                  </div>
                )}
              </div>

              {isUser && (
                <div className="h-6 w-6 rounded-md bg-secondary text-foreground flex items-center justify-center shrink-0 mt-0.5 border border-border">
                  <User className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pl-8">
            <span className="h-3.5 w-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <span>Consulting audit ledger & detectors...</span>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Suggested Prompts */}
      <div className="px-4 py-2 border-t border-border/40 bg-secondary/20 flex flex-wrap gap-1.5 text-[10px]">
        <button
          onClick={() => handleSend("What are the top 3 highest risk findings?")}
          className="px-2 py-1 rounded bg-secondary hover:bg-secondary/80 text-foreground border border-border/60 transition-colors"
        >
          Top 3 findings?
        </button>
        <button
          onClick={() => handleSend("Explain any duplicate invoice patterns detected.")}
          className="px-2 py-1 rounded bg-secondary hover:bg-secondary/80 text-foreground border border-border/60 transition-colors"
        >
          Duplicate invoices?
        </button>
        <button
          onClick={() => handleSend("Summarize the overall audit exposure.")}
          className="px-2 py-1 rounded bg-secondary hover:bg-secondary/80 text-foreground border border-border/60 transition-colors"
        >
          Total exposure?
        </button>
      </div>

      {/* Error Bar */}
      {errorMessage && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-[11px] border-t border-destructive/30">
          {errorMessage}
        </div>
      )}

      {/* Input Bar */}
      <div className="p-3 border-t border-border bg-card flex items-center gap-2">
        <input
          type="text"
          placeholder="Ask Copilot about findings, rules, or entities..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 h-9 px-3 rounded-lg border border-border bg-secondary/50 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || isLoading}
          className="h-9 w-9 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center transition-all disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
