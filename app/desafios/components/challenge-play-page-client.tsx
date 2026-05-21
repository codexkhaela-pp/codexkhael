"use client";

import { useEffect, useState } from "react";
import { ChallengePlayer } from "@/app/desafios/components/challenge-player";
import type { ChallengeDetail } from "@/app/desafios/components/types";
import styles from "@/app/desafios/desafios.module.css";

type ChallengePlayPageClientProps = {
  challengeId: string;
};

export function ChallengePlayPageClient({ challengeId }: ChallengePlayPageClientProps) {
  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadChallenge() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/desafios/${challengeId}`, {
          cache: "no-store",
          credentials: "same-origin",
        });
        const data = (await response.json()) as { challenge?: ChallengeDetail; error?: string };
        if (!response.ok || !data.challenge) {
          throw new Error(data.error ?? "No se pudo cargar el desafío.");
        }
        if (!cancelled) setChallenge(data.challenge);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Error cargando desafío.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadChallenge();
    return () => {
      cancelled = true;
    };
  }, [challengeId]);

  if (loading) return <p className={styles.loading}>Cargando desafío...</p>;
  if (error) return <p className={styles.error}>{error}</p>;
  if (!challenge) return <p className={styles.emptyState}>Este desafío no existe.</p>;

  return <ChallengePlayer challenge={challenge} />;
}
