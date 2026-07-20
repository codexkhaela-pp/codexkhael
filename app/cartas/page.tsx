import { requireCurrentUser } from "@/lib/require-auth";
import { CardsBrowser } from "@/app/cartas/cards-browser";
import { tarotCards } from "@/src/data/tarotCards";
import styles from "./cartas.module.css";

export default async function CartasPage() {
  const user = await requireCurrentUser("/cartas");

  return (
    <main className={`app-shell dashboard-preview-bg ${styles.pageMain}`}>
      <CardsBrowser cards={tarotCards} userId={user.id} />
    </main>
  );
}
