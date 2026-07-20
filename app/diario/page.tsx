import { requireCurrentUser } from "@/lib/require-auth";
import { DashboardPageHeader } from "@/app/components/dashboard-page-header";
import { DailyJournalPageClient } from "@/app/diario/daily-journal-page-client";
import { getTodayDailyJournalEntry } from "@/lib/daily-journal/service";
import { normalizeTimezone } from "@/lib/carta-del-dia/service";

type DiarioPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DiarioPage({ searchParams }: DiarioPageProps) {
  const user = await requireCurrentUser("/diario");
  const params = await searchParams;
  const timezoneParam = typeof params.timezone === "string" ? params.timezone : null;
  const timezone = normalizeTimezone(timezoneParam);
  const entry = await getTodayDailyJournalEntry(user.id, timezone);

  return (
    <main className="app-shell dashboard-preview-bg">
      <DashboardPageHeader
        kicker="Diario"
        title="Diario Energético"
        description="Registra cómo se manifestó tu Carta del Día y conserva una sola entrada personal por jornada."
      />

      <DailyJournalPageClient initialEntry={entry} timezone={timezone} />
    </main>
  );
}
