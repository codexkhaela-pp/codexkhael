import { BackButton } from "@/app/components/back-button";
import { InternalNav } from "@/app/components/internal-nav";
import { CardsBrowser } from "@/app/cartas/cards-browser";
import { tarotCards } from "@/src/data/tarotCards";

export default function CartasPage() {
  return (
    <main className="app-shell">
      <InternalNav />
      <section className="app-header">
        <div className="app-header-top">
          <BackButton />
          <p className="app-kicker">Biblioteca</p>
        </div>
        <h1>Cartas</h1>
        <p>Explora el mazo local y filtra por nombre, número, código o tipo de mazo.</p>
      </section>

      <CardsBrowser cards={tarotCards} />
    </main>
  );
}

