"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Calendar,
  Layers,
  FileQuestion,
  Loader2,
} from "lucide-react";
import { getTransactions } from "../../lib/api/findings";
import { Transaction } from "../../lib/types/api";
import { formatINR, formatDate } from "../../lib/utils/formatters";
import { ErrorEnvelopeAlert } from "../system/ErrorEnvelopeAlert";

interface TransactionsTableProps {
  runId: string;
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({ runId }) => {
  const [search, setSearch] = useState("");
  const [vendor, setVendor] = useState("");
  const [suspiciousOnly, setSuspiciousOnly] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  const limit = 25;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["transactions", runId, search, vendor, suspiciousOnly, cursor],
    queryFn: () =>
      getTransactions(runId, {
        search: search || undefined,
        vendor: vendor || undefined,
        suspicious_only: suspiciousOnly,
        limit,
        cursor,
      }),
  });

  const handleNextPage = () => {
    if (data?.next_cursor) {
      setCursorHistory((prev) => [...prev, cursor || "0"]);
      setCursor(data.next_cursor);
    }
  };

  const handlePrevPage = () => {
    if (cursorHistory.length > 0) {
      const prevCursor = cursorHistory[cursorHistory.length - 1];
      setCursorHistory((prev) => prev.slice(0, -1));
      setCursor(prevCursor === "0" ? undefined : prevCursor);
    }
  };

  return (
    <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden space-y-4">
      {/* Header Controls */}
      <div className="p-5 border-b border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-600" />
              General Ledger Transactions Explorer
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              High-throughput cursor-paginated ledger voucher search
            </p>
          </div>

          <div className="text-xs font-mono text-slate-500">
            {data && <span>Total vouchers indexed: {data.total.toLocaleString()}</span>}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Keyword Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search voucher ID, party, or narration..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCursor(undefined);
                setCursorHistory([]);
              }}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
            />
          </div>

          {/* Suspicious Only Toggle */}
          <label className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-medium text-slate-700 transition-colors">
            <input
              type="checkbox"
              checked={suspiciousOnly}
              onChange={(e) => {
                setSuspiciousOnly(e.target.checked);
                setCursor(undefined);
                setCursorHistory([]);
              }}
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
              Flagged Suspicious Only
            </span>
          </label>
        </div>
      </div>

      {isError && (
        <div className="p-4">
          <ErrorEnvelopeAlert error={error} onRetry={() => refetch()} />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-2.5 px-3">Voucher ID</th>
              <th className="py-2.5 px-3">Posting Date</th>
              <th className="py-2.5 px-3">Party / Counterparty</th>
              <th className="py-2.5 px-3">Invoice No</th>
              <th className="py-2.5 px-3">Debit Ledger</th>
              <th className="py-2.5 px-3">Credit Ledger</th>
              <th className="py-2.5 px-3 text-right">Amount (INR)</th>
              <th className="py-2.5 px-3">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-2.5 px-3"><div className="h-4 w-16 bg-slate-200 rounded" /></td>
                  <td className="py-2.5 px-3"><div className="h-4 w-16 bg-slate-200 rounded" /></td>
                  <td className="py-2.5 px-3"><div className="h-4 w-28 bg-slate-200 rounded" /></td>
                  <td className="py-2.5 px-3"><div className="h-4 w-16 bg-slate-200 rounded" /></td>
                  <td className="py-2.5 px-3"><div className="h-4 w-20 bg-slate-200 rounded" /></td>
                  <td className="py-2.5 px-3"><div className="h-4 w-20 bg-slate-200 rounded" /></td>
                  <td className="py-2.5 px-3 text-right"><div className="h-4 w-16 bg-slate-200 rounded ml-auto" /></td>
                  <td className="py-2.5 px-3"><div className="h-4 w-14 bg-slate-200 rounded" /></td>
                </tr>
              ))
            ) : data?.items && data.items.length > 0 ? (
              data.items.map((txn: Transaction) => (
                <tr key={txn.transaction_id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">
                    {txn.transaction_id}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                    {formatDate(txn.posting_date)}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-900 max-w-xs truncate" title={txn.vendor_name}>
                    {txn.vendor_name}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                    {txn.invoice_number || "—"}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 text-[11px] max-w-[120px] truncate">
                    {txn.account_debit}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 text-[11px] max-w-[120px] truncate">
                    {txn.account_credit}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    {formatINR(txn.amount)}
                  </td>
                  <td className="py-2.5 px-3">
                    {txn.is_suspicious ? (
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded text-[10px]">
                        FLAGGED
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Normal</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  <FileQuestion className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  No transactions found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && (
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing {data.items.length} items (Page cursor: {cursor || "Start"})
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={cursorHistory.length === 0}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <button
              onClick={handleNextPage}
              disabled={!data.has_more}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
