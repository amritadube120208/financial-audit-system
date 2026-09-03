"use client";

import Link from "next/link";
import { X, ExternalLink, FileText, ArrowLeft, ArrowRight, ShieldAlert, Tag, Hash, Building } from "lucide-react";
import type { CanonicalTransaction } from "@/lib/types";
import { formatINR } from "@/lib/utils";

interface TransactionDrawerProps {
  transaction: CanonicalTransaction | null;
  isOpen: boolean;
  onClose: () => void;
  runId: string;
}

export function TransactionDrawer({
  transaction,
  isOpen,
  onClose,
  runId,
}: TransactionDrawerProps) {
  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-card border-l border-border h-full overflow-y-auto flex flex-col p-6 shadow-2xl">
        {/* Drawer Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-border/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-muted-foreground">
                Row #{transaction.source_row_number || "-"}
              </span>
              {transaction.is_manual_entry && (
                <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Manual Entry
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-foreground font-mono truncate max-w-sm">
              {transaction.transaction_id}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Amount Hero */}
        <div className="py-6 border-b border-border/60 text-center bg-secondary/20 rounded-xl my-4">
          <span className="text-xs text-muted-foreground uppercase tracking-wider block">
            Transaction Amount
          </span>
          <span className="text-3xl font-extrabold font-mono text-emerald-400 mt-1 block">
            {formatINR(transaction.amount)}
          </span>
          <span className="text-xs text-muted-foreground mt-1 block font-mono">
            Currency: {transaction.currency || "INR"}
          </span>
        </div>

        {/* Metadata Details Grid */}
        <div className="space-y-4 py-2 flex-1 text-xs">
          <div className="grid grid-cols-2 gap-4 p-3.5 rounded-lg border border-border/60 bg-secondary/30">
            <div>
              <span className="text-muted-foreground block text-[11px]">Posting Date</span>
              <span className="font-mono font-medium text-foreground mt-0.5 block">
                {transaction.posting_date}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Document Date</span>
              <span className="font-mono font-medium text-foreground mt-0.5 block">
                {transaction.document_date || "-"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Fiscal Year</span>
              <span className="font-mono font-medium text-foreground mt-0.5 block">
                FY {transaction.fiscal_year || "-"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Invoice Number</span>
              <span className="font-mono font-medium text-foreground mt-0.5 block">
                {transaction.invoice_number || "-"}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg border border-border/60 bg-secondary/30 space-y-2">
            <div>
              <span className="text-muted-foreground block text-[11px]">Counterparty Name</span>
              <span className="font-medium text-foreground mt-0.5 block">
                {transaction.counterparty_name || transaction.vendor_name || "N/A"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 font-mono">
              <div>
                <span className="text-muted-foreground block text-[10px]">Counterparty ID</span>
                <span className="text-emerald-400 mt-0.5 block truncate">
                  {transaction.counterparty_id || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">GSTIN</span>
                <span className="text-foreground mt-0.5 block truncate">
                  {transaction.gstin || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {transaction.narration && (
            <div className="p-3.5 rounded-lg border border-border/60 bg-secondary/30">
              <span className="text-muted-foreground block text-[11px] mb-1">Narration / Description</span>
              <p className="font-mono text-foreground/90 leading-relaxed bg-background/50 p-2.5 rounded border border-border/40">
                {transaction.narration}
              </p>
            </div>
          )}
        </div>

        {/* Footer Navigation back to Audit findings */}
        <div className="pt-4 border-t border-border mt-auto">
          <Link
            href={`/audit/${runId}`}
            onClick={onClose}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold py-2.5 text-xs transition-all shadow-sm"
          >
            <ShieldAlert className="h-4 w-4" />
            Inspect Associated Findings in Audit
          </Link>
        </div>
      </div>
    </div>
  );
}
