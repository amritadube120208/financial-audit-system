import { redirect } from "next/navigation";

export default async function DeprecatedTransactionsPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  redirect(`/audit/${runId}#transactions`);
}
