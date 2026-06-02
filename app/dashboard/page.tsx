import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/require-auth";

export default async function DashboardPage() {
  await requireCurrentUser("/dashboard");
  redirect("/dashboard-preview");
}
