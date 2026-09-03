"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Search, Filter, Database, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { getAuditRunTransactions, getAuditRun } from "@/lib/api";
import type { CanonicalTransaction } from "@/lib/types";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { TransactionDrawer } from "@/components/transactions/transaction-drawer";

const PAGE_SIZE = 50;

export default function AuditTransactionsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const runId = params?.runId as string;

  const initialSearch = searchParams?.get("search") || "";

  const [search, setSearch] = useState(initialSearch);
  const [activeSearch, setActiveSearch] = useState(initialSearch);
  const [page, setPage] = useState(0);
  const [selectedTxn, setSelectedTxn] = useState<CanonicalTransaction | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Query Run info for header context
  const { data: runData } = useQuery({
    queryKey: ["audit-run", runId],
    queryFn: () => getAuditRun(runId),
    enabled: !!runId,
  });

  // Query Paginated Transactions
  const {
    data: txnsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["audit-transactions", runId, activeSearch, page],
    queryFn: () =>
      getAuditRunTransactions(runId, {
        search: activeSearch || undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      }),
    enabled: !!runId,
  });

  const transactions = txnsData?.transactions || [];
  const totalReturned = txnsData?.total_returned || 0;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setActiveSearch(search);
  };

  const handleSelectTransaction = (txn: CanonicalTransaction) => {
    setSelectedTxn(txn);
    setIsDrawerOpen(true);
  };

  return (
    <div className="flex-1 pb-16">
      {/* Top Breadcrumb & Header */}
      <div className="border-b border-border/80 bg-card/40 py-6">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Link
                href={`/audit/${runId}`}
                className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium mb-2 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Audit Findings
              </Link>

              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  Ledger Transactions
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-secondary border border-border text-muted-foreground">
                  Audit: {runId.slice(0, 12)}...
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Canonicalized accounting entries belonging to this specific audit run.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => refetch()}
                className="p-2 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all"
                title="Refresh Transactions"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 mt-6">
        {/* Search & Filter Toolbar */}
        <div className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search narration, vendor, invoice #..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-secondary/50 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="h-9 px-4 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-xs font-semibold text-foreground transition-all"
            >
              Filter
            </button>
          </form>

          {/* Pagination Controls */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span>
              Page {page + 1} ({transactions.length} rows loaded)
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || isLoading}
                className="p-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground disabled:opacity-40 transition-all"
                title="Previous Page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={totalReturned < PAGE_SIZE || isLoading}
                className="p-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground disabled:opacity-40 transition-all"
                title="Next Page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <TransactionTable
          transactions={transactions}
          isLoading={isLoading}
          onSelectTransaction={handleSelectTransaction}
          selectedTransactionId={selectedTxn?.transaction_id || null}
        />
      </div>

      {/* Transaction Detail Slide-Over */}
      <TransactionDrawer
        transaction={selectedTxn}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        runId={runId}
      />
    </div>
  );
}
