import { readingsMock } from "@/lib/mock-data";

export default function TiradasPage() {
  return (
    <main className="app-shell">
      <section className="app-header">
        <p className="app-kicker">Registro</p>
        <h1>Tiradas</h1>
        <p>Listado inicial con tiradas mock locales.</p>
      </section>

      <section className="stack" aria-label="Historial de tiradas">
        {readingsMock.map((reading) => (
          <article key={`${reading.date}-${reading.spread}`} className="stack-card">
            <h2>{reading.spread}</h2>
            <p>{reading.summary}</p>
            <span>{reading.date}</span>
          </article>
        ))}
      </section>
    </main>
  );
}

