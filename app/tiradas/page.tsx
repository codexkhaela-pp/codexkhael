import { DashboardPageHeader } from "@/app/components/dashboard-page-header";
import { SpreadReader } from "@/app/tiradas/spread-reader";

export default function TiradasPage() {
  return (
    <main className="app-shell dashboard-preview-bg">
      <DashboardPageHeader
        kicker="Tiradas"
        title="Tiradas"
        description="Selecciona el tipo de tirada, baraja el mazo y revela las cartas por posición."
      />

      <SpreadReader />
    </main>
  );
}

