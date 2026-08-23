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
  cardImage: string | null;
  orientationLabel: string;
  orientation: "UPRIGHT" | "REVERSED";
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
        data.feedback
          ? {
              ...data.feedback,
              cardImage: pendingQuestion.cardImage,
              orientation: pendingQuestion.orientation,
            }
          : {
              status: data.isCorrect ? "correct" : "incorrect",
              title: data.isCorrect ? "Correcto" : "Respuesta incorrecta",
              message: data.isCorrect
                ? "Bien hecho. Continúa con la siguiente carta."
                : "Esta carta aparecerá más seguido para reforzarla.",
              cardName: pendingQuestion.cardName,
              cardImage: pendingQuestion.cardImage,
              orientationLabel: pendingQuestion.orientationLabel,
              orientation: pendingQuestion.orientation,
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
    <main className={styles.activeWrapper}>
      <header className={styles.activeHeader}>
        <p className={styles.activeKicker}>Aprendizaje</p>
        <h1 className={styles.activeTitle}>Sesión activa</h1>
        <p className={styles.activeSubtitle}>Responde cada pregunta considerando orientación al derecho o invertida.</p>
        
        <div className={styles.activeContextBar}>
          <button type="button" className={`${styles.activeContextPill} ${styles.activeBackBtn}`} onClick={() => router.push("/aprendizaje")}>
            ← Volver al módulo
          </button>
          <span className={styles.activeContextPill}>
            <span className={styles.activeContextIcon} aria-hidden="true">◈</span> Modo: {modeLabel(payload.session.mode)}
          </span>
          <span className={styles.activeContextPill}>
            <span className={styles.activeContextIcon} aria-hidden="true">◈</span> Ámbito: {payload.session.selectedDeckScopeLabel}
          </span>
          <span className={styles.activeContextPill}>
            <span className={styles.activeContextIcon} aria-hidden="true">◈</span> Orientación: {payload.session.orientationScopeLabel}
          </span>
          <span className={styles.activeContextPill}>
            <span className={styles.activeContextIcon} aria-hidden="true">◈</span> Pregunta {pendingQuestion?.order ?? payload.session.questionCount} / {payload.session.questionCount}
          </span>
        </div>
      </header>

      {pendingQuestion ? (
        <section className={styles.activeMainGrid}>
          <article className={styles.activeCardBox}>
            {isImageToMeaningQuestion ? (
              <>
                <p className={styles.activeCardBoxTitle}>Carta actual</p>
                <h2 className={styles.activeCardBoxName}>{pendingQuestion.cardName}</h2>
                <div className={styles.activeCardOrientation}>
                  {pendingQuestion.orientationLabel}
                  <span className={`${styles.orientationDot} ${pendingQuestion.orientation === "UPRIGHT" ? styles.dotUpright : styles.dotReversed}`} />
                </div>
                
                <div className={styles.activeCardImageWrap}>
                  {pendingQuestion.cardImage ? (
                    <img 
                      src={pendingQuestion.cardImage} 
                      alt={pendingQuestion.cardName} 
                      style={pendingQuestion.orientation === "REVERSED" ? { transform: "rotate(180deg)" } : undefined} 
                    />
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <p className={styles.activeCardBoxTitle}>Significado actual</p>
                <h2 className={styles.activeCardBoxName}>Interpretación</h2>
                <p style={{ color: "#f7efe2", fontSize: "15px", margin: "12px 0 24px", lineHeight: 1.5 }}>{pendingQuestion.promptText}</p>
                <div className={styles.activeCardOrientation}>
                  {pendingQuestion.orientationLabel}
                  <span className={`${styles.orientationDot} ${pendingQuestion.orientation === "UPRIGHT" ? styles.dotUpright : styles.dotReversed}`} />
                </div>
              </>
            )}

            <hr className={styles.activeTipDivider} />
            <p className={styles.activeTipTitle}>✦ Consejo</p>
            <p className={styles.activeTipText}>Piensa en la energía de la carta por orientación antes de confirmar.</p>
          </article>

          <article className={styles.activeQuestionBox}>
            <h2 className={styles.activeQuestionTitle}>✦ {promptTitle}</h2>
            
            <div className={styles.activeOptionsWrap}>
              {pendingQuestion.options.map((option) => {
                const isSelected = selectedOption === option;
                return (
                  <button
                    key={option}
                    type="button"
                    className={`${styles.activeOptionRow} ${isSelected ? styles.activeOptionRowSelected : ""}`}
                    onClick={() => setSelectedOption(option)}
                    disabled={answering || Boolean(feedback)}
                  >
                    <div className={styles.activeRadioCircle}>
                      <div className={styles.activeRadioInner} />
                    </div>
                    <span className={styles.activeOptionText}>{option}</span>
                  </button>
                );
              })}
            </div>

            <div className={styles.activeConfirmWrap}>
              <button
                type="button"
                className={styles.activeBtnPrimary}
                onClick={handleConfirmAnswer}
                disabled={answering || !selectedOption || Boolean(feedback)}
              >
                {answering ? "Confirmando..." : "Confirmar respuesta →"}
              </button>
            </div>
          </article>
        </section>
      ) : (
        <section className={styles.activeEndBox}>
          <h2 className={styles.activeTitle}>Sesión finalizada</h2>
          <p className={styles.activeSubtitle} style={{ marginBottom: "24px" }}>Todas las preguntas fueron respondidas.</p>
          <div style={{ display: "flex", gap: "12px" }}>
            <button type="button" className={styles.activeBtnPrimary} onClick={() => router.push(`/aprendizaje/resultados/${sessionId}`)}>Ver resultados</button>
          </div>
        </section>
      )}

      <QuizFeedbackModal
        open={Boolean(feedback)}
        feedback={feedback}
        onContinue={handleContinueAfterFeedback}
        isFinishing={lastAnswerFinishedSession}
      />
    </main>
  );
}
