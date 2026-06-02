import { requireCurrentUser } from "@/lib/require-auth";
import { DiarioPageClient } from "@/app/diario/diario-page-client";

export default async function DiarioPage() {
  await requireCurrentUser("/diario");
  return <DiarioPageClient />;
}
