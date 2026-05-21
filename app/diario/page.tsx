"use client";

import { useState } from "react";
import { DashboardPageHeader } from "@/app/components/dashboard-page-header";
import { DiarioHub, type DiarioViewType } from "@/app/diario/diario-hub";

export default function DiarioPage() {
  const [viewType, setViewType] = useState<DiarioViewType>("list");
  const isNewEntryView = viewType === "new";

  return (
    <main className="app-shell dashboard-preview-bg">
      <DashboardPageHeader
        kicker="Bitácora"
        title={isNewEntryView ? "Registro de nueva entrada" : "Bitácora"}
        description={
          isNewEntryView
            ? undefined
            : "Desde aquí puedes registrar tus lecturas, revisar tu historial y hacer relecturas futuras."
        }
      />

      <DiarioHub onViewTypeChange={setViewType} />
    </main>
  );
}

