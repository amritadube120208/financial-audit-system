import { redirect } from "next/navigation";

export default function DeprecatedTransactionsPage({ params }: { params: { runId: string } }) {
  redirect(`/audit/${params.runId}#transactions`);
}
