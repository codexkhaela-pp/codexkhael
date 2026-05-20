"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/aprendizaje/aprendizaje.module.css";
import { QuizFeedbackModal } from "@/app/aprendizaje/components/quiz-feedback-modal";

type SessionQuestion = {
  id: string;
  order: number;
  cardId: string;
  cardName: string;
  cardImage: string | null;
  orientation: "UPRIGHT" | "REVERSED";
  orientationLabel: string;
  questionType: "IMAGE_TO_MEANING" | "MEANING_TO_CARD";
  promptText: string;
  options: string[];
  selectedAnswer: string | null;
  isCorrect: boolean | null;
  answeredAt: string | null;
};

type SessionPayload = {
  session: {
    id: string;
    mode: "IMAGE_TO_MEANING" | "MEANING_TO_CARD" | "MIXED";
    questionCount: number;
    selectedDeckScopeLabel: string;
    orientationScopeLabel: string;
    totalCorrect: number;
    totalIncorrect: number;
    finishedAt: string | null;
  };
  questions: SessionQuestion[];
};

type FeedbackPayload = {
  status: "correct" | "incorrect";
  title: string;
  message: string;
  cardName: string;
  orientationLabel: string;
  selectedAnswer: string;
  correctAnswer: string;
  meaning: string;
};

type AnswerPayload = {
  isCorrect: boolean;
  finished: boolean;
  answeredCount: number;
  totalCorrect: number;
  totalIncorrect: number;
  scorePercent: number;
  nextQuestion?: { id: string; order: number } | null;
  feedback?: FeedbackPayload;
};

function modeLabel(mode: SessionPayload["session"]["mode"]): string {
  if (mode === "IMAGE_TO_MEANING") return "Imagen a significado";
  if (mode === "MEANING_TO_CARD") return "Significado a carta";
  return "Mixto";
}

