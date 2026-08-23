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
    <div className={styles.activePageWrapper}>
      <SessionPlayer sessionId={id} />
    </div>
  );
}

