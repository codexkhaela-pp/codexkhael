import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { DesafiosPageClient } from "@/app/desafios/components/desafios-page-client";
import styles from "@/app/desafios/desafios.module.css";

export const metadata = {
  title: "Desafíos | Codex Khael",
  description: "Pon a prueba tu interpretación, desarrolla tu intuición y gana recompensas.",
};

export default async function DesafiosRoutePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/desafios");
  }

  return (
    <main className={`app-shell dashboard-preview-bg ${styles.pageMain}`}>
      <DesafiosPageClient />
    </main>
  );
}
