"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { AuthSessionStatus } from "@/lib/use-auth-session";
import type { QuickInterpretationOutput, PositionReading } from "@/lib/quick-interpretation";
import type { AiTarotReadingResponse } from "@/lib/ai-client";
import type { ReadingStatus } from "@/app/tiradas/types";
import type { TarotSpread, TarotSpreadPosition } from "@/src/data/tarotSpreads";
import { CustomSelect } from "./custom-select";
import styles from "./tiradas-laterales.module.css";

type SpreadOption = {
  id: string;
  name: string;
  description: string;
  cardCount: number;
  isLocked: boolean;
  requiredPlan: string | null;
};

type ReadingSummaryItem = {
  index: number;
  label: string;
  subtitle: string;
  cardName: string;
  orientation: string;
};

type InterpretationTab = {
  id: string;
  label: string;
  shortLabel: string;
  type: "summary" | "positions" | "relationships" | "advice" | "mentor";
  item?: PositionReading;
  isNew?: boolean;
};

type ReadingExperienceShellProps = {
  authStatus: AuthSessionStatus;
  authEmail: string | null;
  currentPlan: string | null | undefined;
  spreadId: string;
  spreadOptions: SpreadOption[];
  selectedSpread: TarotSpread | null;
  selectedSpreadPositions: TarotSpreadPosition[];
  selectedSpreadDescription: string;
  spreadPresentation: {
    title: string;
    subtitle: string;
    eyebrow: string;
    legend: string;
  };
  isManualSpread: boolean;
  isBusy: boolean;
  status: ReadingStatus;
  readingQuestion: string;
  onReadingQuestionChange: (value: string) => void;
  manualQuestion: string;
  onManualQuestionChange: (value: string) => void;
  manualCardCount: number;
  manualPlacedCardCount: number;
  manualIsFinalized: boolean;
  maxManualCards: number;
  onManualCardCountChange: (value: number) => void;
  manualAllowRepeated: boolean;
  onManualAllowRepeatedChange: (checked: boolean) => void;
  manualError: string | null;
  manualIsGenerating: boolean;
  aiDepthState: "idle" | "loading" | "ready";
  aiDepthError: string | null;
  interpretationVisible: boolean;
  onInterpretationVisibilityChange: (value: boolean) => void;
  interpretationTab: string;
  onInterpretationTabChange: (value: string) => void;
  interpretationTabs: InterpretationTab[];
  mentorTabNew: boolean;
  revealedReadingItems: ReadingSummaryItem[];
  activeQuestion: string;
  activeInterpretation: QuickInterpretationOutput | null;
  aiResponse: AiTarotReadingResponse | null;
  canShowInterpretationCta: boolean;
  onPrimaryInterpretationCta: () => void | Promise<void>;
  onManualPrepare: () => void | Promise<void>;
  onStartReading: () => void;
  onResetPresetReading: () => void;
  onResetManualSpread: () => void;
  onSpreadChange: (spreadId: string) => void;
  onShareReading: () => void | Promise<void>;
  onExportPdf: () => void;
  onSaveReadingDraft: () => void;
  getPlanAccent: (plan: string | null | undefined) => string;
  getUserInitial: (email: string | null) => string;
  boardContent: ReactNode;
};

function fixEncoding(text: string) {
  try {
    return decodeURIComponent(escape(text));
  } catch {
    return text;
  }
}

function normalizeSpanish(text: string): string {
  const fixed = fixEncoding(text);
  const replacements: Array<[string, string]> = [
    ["\u00c3\u0192\u00c6\u2019\u00c3\u201a\u00c2\u00a1", "á"],
    ["\u00c3\u0192\u00c6\u2019\u00c3\u201a\u00c2\u00a9", "é"],
    ["\u00c3\u0192\u00c6\u2019\u00c3\u201a\u00c2\u00ad", "í"],
    ["\u00c3\u0192\u00c6\u2019\u00c3\u201a\u00c2\u00b3", "ó"],
    ["\u00c3\u0192\u00c6\u2019\u00c3\u201a\u00c2\u00ba", "ú"],
    ["\u00c3\u0192\u00c6\u2019\u00c3\u201a\u00c2\u00b1", "ñ"],
    ["\u00c3\u0192\u00e2\u20ac\u0161", ""],
  ];

  return replacements.reduce((current, [source, target]) => current.split(source).join(target), fixed);
}

