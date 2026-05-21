import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { ChallengeResultPageClient } from "@/app/desafios/components/challenge-result-page-client";
import styles from "@/app/desafios/desafios.module.css";

type ChallengeResultPageProps = {
  params: Promise<{ attemptId: string }>;
};

export default async function ChallengeResultPage({ params }: ChallengeResultPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { attemptId } = await params;

  return (
    <main className={`app-shell dashboard-preview-bg ${styles.pageMain}`}>
      <ChallengeResultPageClient attemptId={attemptId} />
    </main>
  );
}
