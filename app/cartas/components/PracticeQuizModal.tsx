"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CardPracticeProgress, PracticeQuestion, PracticeQuestionResult } from "@/lib/cartas-study";
import {
  buildPracticeQuiz,
  evaluateQuizResults,
  getStatusIcon,
  getStatusLabel,
} from "@/lib/cartas-study";
import type { TarotCard } from "@/src/data/tarotCards";
import styles from "../cartas.module.css";

type PracticeQuizModalProps = {
  isOpen: boolean;
  card: TarotCard | null;
  progressByCard: Record<string, CardPracticeProgress>;
  onClose: () => void;
  onComplete: (cardId: string, results: PracticeQuestionResult[]) => void;
};

type QuizState =
  | {
      status: "loading";
    }
  | {
      status: "error";
      message: string;
    }
  | {
      status: "ready";
      payload: Awaited<ReturnType<typeof buildPracticeQuiz>>;
    };

function getOrientationLabel(value?: "derecho" | "invertido") {
  if (value === "invertido") return "Invertida";
  if (value === "derecho") return "Al derecho";
  return null;
}

function getScopeLabel(value?: string) {
  if (!value) return null;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function PracticeQuizModal({
  isOpen,
  card,
  progressByCard,
  onClose,
  onComplete,
}: PracticeQuizModalProps) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [quizState, setQuizState] = useState<QuizState>({ status: "loading" });
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [revealedQuestions, setRevealedQuestions] = useState<Record<string, true>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [completionSent, setCompletionSent] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !card) return;

    let active = true;
    setQuizState({ status: "loading" });
    setSelectedAnswers({});
    setRevealedQuestions({});
    setCurrentIndex(0);
    setShowResults(false);
    setCompletionSent(false);

    buildPracticeQuiz({
      cardId: card.id,
      progressByCard,
    })
      .then((payload) => {
        if (!active) return;
        setQuizState({ status: "ready", payload });
      })
      .catch((error) => {
        if (!active) return;
        setQuizState({
          status: "error",
          message: error instanceof Error ? error.message : "No se pudo preparar la práctica.",
        });
      });

    return () => {
      active = false;
    };
  }, [card, isOpen]);

  useEffect(() => {
    if (!isOpen || !mounted) return;

    const modal = shellRef.current;
    if (!modal) return;

    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const focusableElements = Array.from(modal.querySelectorAll<HTMLElement>(focusableSelector));
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    firstElement?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || focusableElements.length === 0) return;

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, mounted, onClose, quizState]);

  const questions = quizState.status === "ready" ? quizState.payload.questions : [];
  const currentQuestion = questions[currentIndex] ?? null;

  const results = useMemo(() => {
    if (quizState.status !== "ready") return [];
    return evaluateQuizResults(quizState.payload.questions, selectedAnswers);
  }, [quizState, selectedAnswers]);

  const resultSummary = useMemo(() => {
    const totalQuestions = results.length;
    const correctAnswers = results.filter((result) => result.isCorrect).length;
    const scorePercent = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const studyStatus: "pending" | "studied" | "review" | "learned" =
      scorePercent >= 80 ? "learned" : scorePercent >= 50 ? "review" : scorePercent > 0 ? "studied" : "pending";

    return {
      correctAnswers,
      totalQuestions,
      scorePercent,
      studyStatus,
      failedQuestions: results.filter((result) => !result.isCorrect),
    };
  }, [results]);

  useEffect(() => {
    if (!showResults || completionSent || !card || resultSummary.totalQuestions === 0) return;

    onComplete(card.id, results);
    setCompletionSent(true);
  }, [card, completionSent, onComplete, resultSummary.totalQuestions, results, showResults]);

  if (!mounted || !isOpen || !card) return null;

  const handleAnswerSelect = (questionId: string, option: string) => {
    if (revealedQuestions[questionId]) return;

    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const handlePrimaryAction = () => {
    if (!currentQuestion) return;

    if (!revealedQuestions[currentQuestion.id]) {
      if (!selectedAnswers[currentQuestion.id]) return;
      setRevealedQuestions((prev) => ({
        ...prev,
        [currentQuestion.id]: true,
      }));
      return;
    }

    if (currentIndex === questions.length - 1) {
      setShowResults(true);
      return;
    }

    setCurrentIndex((prev) => prev + 1);
  };

  const handleRestart = () => {
    if (!card) return;

    setQuizState({ status: "loading" });
    setSelectedAnswers({});
    setRevealedQuestions({});
    setCurrentIndex(0);
    setShowResults(false);
    setCompletionSent(false);

    buildPracticeQuiz({
      cardId: card.id,
      progressByCard,
    })
      .then((payload) => {
        setQuizState({ status: "ready", payload });
      })
      .catch((error) => {
        setQuizState({
          status: "error",
          message: error instanceof Error ? error.message : "No se pudo preparar la práctica.",
        });
      });
  };

  const renderQuestionBody = (question: PracticeQuestion) => {
    const selectedAnswer = selectedAnswers[question.id] ?? "";
    const isRevealed = Boolean(revealedQuestions[question.id]);
    const pairedCard =
      quizState.status === "ready" && question.pairedCardId
        ? quizState.payload.pairedCard?.id === question.pairedCardId
          ? quizState.payload.pairedCard
          : null
        : null;

    return (
      <>
        <header className={styles.practiceHeader}>
          <div>
            <p className={styles.practiceEyebrow}>Práctica de Aprendizaje</p>
            <h2 id="practice-modal-title" className={styles.practiceTitle}>
              {quizState.status === "ready" ? quizState.payload.card.name : card.nameEs}
            </h2>
          </div>
          <button
            type="button"
            className={styles.practiceCloseButton}
            onClick={onClose}
            aria-label="Cerrar práctica"
          >
            ×
          </button>
        </header>

        <div className={styles.practiceProgressRow}>
          <p className={styles.practiceProgressLabel}>
            Pregunta {currentIndex + 1} / {questions.length}
          </p>
          <div className={styles.practiceProgressTrack} aria-hidden="true">
            <div
              className={styles.practiceProgressFill}
              style={{ width: `${Math.round(((currentIndex + 1) / Math.max(questions.length, 1)) * 100)}%` }}
            />
          </div>
        </div>

        <div className={styles.practiceContentGrid}>
          <div className={styles.practiceVisualColumn}>
            <div className={styles.practiceImageStack}>
              <figure className={styles.practiceImageCard}>
                <div className={styles.practiceImageFrame}>
                  <Image
                    src={card.image}
                    alt={card.nameEs}
                    width={260}
                    height={450}
                    className={styles.practiceImage}
                  />
                </div>
                <figcaption>{card.nameEs}</figcaption>
              </figure>

              {pairedCard ? (
                <figure className={styles.practiceImageCardSecondary}>
                  <div className={styles.practiceImageFrame}>
                    <Image
                      src={pairedCard.image}
                      alt={pairedCard.name}
                      width={220}
                      height={380}
                      className={styles.practiceImage}
                    />
                  </div>
                  <figcaption>{pairedCard.name}</figcaption>
                </figure>
              ) : null}
            </div>

            <div className={styles.practiceQuestionMeta}>
              {question.scope ? <span>{getScopeLabel(question.scope)}</span> : null}
              {question.orientation ? <span>{getOrientationLabel(question.orientation)}</span> : null}
              {question.pairedCardName ? <span>Con {question.pairedCardName}</span> : null}
            </div>
          </div>

          <div className={styles.practiceQuestionColumn}>
            <div className={styles.practicePromptBlock}>
              <h3 className={styles.practicePrompt}>{question.prompt}</h3>
            </div>

            <div className={styles.practiceOptionsColumn} role="list" aria-label="Opciones de respuesta">
              {question.options.map((option) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = isRevealed && option === question.correctAnswer;
                const isIncorrect = isRevealed && isSelected && option !== question.correctAnswer;

                return (
                  <button
                    key={option}
                    type="button"
                    role="listitem"
                    className={[
                      styles.practiceOptionButton,
                      isSelected ? styles.practiceOptionSelected : "",
                      isCorrect ? styles.practiceOptionCorrect : "",
                      isIncorrect ? styles.practiceOptionIncorrect : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => handleAnswerSelect(question.id, option)}
                    aria-pressed={isSelected}
                    disabled={isRevealed}
                  >
                    <span className={styles.practiceOptionMarker} aria-hidden="true">
                      {isCorrect ? "✓" : isIncorrect ? "×" : isSelected ? "•" : "○"}
                    </span>
                    <span>{option}</span>
                  </button>
                );
              })}
            </div>

            {isRevealed ? (
              <div
                className={[
                  styles.practiceFeedback,
                  selectedAnswer === question.correctAnswer ? styles.practiceFeedbackCorrect : styles.practiceFeedbackIncorrect,
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-live="polite"
              >
                <strong>{selectedAnswer === question.correctAnswer ? "Respuesta correcta" : "Respuesta incorrecta"}</strong>
                <p>Correcta: {question.correctAnswer}</p>
              </div>
            ) : null}

            <div className={styles.practiceActions}>
              <button
                type="button"
                className={styles.practicePrimaryButton}
                onClick={handlePrimaryAction}
                disabled={!revealedQuestions[question.id] && !selectedAnswers[question.id]}
              >
                {!revealedQuestions[question.id]
                  ? "Confirmar respuesta"
                  : currentIndex === questions.length - 1
                    ? "Ver resultado"
                    : "Siguiente"}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

  const modalContent = (
    <div className={styles.practiceOverlay} onClick={onClose}>
      <div
        ref={shellRef}
        className={styles.practiceModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="practice-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        {quizState.status === "loading" ? (
          <div className={styles.practiceLoadingState}>
            <p className={styles.practiceEyebrow}>Práctica de Aprendizaje</p>
            <h2 id="practice-modal-title" className={styles.practiceTitle}>
              Preparando micro quiz
            </h2>
            <p>Cargando preguntas reales de la carta seleccionada...</p>
          </div>
        ) : quizState.status === "error" ? (
          <div className={styles.practiceLoadingState}>
            <p className={styles.practiceEyebrow}>Práctica de Aprendizaje</p>
            <h2 id="practice-modal-title" className={styles.practiceTitle}>
              No fue posible abrir la práctica
            </h2>
            <p>{quizState.message}</p>
            <div className={styles.practiceActions}>
              <button type="button" className={styles.practiceSecondaryButton} onClick={onClose}>
                Cerrar
              </button>
            </div>
          </div>
        ) : showResults ? (
          <>
            <header className={styles.practiceHeader}>
              <div>
                <p className={styles.practiceEyebrow}>Resultado de práctica</p>
                <h2 id="practice-modal-title" className={styles.practiceTitle}>
                  {quizState.payload.card.name}
                </h2>
              </div>
              <button
                type="button"
                className={styles.practiceCloseButton}
                onClick={onClose}
                aria-label="Cerrar práctica"
              >
                ×
              </button>
            </header>

            <div className={styles.practiceResultHero}>
              <div>
                <p className={styles.practiceResultScore}>
                  {resultSummary.correctAnswers} / {resultSummary.totalQuestions} correctas
                </p>
                <p className={styles.practiceResultMastery}>
                  Dominio obtenido: {resultSummary.scorePercent}%
                </p>
              </div>
              <div className={styles.practiceResultStatus}>
                <span aria-hidden="true">{getStatusIcon(resultSummary.studyStatus)}</span>
                <span>Estado: {getStatusLabel(resultSummary.studyStatus)}</span>
              </div>
            </div>

            <div className={styles.practiceProgressTrack} aria-hidden="true">
              <div
                className={styles.practiceProgressFill}
                style={{ width: `${resultSummary.scorePercent}%` }}
              />
            </div>

            <section className={styles.practiceResultSection}>
              <h3>Resumen de respuestas</h3>
              <div className={styles.practiceResultsList}>
                {results.map((result, index) => (
                  <article
                    key={result.questionId}
                    className={[
                      styles.practiceResultItem,
                      result.isCorrect ? styles.practiceResultItemOk : styles.practiceResultItemError,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <div className={styles.practiceResultItemHeader}>
                      <strong>Pregunta {index + 1}</strong>
                      <span>{result.isCorrect ? "Correcta" : "Fallada"}</span>
                    </div>
                    {!result.isCorrect ? (
                      <>
                        <p>Tu respuesta: {result.selectedAnswer || "Sin respuesta"}</p>
                        <p>Correcta: {result.correctAnswer}</p>
                      </>
                    ) : (
                      <p>Respuesta correcta registrada.</p>
                    )}
                  </article>
                ))}
              </div>
            </section>

            {resultSummary.failedQuestions.length > 0 ? (
              <section className={styles.practiceRecommendation}>
                <strong>Recomendación</strong>
                <p>Repasa los ámbitos donde hubo errores antes de volver a practicar.</p>
              </section>
            ) : null}

            <div className={styles.practiceActions}>
              <button type="button" className={styles.practicePrimaryButton} onClick={handleRestart}>
                Volver a practicar
              </button>
              <button type="button" className={styles.practiceSecondaryButton} onClick={onClose}>
                Cerrar
              </button>
            </div>
          </>
        ) : currentQuestion ? (
          renderQuestionBody(currentQuestion)
        ) : (
          <div className={styles.practiceLoadingState}>
            <p>No se generaron preguntas suficientes para esta carta.</p>
            <div className={styles.practiceActions}>
              <button type="button" className={styles.practiceSecondaryButton} onClick={onClose}>
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
