"use client";

import { X, ShieldAlert } from "lucide-react";
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

  const handleScrollToFindings = () => {
    onClose();
    const el = document.getElementById("investigations");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-body">
      <div className="relative w-full max-w-lg bg-[#101317] border-l border-[rgba(237,231,220,0.13)] h-full overflow-y-auto flex flex-col p-6 shadow-2xl">
        {/* Drawer Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[rgba(237,231,220,0.1)]">
          <div>
            <div className="flex items-center gap-2 mb-1.5 font-mono">
              <span className="text-xs text-[#6C7378]">
                ROW #{transaction.source_row_number || "-"}
              </span>
              {transaction.is_manual_entry && (
                <span className="text-[10px] px-2 py-0.5 rounded-sm bg-[#E8913C]/10 text-[#E8913C] border border-[#E8913C]/40 font-semibold uppercase">
                  Manual Entry
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-[#EDE7DC] font-mono truncate max-w-sm">
              {transaction.transaction_id}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-sm border border-[rgba(237,231,220,0.13)] hover:border-[#E8913C] text-[#9EA5A8] hover:text-[#EDE7DC] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Amount Hero */}
        <div className="py-6 border border-[rgba(237,231,220,0.1)] text-center bg-[#0A0C0E] rounded-sm my-4">
          <span className="text-[10.5px] text-[#6C7378] uppercase tracking-[0.14em] block font-mono">
            TRANSACTION AMOUNT
          </span>
          <span className="text-3xl font-extrabold font-mono text-[#EDE7DC] mt-1 block">
            {formatINR(transaction.amount)}
          </span>
          <span className="text-xs text-[#6C7378] mt-1 block font-mono">
            Currency: {transaction.currency || "INR"}
          </span>
        </div>

        {/* Metadata Details Grid */}
        <div className="space-y-4 py-2 flex-1 text-xs">
          <div className="grid grid-cols-2 gap-4 p-4 rounded-sm border border-[rgba(237,231,220,0.1)] bg-[#0A0C0E] font-mono">
            <div>
              <span className="text-[#6C7378] block text-[10.5px] uppercase tracking-[0.1em]">Posting Date</span>
              <span className="font-medium text-[#EDE7DC] mt-0.5 block">
                {transaction.posting_date}
              </span>
            </div>
            <div>
              <span className="text-[#6C7378] block text-[10.5px] uppercase tracking-[0.1em]">Document Date</span>
              <span className="font-medium text-[#EDE7DC] mt-0.5 block">
                {transaction.document_date || "-"}
              </span>
            </div>
            <div>
              <span className="text-[#6C7378] block text-[10.5px] uppercase tracking-[0.1em]">Fiscal Year</span>
              <span className="font-medium text-[#EDE7DC] mt-0.5 block">
                FY {transaction.fiscal_year || "-"}
              </span>
            </div>
            <div>
              <span className="text-[#6C7378] block text-[10.5px] uppercase tracking-[0.1em]">Invoice Number</span>
              <span className="font-medium text-[#EDE7DC] mt-0.5 block">
                {transaction.invoice_number || "-"}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-sm border border-[rgba(237,231,220,0.1)] bg-[#0A0C0E] space-y-2">
            <div>
              <span className="text-[#6C7378] block text-[10.5px] font-mono uppercase tracking-[0.1em]">Counterparty Name</span>
              <span className="font-display font-semibold text-[#EDE7DC] mt-0.5 block">
                {transaction.counterparty_name || transaction.vendor_name || "N/A"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[rgba(237,231,220,0.08)] font-mono">
              <div>
                <span className="text-[#6C7378] block text-[10px] uppercase">Counterparty ID</span>
                <span className="text-[#2E6B72] mt-0.5 block truncate font-semibold">
                  {transaction.counterparty_id || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-[#6C7378] block text-[10px] uppercase">GSTIN</span>
                <span className="text-[#EDE7DC] mt-0.5 block truncate">
                  {transaction.gstin || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {transaction.narration && (
            <div className="p-4 rounded-sm border border-[rgba(237,231,220,0.1)] bg-[#0A0C0E]">
              <span className="text-[#6C7378] block text-[10.5px] font-mono uppercase tracking-[0.1em] mb-1">
                Narration / Description
              </span>
              <p className="font-mono text-xs text-[#EDE7DC] leading-relaxed bg-[#101317] p-2.5 rounded-sm border border-[rgba(237,231,220,0.08)]">
                {transaction.narration}
              </p>
            </div>
          )}
        </div>

        {/* Footer Navigation back to Audit findings on SAME page */}
        <div className="pt-4 border-t border-[rgba(237,231,220,0.1)] mt-auto">
          <button
            onClick={handleScrollToFindings}
            className="w-full inline-flex items-center justify-center gap-2 rounded-sm bg-[#E8913C] hover:bg-[#E8913C]/90 text-[#0A0C0E] font-mono uppercase tracking-[0.1em] font-semibold py-2.5 text-xs transition-colors shadow-sm"
          >
            <ShieldAlert className="h-4 w-4" />
            Inspect Associated Findings in Audit
          </button>
        </div>
      </div>
    </div>
  );
}
