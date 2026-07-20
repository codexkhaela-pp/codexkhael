import { requireCurrentUser } from "@/lib/require-auth";
import { SpreadReader } from "@/app/tiradas/spread-reader";

export default async function TiradasPage() {
  await requireCurrentUser("/tiradas");

  return (
    <main className="app-shell dashboard-preview-bg">
      <SpreadReader />
    </main>
  );
}
