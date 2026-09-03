import { redirect } from "next/navigation";

export default function DeprecatedAuditTransactions() {
  redirect("/audit#transactions");
}
