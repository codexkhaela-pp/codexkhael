import { BackButton } from "@/app/components/back-button";
import { InternalNav } from "@/app/components/internal-nav";
import { SpreadReader } from "@/app/tiradas/spread-reader";

export default function TiradasPage() {
  return (
    <main className="app-shell">
      <InternalNav />
      <section className="app-header">
        <div className="app-header-top">
          <BackButton />
          <p className="app-kicker">Tiradas</p>
        </div>
        <h1>Tiradas</h1>
        <p>Selecciona el tipo de tirada, baraja el mazo y revela las cartas por posición.</p>
      </section>

      <SpreadReader />
    </main>
  );
}

