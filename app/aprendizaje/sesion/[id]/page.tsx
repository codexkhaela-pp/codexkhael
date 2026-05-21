import { DashboardPageHeader } from "@/app/components/dashboard-page-header";
import { SessionPlayer } from "@/app/aprendizaje/components/session-player";
import styles from "@/app/aprendizaje/aprendizaje.module.css";

export const metadata = {
  title: "Sesión de Quiz | Codex Khael",
  description: "Responde preguntas por carta y orientación.",
};

type SessionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AprendizajeSesionPage({ params }: SessionPageProps) {
  const { id } = await params;

  return (
    <main className={`app-shell dashboard-preview-bg ${styles.pageMain}`}>
      <DashboardPageHeader
        kicker="Aprendizaje"
        title="Sesión activa"
        description="Responde cada pregunta considerando orientación al derecho o invertida."
      />
      <SessionPlayer sessionId={id} />
    </main>
  );
}

