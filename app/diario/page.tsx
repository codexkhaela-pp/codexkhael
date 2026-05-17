import { journalMock } from "@/lib/mock-data";

export default function DiarioPage() {
  return (
    <main className="app-shell">
      <section className="app-header">
        <p className="app-kicker">Diario</p>
        <h1>Diario de aprendizaje</h1>
        <p>Entradas mock para conservar la estructura sin base de datos.</p>
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

