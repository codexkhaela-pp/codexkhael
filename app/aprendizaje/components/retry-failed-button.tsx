"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "@/app/aprendizaje/aprendizaje.module.css";

type RetryFailedButtonProps = {
  sessionId?: string;
  customPairs?: Array<{ cardId: string; orientation: "UPRIGHT" | "REVERSED" }>;
  label?: string;
  className?: string;
};

export function RetryFailedButton({
  sessionId,
  customPairs = [],
  label = "Reintentar cartas falladas",
  className,
}: RetryFailedButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRetry() {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/aprendizaje/sesiones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          mode: "MIXED",
          questionCount: Math.max(3, customPairs.length || 10),
          selectedDeckScope: "CUSTOM",
          orientationScope: "BOTH",
          retrySourceSessionId: sessionId,
          customPairs,
        }),
      });

      const data = (await response.json()) as { sessionId?: string; error?: string };
      if (!response.ok || !data.sessionId) {
        throw new Error(data.error ?? "No se pudo crear la sesión de reintento.");
      }

      router.push(`/aprendizaje/sesion/${data.sessionId}`);
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : "Error inesperado al reintentar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: "8px" }}>
      <button
        type="button"
        className={className ?? styles.primaryButton}
        onClick={handleRetry}
        disabled={loading}
      >
        {loading ? "Preparando reintento..." : label}
      </button>
      {error ? <p className={`${styles.feedback} ${styles.error}`}>{error}</p> : null}
    </div>
  );
}
