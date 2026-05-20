"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { tarotCards } from "@/src/data/tarotCards";
import styles from "@/app/aprendizaje/aprendizaje.module.css";

const MODE_OPTIONS = [
  { value: "MIXED", label: "Mixto" },
  { value: "IMAGE_TO_MEANING", label: "Imagen a significado" },
  { value: "MEANING_TO_CARD", label: "Significado a carta" },
] as const;

const DECK_SCOPE_OPTIONS = [
  { value: "FULL_DECK", label: "Toda la baraja" },
  { value: "MAJOR_ARCANA", label: "Arcanos mayores" },
  { value: "MINOR_ARCANA", label: "Arcanos menores" },
  { value: "WANDS", label: "Bastos" },
  { value: "CUPS", label: "Copas" },
  { value: "SWORDS", label: "Espadas" },
  { value: "PENTACLES", label: "Oros" },
  { value: "COURT", label: "Corte" },
  { value: "CUSTOM", label: "Combinación personalizada" },
] as const;

const ORIENTATION_OPTIONS = [
  { value: "BOTH", label: "Ambas" },
  { value: "UPRIGHT_ONLY", label: "Solo cartas al derecho" },
  { value: "REVERSED_ONLY", label: "Solo cartas invertidas" },
] as const;

export function NewQuizForm() {
  const router = useRouter();
  const [mode, setMode] = useState<(typeof MODE_OPTIONS)[number]["value"]>("MIXED");
  const [questionCount, setQuestionCount] = useState(10);
  const [selectedDeckScope, setSelectedDeckScope] = useState<(typeof DECK_SCOPE_OPTIONS)[number]["value"]>("FULL_DECK");
  const [orientationScope, setOrientationScope] = useState<(typeof ORIENTATION_OPTIONS)[number]["value"]>("BOTH");
  const [selectedCustomCards, setSelectedCustomCards] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sortedCards = useMemo(
    () => [...tarotCards].sort((a, b) => a.nameEs.localeCompare(b.nameEs, "es")),
    [],
  );

  function toggleCustomCard(cardId: string) {
    setSelectedCustomCards((current) =>
      current.includes(cardId)
        ? current.filter((id) => id !== cardId)
        : [...current, cardId],
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedDeckScope === "CUSTOM" && selectedCustomCards.length === 0) {
      setError("Selecciona al menos una carta para la combinación personalizada.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/aprendizaje/sesiones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          mode,
          questionCount,
          selectedDeckScope,
          orientationScope,
          customCardIds: selectedDeckScope === "CUSTOM" ? selectedCustomCards : [],
        }),
      });

      const data = (await response.json()) as { sessionId?: string; error?: string };

      if (!response.ok || !data.sessionId) {
        throw new Error(data.error ?? "No se pudo crear la sesión.");
      }

      router.push(`/aprendizaje/sesion/${data.sessionId}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Error inesperado creando la sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className={styles.surface} onSubmit={handleSubmit}>
      <div className={styles.surfaceHeader}>
        <h2 className={styles.surfaceTitle}>Configurar nueva sesión</h2>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <label htmlFor="quiz-mode">Tipo de quiz</label>
          <select
            id="quiz-mode"
            className={styles.select}
            value={mode}
            onChange={(event) => setMode(event.target.value as (typeof MODE_OPTIONS)[number]["value"])}
          >
            {MODE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formField}>
          <label htmlFor="quiz-count">Número de preguntas</label>
          <input
            id="quiz-count"
            className={styles.input}
            type="number"
            min={5}
            max={30}
            value={questionCount}
            onChange={(event) => setQuestionCount(Number(event.target.value) || 10)}
          />
          <p className={styles.helpText}>Rango permitido: 5 a 30 preguntas.</p>
        </div>

        <div className={styles.formField}>
          <label htmlFor="quiz-scope">Filtro inicial de baraja</label>
          <select
            id="quiz-scope"
            className={styles.select}
            value={selectedDeckScope}
            onChange={(event) => setSelectedDeckScope(event.target.value as (typeof DECK_SCOPE_OPTIONS)[number]["value"])}
          >
            {DECK_SCOPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formField}>
          <label htmlFor="quiz-orientation">Orientación</label>
          <select
            id="quiz-orientation"
            className={styles.select}
            value={orientationScope}
            onChange={(event) => setOrientationScope(event.target.value as (typeof ORIENTATION_OPTIONS)[number]["value"])}
          >
            {ORIENTATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {selectedDeckScope === "CUSTOM" ? (
          <div className={styles.customCardsPanel}>
            {sortedCards.map((card) => (
              <label key={card.id} className={styles.cardCheckbox}>
                <input
                  type="checkbox"
                  checked={selectedCustomCards.includes(card.id)}
                  onChange={() => toggleCustomCard(card.id)}
                />
                <span>{card.nameEs}</span>
              </label>
            ))}
          </div>
        ) : null}
      </div>

      {error ? <p className={`${styles.feedback} ${styles.error}`}>{error}</p> : null}

      <div style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
        <button type="submit" className={styles.primaryButton} disabled={loading}>
          {loading ? "Creando sesión..." : "Iniciar quiz"}
        </button>
        <button type="button" className={styles.secondaryButton} onClick={() => router.push("/aprendizaje")}>Volver</button>
      </div>
    </form>
  );
}

