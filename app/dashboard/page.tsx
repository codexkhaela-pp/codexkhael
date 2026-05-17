import Link from "next/link";
import { InternalNav } from "@/app/components/internal-nav";
import { dashboardCards } from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <main className="app-shell">
      <InternalNav />
      <section className="app-header">
        <p className="app-kicker">CodexKhael</p>
        <h1>Panel</h1>
        <p>Vista inicial con accesos directos para estudio, tiradas y registro personal.</p>
      </section>

      <section className="dashboard-grid" aria-label="Módulos principales">
        {dashboardCards.map((card) => {
          if (card.href) {
            return (
              <Link key={card.title} href={card.href} className="dashboard-card">
                <h2>{card.title}</h2>
                <p>{card.description}</p>
              </Link>
            );
          }

          return (
            <article key={card.title} className="dashboard-card dashboard-card-muted">
              <h2>{card.title}</h2>
              <p>{card.description}</p>
              <span className="pill">Próximamente</span>
            </article>
          );
        })}
      </section>
    </main>
  );
}

