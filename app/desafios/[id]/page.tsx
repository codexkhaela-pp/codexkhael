import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { ChallengePlayPageClient } from "@/app/desafios/components/challenge-play-page-client";
import styles from "@/app/desafios/desafios.module.css";

type ChallengePlayPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ChallengePlayPage({ params }: ChallengePlayPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;

  return (
    <main className={`app-shell dashboard-preview-bg ${styles.pageMain}`}>
      <ChallengePlayPageClient challengeId={id} />
    </main>
  );
}