export function SessionPlayer({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [payload, setPayload] = useState<SessionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answering, setAnswering] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackPayload | null>(null);
  const [lastAnswerFinishedSession, setLastAnswerFinishedSession] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/aprendizaje/sesiones/${sessionId}`, {
        cache: "no-store",
        credentials: "same-origin",
      });

      const data = (await response.json()) as SessionPayload & { error?: string };
      if (!response.ok || !data.session) {
        throw new Error(data.error ?? "No se pudo cargar la sesión.");
      }

      setPayload(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Error cargando la sesión.");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const pendingQuestion = useMemo(
    () => payload?.questions.find((question) => question.isCorrect === null) ?? null,
    [payload],
  );

  useEffect(() => {
    setSelectedOption(null);
  }, [pendingQuestion?.id]);

  async function handleConfirmAnswer() {
    if (!pendingQuestion || answering || feedback || !selectedOption) return;

    setAnswering(true);
    setError(null);

    try {
      const response = await fetch(`/api/aprendizaje/sesiones/${sessionId}/responder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          questionId: pendingQuestion.id,
          selectedAnswer: selectedOption,
        }),
      });

      const data = (await response.json()) as AnswerPayload & { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo registrar la respuesta.");
      }

      const answeredAt = new Date().toISOString();
      setPayload((current) => {
        if (!current) return current;

        return {
          session: {
            ...current.session,
            totalCorrect: data.totalCorrect,
            totalIncorrect: data.totalIncorrect,
            finishedAt: data.finished ? answeredAt : current.session.finishedAt,
          },
          questions: current.questions.map((question) =>
            question.id === pendingQuestion.id
              ? {
                  ...question,
                  selectedAnswer: selectedOption,
                  isCorrect: data.isCorrect,
                  answeredAt,
                }
              : question,
          ),
        };
      });

      setFeedback(
        data.feedback ?? {
          status: data.isCorrect ? "correct" : "incorrect",
          title: data.isCorrect ? "Correcto" : "Respuesta incorrecta",
          message: data.isCorrect
            ? "Bien hecho. Continúa con la siguiente carta."
            : "Esta carta aparecerá más seguido para reforzarla.",
          cardName: pendingQuestion.cardName,
          orientationLabel: pendingQuestion.orientationLabel,
          selectedAnswer: selectedOption,
          correctAnswer: selectedOption,
          meaning: "",
        },
      );
      setLastAnswerFinishedSession(data.finished);
    } catch (answerError) {
      setError(answerError instanceof Error ? answerError.message : "Error respondiendo la pregunta.");
    } finally {
      setAnswering(false);
    }
  }

  function handleContinueAfterFeedback() {
    setFeedback(null);

    if (lastAnswerFinishedSession) {
      router.replace(`/aprendizaje/resultados/${sessionId}`);
    }
  }

  if (loading) {
    return <p className={styles.loading}>Cargando sesión...</p>;
  }

  if (error) {
    return <p className={`${styles.feedback} ${styles.error}`}>{error}</p>;
  }

  if (!payload) {
    return <p className={styles.emptyState}>No se encontró la sesión solicitada.</p>;
  }

  if (!pendingQuestion && !feedback) {
    return (
      <section className={styles.surface}>
        <h2 className={styles.surfaceTitle}>Sesión finalizada</h2>
        <p className={styles.emptyState}>Todas las preguntas fueron respondidas.</p>
        <div style={{ marginTop: "12px", display: "flex", gap: "10px" }}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => router.push(`/aprendizaje/resultados/${sessionId}`)}
          >
            Ver resultados
          </button>
          <button type="button" className={styles.secondaryButton} onClick={() => router.push("/aprendizaje")}>
            Volver al módulo
          </button>
        </div>
      </section>
    );
  }

  const isImageToMeaningQuestion = pendingQuestion?.questionType === "IMAGE_TO_MEANING";
  const promptTitle = isImageToMeaningQuestion
    ? "Selecciona el significado correcto"
    : "Selecciona la carta correcta";

  return (
    <>
      <button
        type="button"
        className={styles.backModuleButton}
        onClick={() => router.push("/aprendizaje")}
      >
        ← Volver al módulo
      </button>

      <section className={styles.sessionBadges}>
        <span className={styles.sessionChip}>
          <span className={styles.sessionChipIcon} aria-hidden="true">◈</span>
          <span>Modo: {modeLabel(payload.session.mode)}</span>
        </span>
        <span className={styles.sessionChip}>
          <span className={styles.sessionChipIcon} aria-hidden="true">◈</span>
          <span>Ámbito: {payload.session.selectedDeckScopeLabel}</span>
        </span>
        <span className={styles.sessionChip}>
          <span className={styles.sessionChipIcon} aria-hidden="true">◈</span>
          <span>Orientación: {payload.session.orientationScopeLabel}</span>
        </span>
        <span className={styles.sessionChip}>
          <span className={styles.sessionChipIcon} aria-hidden="true">◈</span>
          <span>
          Pregunta {pendingQuestion?.order ?? payload.session.questionCount} / {payload.session.questionCount}
          </span>
        </span>
      </section>

      {pendingQuestion ? (
        <section className={`${styles.surface} ${styles.activeSessionSurface}`}>
          <article className={styles.activeQuestionLayout}>
            <div className={styles.activeCardPanel}>
              {isImageToMeaningQuestion ? (
                <>
                  <p className={styles.activePanelKicker}>Carta actual</p>
                  <h3 className={styles.activeCardName}>{pendingQuestion.cardName}</h3>
                  <p className={styles.activeCardOrientation}>({pendingQuestion.orientationLabel})</p>

                  {pendingQuestion.cardImage ? (
                    <div className={styles.activeCardPreview}>
                      <img
                        src={pendingQuestion.cardImage}
                        alt={pendingQuestion.cardName}
                        style={pendingQuestion.orientation === "REVERSED" ? { transform: "rotate(180deg)" } : undefined}
                      />
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <p className={styles.activePanelKicker}>Significado actual</p>
                  <h3 className={styles.activeMeaningTitle}>Interpretación</h3>
                  <p className={styles.activeMeaningText}>{pendingQuestion.promptText}</p>
                  <p className={styles.activeCardOrientation}>({pendingQuestion.orientationLabel})</p>
                </>
              )}
            </div>

            <div className={styles.activeOptionsPanel}>
              <h3 className={styles.activeOptionsTitle}>{promptTitle}</h3>

              <div className={styles.optionsListVertical}>
                {pendingQuestion.options.map((option) => {
                  const isSelected = selectedOption === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      className={`${styles.optionRowButton} ${isSelected ? styles.optionRowSelected : ""}`}
                      onClick={() => setSelectedOption(option)}
                      disabled={answering || Boolean(feedback)}
                    >
                      <span className={styles.optionRadioDot} aria-hidden="true" />
                      <span>{option}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </article>

          <footer className={styles.activeQuestionFooter}>
            <div>
              <p className={styles.activeFooterTitle}>Consejo</p>
              <p className={styles.activeFooterText}>
                Piensa en la energía de la carta por orientación antes de confirmar.
              </p>
            </div>

            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleConfirmAnswer}
              disabled={answering || !selectedOption || Boolean(feedback)}
            >
              {answering ? "Confirmando..." : "Confirmar respuesta →"}
            </button>
          </footer>
        </section>
      ) : (
        <section className={styles.surface}>
          <p className={styles.emptyState}>No hay más preguntas pendientes.</p>
        </section>
      )}

      <QuizFeedbackModal
        open={Boolean(feedback)}
        feedback={feedback}
        onContinue={handleContinueAfterFeedback}
        isFinishing={lastAnswerFinishedSession}
      />
    </>
  );
}
