import { Suspense } from "react";
import { requireCurrentUser } from "@/lib/require-auth";
import { PlanesPageClient } from "@/app/planes/planes-page-client";

export default async function PlanesPage() {
  await requireCurrentUser("/planes");

  return (
    <Suspense fallback={<div style={{ color: "#fff", padding: "40px", textAlign: "center" }}>Cargando planes...</div>}>
      <PlanesPageClient />
    </Suspense>
  );
}
