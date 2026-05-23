import Link from "next/link";
import { InternalNav } from "@/app/components/internal-nav";

export const metadata = {
  title: "Mi Progreso | Codex Khael",
  description: "Resumen de modulos, lecciones y cartas.",
};

export default function ProgresoPage() {
  return (
    <main className="app-shell">
      <InternalNav />

      <header className="app-header">
        <p className="app-kicker">Panel de aprendizaje</p>
        <h1>Mi progreso</h1>
        <p>Vista inicial de seguimiento por modulos, lecciones y cartas.</p>
      </header>

      <section className="dashboard-grid" aria-label="Resumen de progreso">
        <article className="dashboard-card">
          <h2>Modulos</h2>
          <p>Resumen visual de avance por modulo.</p>
        </article>
        <article className="dashboard-card">
          <h2>Lecciones</h2>
          <p>Lecciones completadas y pendientes.</p>
        </article>
        <article className="dashboard-card">
          <h2>Cartas</h2>
          <p>Cartas estudiadas, por repasar y dominadas.</p>
        </article>
      </section>

      <div style={{ marginTop: "24px" }}>
        <Link href="/dashboard-preview" className="btn btn-secondary">
          Volver al panel
        </Link>
      </div>
    </main>
  );
}