function renderText(text: string): string {
  return normalizeSpanish(text);
}

export function ReadingExperienceShell({
  authStatus,
  currentPlan,
  spreadId,
  spreadOptions,
  selectedSpread,
  selectedSpreadPositions,
  selectedSpreadDescription,
  spreadPresentation,
  isManualSpread,
  isBusy,
  status,
  readingQuestion,
  onReadingQuestionChange,
  manualQuestion,
  onManualQuestionChange,
  manualCardCount,
  manualPlacedCardCount,
  manualIsFinalized,
  maxManualCards,
  onManualCardCountChange,
  manualAllowRepeated,
  onManualAllowRepeatedChange,
  manualError,
  manualIsGenerating,
  aiDepthState,
  aiDepthError,
  interpretationVisible,
  onInterpretationVisibilityChange,
  interpretationTab,
  onInterpretationTabChange,
  interpretationTabs,
  mentorTabNew,
  revealedReadingItems,
  activeQuestion,
  activeInterpretation,
  aiResponse,
  canShowInterpretationCta,
  onPrimaryInterpretationCta,
  onManualPrepare,
  onStartReading,
  onResetPresetReading,
  onResetManualSpread,
  onSpreadChange,
  onShareReading,
  onExportPdf,
  onSaveReadingDraft,
  getPlanAccent,
  boardContent,
}: ReadingExperienceShellProps) {
  const [summaryDrawerOpen, setSummaryDrawerOpen] = useState(false);
  const [questionExpanded, setQuestionExpanded] = useState(false);
  const readingRevealed = isManualSpread ? manualIsFinalized : status === "completada";
  const activeQuestionValue = activeQuestion || (isManualSpread ? manualQuestion : readingQuestion);
  const questionShouldClamp = activeQuestionValue.length > 120;

  useEffect(() => {
    if (!readingRevealed) {
      setSummaryDrawerOpen(false);
    }
  }, [readingRevealed]);

  useEffect(() => {
    setQuestionExpanded(false);
  }, [activeQuestionValue]);

  function renderPreparationContent(mode: "sidebar" | "tab") {
    return (
      <>
        <div className={styles.sidePanelHeader}>
          <span className={styles.sidePanelTitle}>
            ✦ {mode === "tab" ? "Preparación" : "Preparación de lectura"}
          </span>
        </div>

        <div className={styles.sidePanelSection}>
          <label className={styles.sidePanelSection}>
            <span className={styles.sidePanelLabel}>Tu pregunta</span>
            <textarea
              value={isManualSpread ? manualQuestion : readingQuestion}
              onChange={(event) =>
                isManualSpread
                  ? onManualQuestionChange(event.target.value)
                  : onReadingQuestionChange(event.target.value)
              }
              className={styles.sidePanelTextarea}
              placeholder="¿Qué necesitas comprender sobre esta situación?"
              rows={3}
              disabled={isManualSpread && manualIsFinalized}
            />
          </label>

          <label className={styles.sidePanelSection}>
            <span className={styles.sidePanelLabel}>Tipo de tirada</span>
            <CustomSelect
              value={spreadId}
              onChange={onSpreadChange}
              disabled={isBusy || authStatus === "loading"}
              options={spreadOptions.map(option => ({
                id: option.id,
                label: renderText(option.name),
                disabled: option.isLocked,
                meta: option.isLocked && option.requiredPlan ? renderText(option.requiredPlan) : undefined
              }))}
            />
          </label>
        </div>

        {isManualSpread ? (
          <div className={styles.sidePanelSection}>
            <span className={styles.sidePanelLabel}>Configuración libre</span>
            <div className="manual-card-count-pills">
              {Array.from({ length: maxManualCards }, (_, index) => index + 1).map((count) => (
                <button
                  key={count}
                  type="button"
                  className={`manual-pill ${manualCardCount === count ? "manual-pill--active" : ""}`}
                  onClick={() => onManualCardCountChange(count)}
                  disabled={manualIsGenerating || aiDepthState === "loading" || manualIsFinalized}
                >
                  {count} cartas
                </button>
              ))}
            </div>
            <label className="reading-checkbox">
              <input
                type="checkbox"
                checked={manualAllowRepeated}
                onChange={(event) => onManualAllowRepeatedChange(event.target.checked)}
                disabled={manualIsFinalized}
              />
              <span style={{ color: "rgba(247,239,226,.8)", fontSize: "0.85rem" }}>Permitir cartas repetidas</span>
            </label>
          </div>
        ) : null}

        <hr className={styles.sidePanelSeparator} />

        <div className={styles.sidePanelDeck}>
          <div className={styles.sidePanelDeckInfo}>
            <span className={styles.sidePanelLabel}>Mazo seleccionado</span>
            <h3 className={styles.sidePanelDeckName}>Codex Khael Tarot</h3>
            <span className={styles.sidePanelDeckEdition}>Rider Waite</span>
          </div>

          <div className={styles.sidePanelDeckImageWrapper}>
            <div
              className={`deck-stack${status === "barajando" ? " deck-stack-shuffling" : ""}${
                status === "revelando" ? " deck-stack-cut" : ""
              }`}
              aria-label="Mazo cerrado"
              style={{ border: "none" }}
            >
              <div className="deck-face" aria-hidden="true" style={{ border: "none", background: "transparent" }}>
                <img src="/decks/carta_codex.png" alt="Codex Khael Back" className="deck-face-image" style={{ borderRadius: "13px" }} />
              </div>
              <span className="deck-layer deck-layer-one" aria-hidden="true" style={{ backgroundImage: "url(/decks/carta_codex.png)", border: "none" }} />
              <span className="deck-layer deck-layer-two" aria-hidden="true" style={{ backgroundImage: "url(/decks/carta_codex.png)", border: "none" }} />
              <span className="deck-layer deck-layer-three" aria-hidden="true" style={{ backgroundImage: "url(/decks/carta_codex.png)", border: "none" }} />
              <span className="deck-layer deck-layer-four" aria-hidden="true" style={{ backgroundImage: "url(/decks/carta_codex.png)", border: "none" }} />
              <span className="deck-layer deck-layer-five" aria-hidden="true" style={{ backgroundImage: "url(/decks/carta_codex.png)", border: "none" }} />
            </div>
          </div>

          <div className={styles.sidePanelStatusBadge}>
            {authStatus === "loading"
              ? "Cargando sesión"
              : isManualSpread
                ? manualIsFinalized
                  ? "Lectura lista"
                  : "En construcción"
                : status === "inicial"
                  ? <>Mazo listo <span className={styles.sidePanelStatusDot}></span></>
                  : status === "barajando"
                    ? <>Barajando <span className={`${styles.sidePanelStatusDot} ${styles.sidePanelStatusDotPulse}`}></span></>
                    : status === "revelando"
                      ? <>Revelando <span className={`${styles.sidePanelStatusDot} ${styles.sidePanelStatusDotPulse}`}></span></>
                      : "Lectura revelada"}
          </div>
        </div>

        <div className={styles.sidePanelSection} style={{ marginTop: "auto" }}>
          {isManualSpread ? (
            <>
              <button
                type="button"
                className={styles.sideBtnPrimary}
                onClick={() => void onManualPrepare()}
                disabled={
                  manualIsGenerating ||
                  aiDepthState === "loading" ||
                  authStatus !== "authenticated" ||
                  manualPlacedCardCount === 0 ||
                  manualIsFinalized
                }
              >
                {manualIsGenerating ? "Finalizando..." : "✦ Finalizar Tirada"}
              </button>
              <button
                type="button"
                className={styles.sideBtnGhost}
                onClick={onResetManualSpread}
                disabled={manualIsGenerating || aiDepthState === "loading"}
              >
                ↻ Nueva tirada
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={styles.sideBtnPrimary}
                onClick={onStartReading}
                disabled={isBusy}
              >
                {status === "barajando" ? "Barajando..." : "✦ Barajar y Revelar"}
              </button>
              <button
                type="button"
                className={styles.sideBtnGhost}
                onClick={onResetPresetReading}
                disabled={isBusy}
              >
                ↻ Nueva tirada
              </button>
            </>
          )}
        </div>

        {manualError ? <p className="manual-error" style={{ color: "#ef4444", fontSize: "0.85rem", textAlign: "center" }}>{manualError}</p> : null}
      </>
    );
  }

  function renderSummaryContent(mode: "sidebar" | "tab") {
    return (
      <>
        <div className={styles.sidePanelHeader}>
          <span className={styles.sidePanelTitle}>
            ✦ {mode === "tab" ? "Resumen" : "Resumen de tu tirada"}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
          {revealedReadingItems.length > 0 ? (
            revealedReadingItems.map((item, index) => (
              <details key={`${item.index}-${item.label}`} className={styles.sidePanelSummaryItem} open={index === 0}>
                <summary className={styles.sidePanelSummarySummary}>
                  <div className={styles.sidePanelSummaryNumber}>{item.index}</div>
                  <div className={styles.sidePanelSummaryCopy}>
                    <span className={styles.sidePanelSummaryPositionName}>{renderText(item.label)}</span>
                    <span className={styles.sidePanelSummaryState}>
                      {item.cardName}
                      {item.orientation !== "Pendiente" ? ` (${item.orientation})` : ""}
                    </span>
                  </div>
                  <span className={styles.sidePanelSummaryChevron} aria-hidden="true">
                    ▼
                  </span>
                </summary>
                <div className={styles.sidePanelSummaryBody}>
                  {item.subtitle ? <p style={{ margin: 0 }}>{renderText(item.subtitle)}</p> : null}
                </div>
              </details>
            ))
          ) : (
            <div className={styles.sidePanelEmpty}>
              <p style={{ margin: 0 }}>La mesa aún no ha sido revelada.</p>
              <small>
                {isManualSpread
                  ? "Finaliza la tirada para generar el resumen completo de posiciones."
                  : "Cuando las cartas aparezcan, aquí tendrás el mapa completo de posiciones."}
              </small>
            </div>
          )}
        </div>

        <div className={styles.sidePanelSection} style={{ marginTop: "24px" }}>
          <button
            type="button"
            className={styles.sideBtnPrimary}
            onClick={() => void onPrimaryInterpretationCta()}
            disabled={!canShowInterpretationCta || aiDepthState === "loading"}
          >
            {aiDepthState === "loading" ? "Activando..." : "✨ Activar Modo Mentor"}
            {!canShowInterpretationCta && <span className={styles.sidePanelProBadge}>PRO</span>}
          </button>
          <p className={styles.sidePanelMentorDesc}>Una lectura más humana, profunda y personalizada desde tu tirada.</p>

          <div className={styles.sidePanelActionsGrid}>
            <button
              type="button"
              className={styles.sidePanelActionBtn}
              onClick={onSaveReadingDraft}
              disabled={!canShowInterpretationCta}
            >
              <svg className={styles.sidePanelActionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
              <span>Guardar en<br />Bitácora</span>
            </button>
            <button
              type="button"
              className={styles.sidePanelActionBtn}
              onClick={onExportPdf}
              disabled={!canShowInterpretationCta}
            >
              <svg className={styles.sidePanelActionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              <span>Exportar<br />PDF</span>
            </button>
            <button
              type="button"
              className={styles.sidePanelActionBtn}
              onClick={() => void onShareReading()}
              disabled={!canShowInterpretationCta}
            >
              <svg className={styles.sidePanelActionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
              <span>Compartir<br />lectura</span>
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <section className="reading-tool reading-experience" aria-label="Generador de tiradas">
      {readingRevealed ? (
        <>
          <button
            type="button"
            className="reading-summary-rail is-visible"
            onClick={() => setSummaryDrawerOpen(true)}
            aria-expanded={summaryDrawerOpen}
            aria-controls="reading-summary-panel"
          >
            <span className="reading-edge-tab__label">Resumen</span>
          </button>

          <div
            className={`reading-summary-backdrop${summaryDrawerOpen ? " is-open" : ""}`}
            onClick={() => setSummaryDrawerOpen(false)}
            aria-hidden={summaryDrawerOpen ? "false" : "true"}
          />
        </>
      ) : null}

      <div className={`reading-board reading-board--immersive${readingRevealed ? " reading-board--revealed" : ""}`}>
        <aside className={`reading-prep-panel ${styles.sidePanelWrapper}`} aria-label="Preparación de la lectura">
          {renderPreparationContent("sidebar")}
        </aside>

        <section
          className={`reading-main reading-main--ritual${status === "completada" || activeInterpretation ? " reading-main-complete" : ""}`}
          aria-label="Mesa de tarot"
        >
          <header className="reading-stage-header">
            <div className="reading-stage-heading">
              <h1>
                <span className="reading-stage-heading__star" aria-hidden="true">
                  ✦
                </span>
                <span>{renderText(spreadPresentation.title)}</span>
                <span className="reading-stage-heading__star" aria-hidden="true">
                  ✦
                </span>
              </h1>
              <p>{renderText(spreadPresentation.subtitle)}</p>
            </div>

          </header>

          {!readingRevealed ? (
            <p className="reading-guidance">
              {!isManualSpread && status === "inicial" && "Prepara tu consulta y deja que la mesa se ordene antes de revelar."}
              {!isManualSpread && status === "barajando" && "El mazo está entrando en movimiento. Mantén tu atención en la pregunta."}
              {!isManualSpread && status === "revelando" && "La lectura se abre carta por carta. Observa la geometría completa antes de interpretar."}
              {!isManualSpread && status === "completada" && "La mesa ya está completa. Revisa las posiciones y luego interpreta la lectura."}
              {isManualSpread && !manualIsFinalized && !manualIsGenerating
                ? "Tirada en construcción. Selecciona las cartas y posiciones que desees analizar."
                : null}
              {isManualSpread && manualIsGenerating ? "Cerrando la tirada y preparando la interpretación tradicional..." : null}
              {isManualSpread && manualIsFinalized ? "Lectura lista para interpretar. La tirada quedó cerrada y Mentor ya puede activarse de forma opcional." : null}
            </p>
          ) : (
            <>
              <div className={`reading-question-band${questionExpanded ? " is-expanded" : ""}`}>
                <span className="reading-question-band__label">Pregunta</span>
                <p className={`reading-question-band__text${questionShouldClamp && !questionExpanded ? " is-clamped" : ""}`}>
                  {activeQuestionValue || "Sin pregunta registrada."}
                </p>
                {questionShouldClamp ? (
                  <button
                    type="button"
                    className="reading-question-band__toggle"
                    onClick={() => setQuestionExpanded((value) => !value)}
                  >
                    {questionExpanded ? "Ver menos" : "Ver completa"}
                  </button>
                ) : null}
              </div>

            </>
          )}

          <div className="reading-main-panel">
            <div className="reading-canvas-shell">
              <div className="reading-canvas-shell__aura" aria-hidden="true" />
              <div className="reading-canvas-shell__grid" aria-hidden="true" />
              <div className="reading-canvas-shell__stars" aria-hidden="true" />
              <div className="reading-canvas-shell__body">{boardContent}</div>
              <p className="reading-board-hint">Haz clic en cada carta para ver su significado.</p>
            </div>

            {canShowInterpretationCta && !interpretationVisible ? (
              <div className="reading-interpret-cta">
                <button
                  type="button"
                  className="btn btn-primary reading-interpret-cta__button"
                  onClick={() => void onPrimaryInterpretationCta()}
                  disabled={aiDepthState === "loading"}
                >
                  {aiDepthState === "loading" ? "Activando..." : "✨ Activar Modo Mentor"}
                </button>
                <p>Una lectura más humana, profunda y personalizada desde tu tirada.</p>
              </div>
            ) : null}

          </div>
        </section>
        {!readingRevealed ? (
          <aside className={`reading-summary-panel ${styles.sidePanelWrapper}`} aria-label="Resumen de tu tirada">
            {renderSummaryContent("sidebar")}
          </aside>
        ) : null}
      </div>

      {readingRevealed ? (
        <aside
          id="reading-summary-panel"
          className={`reading-summary-panel reading-summary-panel--drawer ${styles.sidePanelWrapper}${summaryDrawerOpen ? " is-open" : ""}`}
          aria-label="Resumen de tu tirada"
        >
          <div className="reading-summary-panel__drawer-topbar">
            <button
              type="button"
              className="reading-summary-panel__close"
              onClick={() => setSummaryDrawerOpen(false)}
              aria-label="Cerrar resumen"
            >
              ×
            </button>
          </div>
          {renderSummaryContent("sidebar")}
        </aside>
      ) : null}
            {interpretationVisible && activeInterpretation ? (
              <section className="interpretation-panel interpretation-panel--ritual" aria-label="Interpretación de la tirada" style={{ marginTop: "24px" }}>
                <header className="interpretation-header interpretation-header--ritual">
                  <div>
                    <span className="reading-panel-kicker">INTERPRETACIÓN DE TU TIRADA</span>
                    <h3>INTERPRETACIÓN DE TU TIRADA</h3>
                    <p>{isManualSpread ? "Lectura preparada desde tu disposición libre." : "Lectura integrada a partir de la tirada revelada."}</p>
                  </div>
                  <div className="interpretation-ai-trigger-wrap">
                    <button
                      type="button"
                      className="btn btn-secondary interpretation-ai-trigger"
                      onClick={() => void onPrimaryInterpretationCta()}
                      disabled={aiDepthState === "loading"}
                    >
                      {aiDepthState === "loading"
                        ? "Activando..."
                        : aiDepthState === "ready"
                          ? "Actualizar Modo Mentor"
                          : "✨ Activar Modo Mentor"}
                    </button>
                    <small className="interpretation-ai-trigger-copy">
                      Una lectura más humana, profunda y personalizada desde tu tirada.
                    </small>
                  </div>
                  <button
                    type="button"
                    className="interpretation-collapse"
                    onClick={() => onInterpretationVisibilityChange(false)}
                    aria-label="Cerrar interpretación"
                  >
                    ×
                  </button>
                </header>

                <div className="interpretation-tablist" role="tablist" aria-label="Secciones de interpretación">
                  {interpretationTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={interpretationTab === tab.id}
                      className={`interpretation-tab${interpretationTab === tab.id ? " is-active" : ""}${
                        tab.id === "mentor" ? " interpretation-tab--mentor" : ""
                      }${tab.id === "mentor" && mentorTabNew ? " is-new" : ""}`}
                      onClick={() => onInterpretationTabChange(tab.id)}
                    >
                      <span className="interpretation-tab__mobile">{tab.shortLabel}</span>
                      <span className="interpretation-tab__desktop">{tab.label}</span>
                      {tab.id === "mentor" && mentorTabNew ? <span className="interpretation-tab__badge">NUEVO</span> : null}
                    </button>
                  ))}
                </div>

                <div className="interpretation-copy interpretation-copy--ritual">
                  {interpretationTab === "summary" ? (
                    <div className="interpretation-base-stack">
                      <article className="interpretation-base-section interpretation-base-section--lead">
                        <span className="reading-panel-kicker">Mensaje central</span>
                        <h3>Síntesis general</h3>
                        <div
                          className="local-reading-html"
                          dangerouslySetInnerHTML={{ __html: activeInterpretation.summary }}
                        />
                        {activeQuestion ? <small>Pregunta: {activeQuestion}</small> : null}
                      </article>
                    </div>
                  ) : null}

                  {interpretationTab === "positions" ? (
                    <div className="interpretation-position-grid">
                      {activeInterpretation.positionReadings.map((item) => (
                        <article className="position-reading-card position-reading-card--compact" key={item.positionNumber}>
                          <div
                            className="local-reading-html"
                            dangerouslySetInnerHTML={{ __html: item.interpretation }}
                          />
                        </article>
                      ))}
                    </div>
                  ) : null}

                  {interpretationTab === "relationships" ? (
                    <div className="interpretation-base-stack">
                      <article className="interpretation-base-section">
                        <h3>Relaciones entre cartas</h3>
                        <div
                          className="local-reading-html"
                          dangerouslySetInnerHTML={{ __html: activeInterpretation.relationships }}
                        />
                      </article>
                    </div>
                  ) : null}

                  {interpretationTab === "advice" ? (
                    <div className="interpretation-final-grid">
                      <article className="interpretation-base-section">
                        <h3>Consejo final integrado</h3>
                        <div
                          className="local-reading-html"
                          dangerouslySetInnerHTML={{ __html: activeInterpretation.finalAdvice }}
                        />
                      </article>
                    </div>
                  ) : null}

                  {interpretationTab === "mentor" && aiDepthState === "ready" && aiResponse ? (
                    <div className="mentor-panel">
                      {aiResponse.preferredOption ? (
                        <article className="mentor-section">
                          <h3>🧭 Postura de la tirada</h3>
                          <p>
                            {`La opción más favorecida es ${aiResponse.preferredOption}. ${aiResponse.preferredOptionReason}`}
                          </p>
                          {aiResponse.alternativeOptionRisk ? <p>{aiResponse.alternativeOptionRisk}</p> : null}
                        </article>
                      ) : null}
                      <article className="mentor-section">
                        <h3>🎯 Lo que las cartas realmente están diciendo</h3>
                        <p>{aiResponse.directAnswer}</p>
                      </article>
                      <article className="mentor-section">
                        <h3>⚖️ La contradicción principal</h3>
                        <p>{aiResponse.blindSpot}</p>
                      </article>
                      <article className="mentor-section">
                        <h3>🔥 La tensión que sostiene toda la historia</h3>
                        <p>{aiResponse.deepDynamic}</p>
                      </article>
                      <article className="mentor-section">
                        <h3>⚠️ Lo que podría sabotear el resultado</h3>
                        <p>{aiResponse.mainRisk}</p>
                      </article>
                      <article className="mentor-section">
                        <h3>🚪 La oportunidad oculta</h3>
                        <p>{aiResponse.realOpportunity}</p>
                      </article>
                      <article className="mentor-section">
                        <h3>👤 Consejo de Mentor</h3>
                        <p>{aiResponse.mentorAdvice}</p>
                      </article>
                      <article className="mentor-section">
                        <h3>⚡ Acción concreta para los próximos 7 días</h3>
                        <p>{aiResponse.sevenDayAction}</p>
                      </article>
                      <article className="mentor-section">
                        <h3>❓ La pregunta que cambia toda la lectura</h3>
                        <p>{aiResponse.reflectionQuestion}</p>
                        <small className="interpretation-warning">{aiResponse.warning}</small>
                      </article>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}
    </section>
  );
}
