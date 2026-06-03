import Link from "next/link";
import Image from "next/image";
import type { JournalEntryPreview } from "@/lib/dashboard-mock";

interface JournalCardProps {
  entries: JournalEntryPreview[];
}

function formatDate(iso: string) {
  const date = new Date(iso);
  return date.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

export function JournalCard({ entries }: JournalCardProps) {
  return (
    <article className="db-card db-card-full" aria-label="Mi bitacora">
      <div className="db-card-header">
        <span className="db-card-icon">✍</span>
        <h2 className="db-card-title">Mi Bitacora</h2>
      </div>

      <div className="db-journal-entry-list" role="list">
        {entries.slice(0, 5).map((entry) => (
          <article key={entry.id} className="db-journal-entry-card" role="listitem">
            <div className="db-journal-entry-content">
              <p className="db-journal-entry-date">{formatDate(entry.date)}</p>
              <p className="db-journal-entry-consultant">Consultante: {entry.consultant}</p>
              <p className="db-journal-entry-question">{entry.question}</p>
            </div>
            <div className="db-journal-entry-card-thumb" aria-label={entry.cardName}>
              <Image
                src={entry.cardImage}
                alt={entry.cardName}
                width={58}
                height={96}
                className="db-journal-card-img"
              />
              <span className="db-journal-card-name">{entry.cardName}</span>
            </div>
          </article>
        ))}
      </div>

      <Link href="/bitacora" className="db-card-btn" id="btn-ir-bitacora">
        Ir a mi bitacora
      </Link>
    </article>
  );
}
