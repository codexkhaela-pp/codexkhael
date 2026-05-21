"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChallengeResultSummary } from "@/app/desafios/components/challenge-result-summary";
import { ChallengeAnswersReview } from "@/app/desafios/components/challenge-answers-review";
import type { ChallengeAttemptPayload, UserProgressData } from "@/app/desafios/components/types";
import styles from "@/app/desafios/desafios.module.css";

type ChallengeResultPageClientProps = {
  attemptId: string;
};

export function ChallengeResultPageClient({ attemptId }: ChallengeResultPageClientProps) {
  const [attempt, setAttempt] = useState<ChallengeAttemptPayload | null>(null);
  const [progress, setProgress] = useState<UserProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [attemptResponse, progressResponse] = await Promise.all([
          fetch(`/api/desafios/intentos/${attemptId}`, { cache: "no-store", credentials: "same-origin" }),
          fetch("/api/me/progreso", { cache: "no-store", credentials: "same-origin" }),
        ]);

        const attemptData = (await attemptResponse.json()) as { attempt?: ChallengeAttemptPayload; error?: string };
        const progressData = (await progressResponse.json()) as UserProgressData & { error?: string };

        if (!attemptResponse.ok || !attemptData.attempt) {
          throw new Error(attemptData.error ?? "No se pudo cargar el resultado.");
        }

        if (!progressResponse.ok) {
          throw new Error(progressData.error ?? "No se pudo cargar el progreso.");
        }

        if (!cancelled) {
          setAttempt(attemptData.attempt);
          setProgress(progressData);
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Error cargando resultado.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => {
      cancelled = true;
    };
  }, [attemptId]);

  if (loading) return <p className={styles.loading}>Cargando resultados...</p>;
  if (error) return <p className={styles.error}>{error}</p>;
  if (!attempt) return <p className={styles.emptyState}>No se encontró el intento solicitado.</p>;

  return (
    <section className={styles.resultContainer}>
      <header className={styles.resultHeader}>
        <h1 className={styles.heroTitle}>Resultado del desafío</h1>
        <p className={styles.heroDescription}>{attempt.challenge.title}</p>
      </header>

      <ChallengeResultSummary attempt={attempt} progress={progress} />
      <ChallengeAnswersReview attempt={attempt} />

      <div className={styles.resultActions}>
        <Link href="/desafios" className={styles.tertiaryAction}>
          Volver a desafíos
        </Link>
        <Link href={`/desafios/${attempt.challengeId}`} className={styles.primaryAction}>
          Resolver otro desafío
        </Link>
      </div>
    </section>
  );
}
