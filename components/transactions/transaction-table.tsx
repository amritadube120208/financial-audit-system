"use client";

import { Eye, ArrowUpDown } from "lucide-react";
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
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden my-4">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-secondary/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/60 font-mono">
            <tr>
              <th className="py-3 px-4">Row #</th>
              <th className="py-3 px-4">Posting Date</th>
              <th className="py-3 px-4">Transaction ID</th>
              <th className="py-3 px-4">Counterparty / Vendor</th>
              <th className="py-3 px-4">Amount (INR)</th>
              <th className="py-3 px-4">Invoice #</th>
              <th className="py-3 px-4">Narration</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 font-mono">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    <span>Querying ledger transactions...</span>
                  </div>
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-muted-foreground">
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
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-emerald-500/10 hover:bg-emerald-500/15"
                        : "hover:bg-secondary/30"
                    }`}
                  >
                    <td className="py-2.5 px-4 text-muted-foreground text-[11px]">
                      {t.source_row_number || "-"}
                    </td>
                    <td className="py-2.5 px-4 text-foreground whitespace-nowrap">
                      {t.posting_date}
                    </td>
                    <td className="py-2.5 px-4 text-muted-foreground truncate max-w-[140px]" title={t.transaction_id}>
                      {t.transaction_id}
                    </td>
                    <td className="py-2.5 px-4 text-foreground max-w-[160px] truncate" title={t.counterparty_name || t.counterparty_id}>
                      {t.counterparty_name || t.counterparty_id || "-"}
                    </td>
                    <td className={`py-2.5 px-4 font-bold whitespace-nowrap ${isNegative ? "text-rose-400" : "text-emerald-400"}`}>
                      {formatINR(t.amount)}
                    </td>
                    <td className="py-2.5 px-4 text-muted-foreground whitespace-nowrap">
                      {t.invoice_number || "-"}
                    </td>
                    <td className="py-2.5 px-4 text-muted-foreground max-w-xs truncate" title={t.narration || ""}>
                      {t.narration || "-"}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTransaction(t);
                        }}
                        className="inline-flex items-center gap-1 rounded bg-secondary hover:bg-secondary/80 text-foreground px-2.5 py-1 text-[11px] font-medium transition-all"
                      >
                        <Eye className="h-3 w-3" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
