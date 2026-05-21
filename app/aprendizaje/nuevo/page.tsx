import { DashboardPageHeader } from "@/app/components/dashboard-page-header";
import { NewQuizForm } from "@/app/aprendizaje/components/new-quiz-form";
import styles from "@/app/aprendizaje/aprendizaje.module.css";

export const metadata = {
  title: "Nuevo Quiz | Codex Khael",
  description: "Configura una nueva sesión de aprendizaje por orientación.",
};

export default function NuevoAprendizajePage() {
  return (
    <main className={`app-shell dashboard-preview-bg ${styles.pageMain}`}>
      <DashboardPageHeader
        kicker="Aprendizaje"
        title="Nuevo quiz"
        description="Selecciona tipo de quiz, alcance de cartas y orientación. Las cartas al derecho e invertidas se califican por separado."
      />
      <NewQuizForm />
    </main>
  );
}

