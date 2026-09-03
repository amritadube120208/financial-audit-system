"use client";

import { Eye, ArrowUpRight } from "lucide-react";
import type { CanonicalTransaction } from "@/lib/types";
import { formatINR } from "@/lib/utils";

interface TransactionTableProps {
  transactions: CanonicalTransaction[];
  isLoading: boolean;
  onSelectTransaction: (txn: CanonicalTransaction) => void;
  selectedTransactionId: string | null;
}

export function TransactionTable({
  transactions,
  isLoading,
  onSelectTransaction,
  selectedTransactionId,
}: TransactionTableProps) {
  return (
    <div className="border border-[rgba(237,231,220,0.13)] bg-[#101317] rounded-sm overflow-hidden my-4">
      {/* Desktop Multi-column Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0A0C0E] text-[#6C7378] uppercase text-[10px] tracking-[0.14em] border-b border-[rgba(237,231,220,0.1)] font-mono">
            <tr>
              <th className="py-3 px-4 font-normal">Row #</th>
              <th className="py-3 px-4 font-normal">Posting Date</th>
              <th className="py-3 px-4 font-normal">Transaction ID</th>
              <th className="py-3 px-4 font-normal">Counterparty / Vendor</th>
              <th className="py-3 px-4 font-normal">Amount (INR)</th>
              <th className="py-3 px-4 font-normal">Invoice #</th>
              <th className="py-3 px-4 font-normal">Narration</th>
              <th className="py-3 px-4 font-normal text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(237,231,220,0.08)] font-mono">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-[#9EA5A8]">
                  <div className="flex items-center justify-center gap-2 text-xs">
                    <span className="h-3.5 w-3.5 border-2 border-[#E8913C] border-t-transparent rounded-full animate-spin" />
                    <span>Querying ledger transactions...</span>
                  </div>
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-[#6C7378] font-body text-xs">
                  No ledger transactions found matching the query.
                </td>
              </tr>
            ) : (
              transactions.map((t) => {
                const isSelected = selectedTransactionId === t.transaction_id;
                const isNegative = parseFloat(t.amount) < 0;

                return (
                  <tr
                    key={t.transaction_id}
                    onClick={() => onSelectTransaction(t)}
                    className={`cursor-pointer transition-colors duration-150 ${
                      isSelected
                        ? "bg-[#0A0C0E] border-l-2 border-l-[#E8913C]"
                        : "hover:bg-[#0A0C0E]/60"
                    }`}
                  >
                    <td className="py-3 px-4 text-[#6C7378] text-[11px]">
                      {t.source_row_number || "-"}
                    </td>
                    <td className="py-3 px-4 text-[#EDE7DC] whitespace-nowrap">
                      {t.posting_date}
                    </td>
                    <td className="py-3 px-4 text-[#9EA5A8] truncate max-w-[140px]" title={t.transaction_id}>
                      {t.transaction_id}
                    </td>
                    <td className="py-3 px-4 text-[#EDE7DC] max-w-[160px] truncate font-body font-medium" title={t.counterparty_name || t.counterparty_id}>
                      {t.counterparty_name || t.counterparty_id || "-"}
                    </td>
                    <td className={`py-3 px-4 font-bold whitespace-nowrap ${isNegative ? "text-[#E8913C]" : "text-[#EDE7DC]"}`}>
                      {formatINR(t.amount)}
                    </td>
                    <td className="py-3 px-4 text-[#9EA5A8] whitespace-nowrap">
                      {t.invoice_number || "-"}
                    </td>
                    <td className="py-3 px-4 text-[#6C7378] max-w-xs truncate" title={t.narration || ""}>
                      {t.narration || "-"}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap font-body">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTransaction(t);
                        }}
                        className="inline-flex items-center gap-1 border border-[rgba(237,231,220,0.2)] bg-[#0A0C0E] hover:border-[#E8913C] text-[#EDE7DC] hover:text-[#E8913C] px-2.5 py-1 text-xs font-mono uppercase tracking-[0.1em] transition-colors rounded-sm"
                      >
                        <Eye className="h-3 w-3" />
                        INSPECT
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Collapsed Cards Layout */}
      <div className="md:hidden divide-y divide-[rgba(237,231,220,0.1)] font-mono text-xs">
        {transactions.map((t) => {
          const isNegative = parseFloat(t.amount) < 0;
          return (
            <div
              key={t.transaction_id}
              onClick={() => onSelectTransaction(t)}
              className="p-4 space-y-1.5 hover:bg-[#0A0C0E]/50 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[#6C7378] text-[10.5px]">
                  ROW {t.source_row_number || "—"} {"//"} {t.posting_date}
                </span>
                <span className={`font-bold ${isNegative ? "text-[#E8913C]" : "text-[#EDE7DC]"}`}>
                  {formatINR(t.amount)}
                </span>
              </div>
              <div className="font-body text-[#EDE7DC] truncate font-medium">
                {t.counterparty_name || t.counterparty_id || "Unspecified Counterparty"}
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#9EA5A8] pt-1">
                <span className="truncate max-w-[180px]">{t.transaction_id}</span>
                <span className="text-[#E8913C] flex items-center gap-0.5 font-body">
                  VIEW <ArrowUpRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
