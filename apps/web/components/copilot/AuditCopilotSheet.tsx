"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  ShieldCheck,
  Cpu,
  ExternalLink,
  Loader2,
  HelpCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import {
  createCopilotSession,
  sendCopilotMessageWithRecovery,
  getCopilotMessages,
  getProviderHealth,
  CopilotError,
} from "../../lib/api/copilot";
import { CopilotMessage } from "../../lib/types/api";
import { useUiStore } from "../../stores/useUiStore";
import { formatDateTime } from "../../lib/utils/formatters";

interface AuditCopilotSheetProps {
  runId?: string;
}

export const AuditCopilotSheet: React.FC<AuditCopilotSheetProps> = ({ runId: propRunId }) => {
  const params = useParams();
  const runId = propRunId || (params?.runId as string) || "run-demo-sme-2026";
  const { isCopilotOpen, setIsCopilotOpen, selectedFindingId, setSelectedFindingId } = useUiStore();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [inputQuery, setInputQuery] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // 1. Non-blocking Provider Health Query
  const { data: healthData } = useQuery({
    queryKey: ["copilot-provider-health"],
    queryFn: getProviderHealth,
    staleTime: 30000,
  });

  // 2. Initialize or Refresh Copilot Session on Run Change
  useEffect(() => {
    let isMounted = true;
    if (isCopilotOpen && runId) {
      if (!sessionId) {
        createCopilotSession(runId)
          .then((res) => {
            if (isMounted) {
              setSessionId(res.session_id);
              setActionError(null);
            }
          })
          .catch((err) => {
            if (isMounted) {
              setActionError(err instanceof Error ? err.message : "Failed to establish Copilot session");
            }
          });
      }
    }
    return () => {
      isMounted = false;
    };
  }, [isCopilotOpen, sessionId, runId]);

  // 3. Durable Messages Query
  const { data: messages = [], isLoading: isLoadingMessages, refetch: refetchMessages } = useQuery({
    queryKey: ["copilot-messages", sessionId],
    queryFn: () => (sessionId ? getCopilotMessages(sessionId) : Promise.resolve([])),
    enabled: Boolean(sessionId),
    refetchInterval: 5000,
  });

  // 4. Send Message Mutation with Self-Healing Handshake
  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      setActionError(null);
      const res = await sendCopilotMessageWithRecovery(
        sessionId,
        runId,
        text,
        selectedFindingId || undefined
      );
      if (res.activeSessionId !== sessionId) {
        setSessionId(res.activeSessionId);
      }
      return res.message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["copilot-messages", sessionId] });
      setInputQuery("");
      setActionError(null);
    },
    onError: (err: any) => {
      const msg = err instanceof CopilotError ? err.message : (err?.message || "Message delivery failed.");
      setActionError(msg);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sendMutation.isPending]);

  const quickQuestions = [
    "Why is this critical?",
    "Trace circular money flow",
    "Show GST mismatches",
    "What if graph omitted?",
    "Recommended audit steps",
  ];

  const handleSend = (textToSend?: string) => {
    const q = textToSend || inputQuery;
    if (!q.trim() || sendMutation.isPending) return;
    sendMutation.mutate(q);
  };

  if (!isCopilotOpen) return null;

  const isGroqActive = healthData?.active_provider === "groq" && healthData?.providers?.groq?.reachable;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-hidden border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-border bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-brand-500 text-white shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight">Audit Copilot</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium border bg-slate-800 text-slate-300 border-slate-700">
                  {isGroqActive ? "AI · GROQ" : "EVIDENCE MODE"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Grounded Statutory Evidence Assistant</p>
            </div>
          </div>

          <button
            onClick={() => setIsCopilotOpen(false)}
            aria-label="Close Copilot"
            title="Close Copilot"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Error Banner (Non-crashing self-healing indicator) */}
        {actionError && (
          <div className="px-3 py-2 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button
              onClick={() => {
                setActionError(null);
                setSessionId(null);
              }}
              className="text-[11px] font-semibold text-rose-700 hover:text-rose-900 underline ml-2"
            >
              Retry Session
            </button>
          </div>
        )}

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs bg-slate-50/50">
          {isLoadingMessages && messages.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Connecting to durable Copilot session...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
                <Bot className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-800">Statutory Forensic Copilot Ready</h4>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Ask about critical investigations, trace money-flow graphs, or simulate detector exclusions for run{" "}
                <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800 font-mono">{runId}</code>.
              </p>
            </div>
          ) : (
            messages.map((msg: CopilotMessage) => {
              const isAssistant = msg.role === "assistant";
              const isAiGrounded =
                msg.grounding_mode?.includes("llm") ||
                msg.grounding_mode?.includes("groq") ||
                msg.grounding_mode === "llm_grounded";

              return (
                <div
                  key={msg.message_id}
                  className={`flex gap-2.5 ${isAssistant ? "items-start" : "items-start flex-row-reverse"}`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs ${
                      isAssistant ? "bg-brand-600 shadow-xs" : "bg-slate-700"
                    }`}
                  >
                    {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  <div className={`space-y-1.5 max-w-[85%] ${isAssistant ? "text-left" : "text-right"}`}>
                    <div
                      className={`p-3.5 rounded-xl shadow-xs leading-relaxed text-xs ${
                        isAssistant
                          ? "bg-white text-slate-900 border border-slate-200"
                          : "bg-brand-600 text-white text-left"
                      }`}
                    >
                      <div className="whitespace-pre-line font-sans">
                        {msg.content || (msg as any).answer || (msg as any).message || "Evidence grounded response"}
                      </div>

                      {/* Evidence Citations */}
                      {isAssistant && msg.citations && msg.citations.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                          {msg.citations.map((c, i) => (
                            <button
                              key={i}
                              onClick={() => c.source_id && setSelectedFindingId(c.source_id)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-mono text-[10px] font-semibold border border-indigo-200 transition-colors"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                              <span>{c.field ? `${c.field}: ${c.value}` : (c.source_id || "Evidence")}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Grounding Mode Status Badge */}
                    {isAssistant && (
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pl-1">
                        {isAiGrounded ? (
                          <span className="flex items-center gap-1 text-emerald-600 font-medium">
                            <Sparkles className="w-3 h-3 text-emerald-500" />
                            AI Grounded (Groq LLM)
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-slate-500 font-medium">
                            <Cpu className="w-3 h-3 text-slate-400" />
                            Deterministic Evidence Mode
                          </span>
                        )}
                        <span>•</span>
                        <span>{formatDateTime(msg.created_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {sendMutation.isPending && (
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 text-xs flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600" />
                <span>Grounding statutory audit evidence...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="p-3 border-t border-slate-100 bg-white space-y-1.5">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
            <HelpCircle className="w-3 h-3" />
            <span>Suggested Audit Inquiries:</span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={sendMutation.isPending}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer border border-slate-200 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 border-t border-border bg-white flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask Copilot about evidence, graph flows, or what-if..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={sendMutation.isPending}
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
          />

          <button
            type="submit"
            disabled={!inputQuery.trim() || sendMutation.isPending}
            className="p-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white rounded-lg transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
