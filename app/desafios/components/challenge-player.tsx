"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/desafios/desafios.module.css";
import type { ChallengeDetail } from "@/app/desafios/components/types";
import { ChallengeQuestionCard } from "@/app/desafios/components/challenge-question-card";
import { ChallengeFeedback } from "@/app/desafios/components/challenge-feedback";
import { cleanQuestionText, cleanDescription } from "@/app/desafios/components/challenge-mappers";
import { ChallengeDetailPreView } from "@/app/desafios/components/challenge-detail-preview";

type ChallengePlayerProps = {
  challenge: ChallengeDetail;
};

type FeedbackState = {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
};

export function ChallengePlayer({ challenge }: ChallengePlayerProps) {
  const router = useRouter();
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentQuestionRaw = challenge.questions[currentIndex] ?? null;
  const currentQuestion = useMemo(() => {
    if (!currentQuestionRaw) return null;
    return {
      ...currentQuestionRaw,
      questionText: cleanQuestionText(currentQuestionRaw.questionText, challenge.isDaily),
    };
  }, [currentQuestionRaw, challenge.isDaily]);
  const finished = currentIndex >= challenge.questions.length;

  const progressLabel = useMemo(() => {
    const current = Math.min(challenge.questions.length, currentIndex + 1);
    return `${current} / ${challenge.questions.length}`;
  }, [challenge.questions.length, currentIndex]);

  async function startAttempt() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/desafios/${challenge.id}/intentos`, {
        method: "POST",
        credentials: "same-origin",
      });
      const data = (await response.json()) as { attemptId?: string; error?: string };
      if (!response.ok || !data.attemptId) {
        throw new Error(data.error ?? "No se pudo iniciar el intento.");
      }
      setAttemptId(data.attemptId);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Error iniciando desafío.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmAnswer() {
    if (!attemptId || !currentQuestion || !selectedOption || loading || feedback) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/desafios/intentos/${attemptId}/responder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          questionId: currentQuestion.id,
          selectedAnswer: selectedOption,
        }),
      });

      const data = (await response.json()) as {
        isCorrect?: boolean;
        correctAnswer?: string;
        explanation?: string;
        error?: string;
      };

      if (!response.ok || typeof data.isCorrect !== "boolean") {
        throw new Error(data.error ?? "No se pudo registrar la respuesta.");
      }

      setFeedback({
        isCorrect: data.isCorrect,
        correctAnswer: data.correctAnswer ?? "",
        explanation: data.explanation ?? "",
      });
    } catch (answerError) {
      setError(answerError instanceof Error ? answerError.message : "Error respondiendo pregunta.");
    } finally {
      setLoading(false);
    }
  }

  async function continueFlow() {
    if (!attemptId) return;
    setFeedback(null);
    setSelectedOption(null);

    const nextIndex = currentIndex + 1;
    if (nextIndex < challenge.questions.length) {
      setCurrentIndex(nextIndex);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/desafios/intentos/${attemptId}/finalizar`, {
        method: "POST",
        credentials: "same-origin",
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo finalizar el intento.");
      }
      router.replace(`/desafios/intentos/${attemptId}/resultado`);
    } catch (finalizeError) {
      setError(finalizeError instanceof Error ? finalizeError.message : "Error finalizando intento.");
    } finally {
      setLoading(false);
    }
  }

  if (!attemptId) {
    return (
      <ChallengeDetailPreView 
        challenge={challenge} 
        onStartAttempt={startAttempt} 
        loading={loading} 
      />
    );
  }

  if (finished || !currentQuestion) {
    return (
      <section className={styles.playerContainer}>
        <p className={styles.loading}>Finalizando intento...</p>
      </section>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <nav className={styles.challengePlayBreadcrumb}>
        <a href="/desafios">Desafíos</a> › <span>Desafío Diario</span> › <span>Resolución</span>
      </nav>

      <section className={styles.challengePlayContainer}>
        <header className={styles.challengePlayHeader}>
          <h1 className={styles.challengePlayTitle}>{challenge.title}</h1>
          <span className={styles.challengePlayCounter}>Pregunta {progressLabel}</span>
        </header>

        <ChallengeQuestionCard
          question={currentQuestion}
          selectedOption={selectedOption}
          onSelectOption={setSelectedOption}
          disabled={loading || Boolean(feedback)}
          feedbackArea={
            <ChallengeFeedback
              visible={Boolean(feedback)}
              isCorrect={feedback?.isCorrect ?? false}
              correctAnswer={feedback?.correctAnswer ?? ""}
              explanation={feedback?.explanation ?? ""}
            />
          }
          actionArea={
            !feedback ? (
              <button
                type="button"
                className={styles.challengePlayConfirmBtn}
                onClick={confirmAnswer}
                disabled={!selectedOption || loading}
              >
                {loading ? "Confirmando..." : "Confirmar respuesta →"}
              </button>
            ) : (
              <button type="button" className={styles.challengePlayConfirmBtn} onClick={continueFlow} disabled={loading}>
                {loading ? "Procesando..." : currentIndex + 1 < challenge.questions.length ? "Siguiente pregunta →" : "Finalizar desafío →"}
              </button>
            )
          }
        />
      </section>

      <div>
        <button
          type="button"
          className={styles.challengePlayBackLink}
          onClick={() => router.push(`/desafios/${challenge.id}`)}
        >
          ← Volver al desafío
        </button>
      </div>
    </div>
  );
}
