import { requireCurrentUser } from "@/lib/require-auth";
import { DashboardPageHeader } from "@/app/components/dashboard-page-header";
import { CardsBrowser } from "@/app/cartas/cards-browser";
import { tarotCards } from "@/src/data/tarotCards";
import styles from "./cartas.module.css";

export default async function CartasPage() {
  await requireCurrentUser("/cartas");

  return (
    <main className={`app-shell dashboard-preview-bg ${styles.pageMain}`}>
      <DashboardPageHeader
        kicker=""
        title="Cartas"
        description="Explora el mazo local y filtra por nombre, número, código o tipo de mazo."
      />
      <CardsBrowser cards={tarotCards} />
    </main>
  );
}
