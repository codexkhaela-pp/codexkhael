import { DashboardShell } from "@/app/components/dashboard-shell";
import { DashboardPageHeader } from "@/app/components/dashboard-page-header";
import { DiarioHub } from "@/app/diario/diario-hub";

export default function DiarioPage() {
  return (
    <DashboardShell activeKey="bitacora">
      <main className="app-shell dashboard-preview-bg">
        <DashboardPageHeader
          kicker="Bitácora"
          title="Bitácora"
          description="Historial de lecturas y registro personal con mapa de tirada, interpretacion y relecturas futuras."
        />

        <DiarioHub />
      </main>
    </DashboardShell>
  );
}
