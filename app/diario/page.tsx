import { BackButton } from "@/app/components/back-button";
import { InternalNav } from "@/app/components/internal-nav";
import { journalMock } from "@/lib/mock-data";

export default function DiarioPage() {
  return (
    <main className="app-shell">
      <InternalNav />
      <section className="app-header">
        <div className="app-header-top">
          <BackButton />
          <p className="app-kicker">Diario</p>
        </div>
        <h1>Diario de aprendizaje</h1>
        <p>Entradas simuladas para conservar la estructura sin base de datos.</p>
      </section>

      <section className="stack" aria-label="Entradas de diario">
        {journalMock.map((entry) => (
          <article key={`${entry.date}-${entry.title}`} className="stack-card">
            <h2>{entry.title}</h2>
            <p>{entry.note}</p>
            <span>{entry.date}</span>
          </article>
        ))}
      </section>
    </main>
  );
}

