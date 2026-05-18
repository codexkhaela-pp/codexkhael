import Link from "next/link";
import { InternalNav } from "@/app/components/internal-nav";
import { dashboardCards } from "@/lib/mock-data";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const currentUser = await getCurrentUser();

  let metrics: {
    totalEntries: number;
    totalRereadings: number;
    fulfilledReadings: number;
    lastReading: string;
  } | null = null;

  if (currentUser) {
    const [totalEntries, totalRereadings, fulfilledReadings, lastEntry] = await Promise.all([
      prisma.bitacoraEntry.count({ where: { userId: currentUser.id } }),
      prisma.bitacoraReReading.count({ where: { userId: currentUser.id } }),
      prisma.bitacoraReReading.count({ where: { userId: currentUser.id, fulfilled: true } }),
      prisma.bitacoraEntry.findFirst({
        where: { userId: currentUser.id },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true, spreadType: true },
      }),
    ]);

    metrics = {
      totalEntries,
      totalRereadings,
      fulfilledReadings,
      lastReading: lastEntry
        ? `${lastEntry.spreadType} - ${lastEntry.createdAt.toLocaleString("es-PE", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}`
        : "Sin registros",
    };
  }

  return (
    <main className="app-shell">
      <InternalNav />
      <section className="app-header">
        <p className="app-kicker">CodexKhael</p>
        <h1>Panel</h1>
        <p>Vista inicial con accesos directos para estudio, tiradas y registro personal.</p>
      </section>

      {metrics ? (
        <section className="dashboard-grid" aria-label="Resumen de actividad">
          <article className="dashboard-card">
            <h2>Resumen</h2>
            <p>Total de entradas: {metrics.totalEntries}</p>
            <p>Total de relecturas: {metrics.totalRereadings}</p>
            <p>Lecturas cumplidas: {metrics.fulfilledReadings}</p>
            <p>Última lectura: {metrics.lastReading}</p>
          </article>
        </section>
      ) : null}

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
