"use client";

import React, { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { createCopilotSession, sendCopilotMessage, getCopilotMessages } from "../../lib/api/copilot";
import { CopilotMessage } from "../../lib/types/api";
import { useUiStore } from "../../stores/useUiStore";
import { formatDateTime } from "../../lib/utils/formatters";

interface AuditCopilotSheetProps {
  runId: string;
}

export const AuditCopilotSheet: React.FC<AuditCopilotSheetProps> = ({ runId }) => {
  const { isCopilotOpen, setIsCopilotOpen, setSelectedFindingId } = useUiStore();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [inputQuery, setInputQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Initialize or fetch Copilot Session
  useEffect(() => {
    let isMounted = true;
    if (isCopilotOpen && !sessionId && runId) {
      createCopilotSession(runId)
        .then((res) => {
          if (isMounted) setSessionId(res.session_id);
        })
        .catch((err) => console.error("Failed to start copilot session:", err));
    }
    return () => {
      isMounted = false;
    };
  }, [isCopilotOpen, sessionId, runId]);

  // Messages Query
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ["copilot-messages", sessionId],
    queryFn: () => (sessionId ? getCopilotMessages(sessionId) : Promise.resolve([])),
    enabled: Boolean(sessionId),
    refetchInterval: 6000,
  });

  // Send Message Mutation
  const sendMutation = useMutation({
    mutationFn: (text: string) => {
      if (!sessionId) throw new Error("No active session");
      return sendCopilotMessage(sessionId, text);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["copilot-messages", sessionId] });
      setInputQuery("");
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sendMutation.isPending]);

  const quickQuestions = [
    "Why is the highest-risk finding critical?",
    "Summarize this audit.",
    "Explain the risk breakdown.",
    "Trace this money-flow path.",
    "Show GST mismatches.",
  ];

  const handleSend = (textToSend?: string) => {
    const q = textToSend || inputQuery;
    if (!q.trim() || sendMutation.isPending || !sessionId) return;
    sendMutation.mutate(q);
  };

  if (!isCopilotOpen) return null;

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
              <h3 className="text-sm font-bold tracking-tight">Audit Copilot</h3>
              <p className="text-[11px] text-slate-400">Grounded Statutory Evidence Assistant</p>
            </div>
          </div>

          <button
            onClick={() => setIsCopilotOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs bg-slate-50/50">
          {isLoadingMessages && messages.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Initializing Copilot Session...</span>
            </div>
          ) : (
            messages.map((msg: CopilotMessage) => {
              const isAssistant = msg.role === "assistant";
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

                  <div className={`space-y-1.5 max-w-[82%] ${isAssistant ? "text-left" : "text-right"}`}>
                    <div
                      className={`p-3.5 rounded-xl shadow-xs leading-relaxed text-xs ${
                        isAssistant
                          ? "bg-white text-slate-900 border border-slate-200"
                          : "bg-brand-600 text-white text-left"
                      }`}
                    >
                      <div className="whitespace-pre-line">{msg.content}</div>

                      {/* Evidence Citations */}
                      {isAssistant && msg.citations && msg.citations.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                          {msg.citations.map((c, i) => (
                            <button
                              key={i}
                              onClick={() => setSelectedFindingId(c.id)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-mono text-[10px] font-semibold border border-indigo-200 transition-colors"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                              <span>{c.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Grounding Mode Status Badge */}
                    {isAssistant && (
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pl-1">
                        {msg.grounding_mode === "llm_grounded" ? (
                          <span className="flex items-center gap-1 text-emerald-600 font-medium">
                            <Sparkles className="w-3 h-3 text-emerald-500" />
                            AI Grounded
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-slate-500 font-medium">
                            <Cpu className="w-3 h-3 text-slate-400" />
                            Deterministic Fallback
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
                <span>Grounding audit evidence...</span>
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
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer border border-slate-200"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 border-t border-border bg-white flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask Copilot about this audit engagement..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={sendMutation.isPending || !sessionId}
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
          />

          <button
            type="submit"
            disabled={!inputQuery.trim() || sendMutation.isPending || !sessionId}
            className="p-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white rounded-lg transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
