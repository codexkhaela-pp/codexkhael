import Link from "next/link";
import type { RecentReading } from "@/lib/dashboard-mock";

interface RecentReadingsCardProps {
  readings: RecentReading[];
}

function formatDate(iso: string) {
  const date = new Date(iso);
  return date.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

export function RecentReadingsCard({ readings }: RecentReadingsCardProps) {
  const visibleReadings = readings.slice(0, 10);

  return (
    <article className="db-card db-card-full" aria-label="Mis practicas recientes">
      <div className="db-card-header">
        <span className="db-card-icon">✦</span>
        <h2 className="db-card-title">Mis Practicas Recientes</h2>
      </div>

      <div className="db-readings-scroll">
        <ul className="db-readings-list" role="list">
          {visibleReadings.map((reading) => (
            <li key={reading.id} className="db-reading-item">
              <div className="db-reading-thumb" aria-hidden="true">
                <span className="db-reading-thumb-num">{reading.cardCount}</span>
              </div>
              <div className="db-reading-info">
                <span className="db-reading-name">{reading.name}</span>
                <span className="db-reading-cat">{reading.category}</span>
              </div>
              <span className="db-reading-date">{formatDate(reading.date)}</span>
              <span className="db-reading-arrow" aria-hidden="true">
                ›
              </span>
            </li>
          ))}
        </ul>
      </div>

      <Link href="/tiradas" className="db-card-btn" id="btn-ver-tiradas">
        Ver todas mis practicas
      </Link>
    </article>
  );
}
