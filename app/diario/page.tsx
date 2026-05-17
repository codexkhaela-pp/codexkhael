import { BackButton } from "@/app/components/back-button";
import { InternalNav } from "@/app/components/internal-nav";
import { DiarioHub } from "@/app/diario/diario-hub";

export default function DiarioPage() {
  return (
    <main className="app-shell">
      <InternalNav />
      <section className="app-header">
        <div className="app-header-top">
          <BackButton />
          <p className="app-kicker">Diario / Bitacora</p>
        </div>
        <h1>Diario / Bitacora</h1>
        <p>
          Historial de lecturas y registro personal con mapa de tirada, interpretacion y relecturas futuras.
        </p>
      </section>

      <DiarioHub />
    </main>
  );
}
