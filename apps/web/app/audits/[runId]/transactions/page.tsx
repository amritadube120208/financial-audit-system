"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Database } from "lucide-react";
import { TransactionsTable } from "../../../../components/transactions/TransactionsTable";

export default function TransactionsPage() {
  const params = useParams();
  const runId = params?.runId as string;

  return (
    <div className="space-y-6 py-4">
      {/* Back button */}
      <div>
        <Link
          href={`/audits/${runId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Audit Dashboard</span>
        </Link>
      </div>

      <TransactionsTable runId={runId} />
    </div>
  );
}
