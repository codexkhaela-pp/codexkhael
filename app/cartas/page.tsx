import { tarotLibraryMock } from "@/lib/mock-data";

export default function CartasPage() {
  return (
    <main className="app-shell">
      <section className="app-header">
        <p className="app-kicker">Biblioteca</p>
        <h1>Cartas</h1>
        <p>Datos mock para estructura inicial de estudio de cartas.</p>
      </section>

      <section className="list-grid" aria-label="Listado de cartas">
        {tarotLibraryMock.map((card) => (
          <article key={card.name} className="list-card">
            <h2>{card.name}</h2>
            <p>{card.arcana}</p>
            <span>{card.keyword}</span>
          </article>
        ))}
      </section>
    </main>
  );
}

