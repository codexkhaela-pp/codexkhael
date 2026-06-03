import { requireCurrentUser } from "@/lib/require-auth";
import { DashboardPageHeader } from "@/app/components/dashboard-page-header";
import { DailyJournalPageClient } from "@/app/diario/daily-journal-page-client";
import { getTodayDailyJournalEntry } from "@/lib/daily-journal/service";

export default async function DiarioPage() {
  const user = await requireCurrentUser("/diario");
  const entry = await getTodayDailyJournalEntry(user.id);

  return (
    <main className="app-shell dashboard-preview-bg">
      <DashboardPageHeader
        kicker="Diario"
        title="Diario Energético"
        description="Registra cómo se manifestó tu Carta del Día y conserva una sola entrada personal por jornada."
      />

      <DailyJournalPageClient initialEntry={entry} />
    </main>
  );
}
