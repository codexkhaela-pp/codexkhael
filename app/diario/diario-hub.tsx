"use client";

import { useEffect, useMemo, useState } from "react";
import { BitacoraWorkbench } from "@/app/diario/bitacora-workbench";
import { createRereadingInApi, fetchJournalEntriesFromApi, fetchJournalEntryByIdFromApi, deleteJournalEntryInApi, exportJournalEntryToPdf } from "@/app/diario/api-client";
import type { JournalEntry, JournalRereading } from "@/app/diario/types";
import { useAuthSession } from "@/lib/use-auth-session";
import { useRouter } from "next/navigation";
import styles from "./diario-hub.module.css";

type ViewMode =
  | { type: "list" }
  | { type: "new" }
  | { type: "detail"; entryId: string };

const STATUS_OPTIONS: Array<{ value: NonNullable<JournalRereading["didComeTrue"]>; label: string }> = [
  { value: "si", label: "Sí" },
  { value: "no", label: "No" },
  { value: "parcial", label: "Parcialmente" },
  { value: "pendiente", label: "Aún pendiente" },
];

type SortKey = "recent" | "oldest";
export type DiarioViewType = "list" | "new" | "detail";

function formatDateTime(date: string, time: string): string {
  if (!date) {
    return "Sin fecha";
  }

  const parsed = new Date(`${date}T${time || "00:00"}`);
  if (Number.isNaN(parsed.getTime())) {
    return `${date}`.trim();
  }

  return parsed.toLocaleString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusLabel(value?: JournalRereading["didComeTrue"]) {
  if (!value) {
    return "Aún pendiente";
  }

  return STATUS_OPTIONS.find((option) => option.value === value)?.label ?? "Aún pendiente";
}

function buildInitialRereadingForm() {
  return {
    didComeTrue: "pendiente" as NonNullable<JournalRereading["didComeTrue"]>,
    comment: "",
    reflection: "",
    newPersonalInterpretation: "",
    lessonLearned: "",
  };
}

function parseEntryDate(entry: JournalEntry): Date {
  const date = entry.metadata.date || "";
  const time = entry.metadata.time || "00:00";
  const parsed = new Date(`${date}T${time}`);
  return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

function formatDateLabel(entry: JournalEntry): string {
  const parsed = parseEntryDate(entry);
  if (parsed.getTime() === 0) {
    return "Sin fecha";
  }

  return parsed.toLocaleString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateOnly(date: string): string {
  if (!date) return "Sin fecha";
  const parsed = new Date(`${date}T00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function isSameMonth(date: Date, now: Date): boolean {
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

type DiarioHubProps = {
  onViewTypeChange?: (viewType: DiarioViewType) => void;
};

export function DiarioHub({ onViewTypeChange }: DiarioHubProps) {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>({ type: "list" });
  const [refreshToken, setRefreshToken] = useState(0);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [canCreateNew, setCanCreateNew] = useState(true);
  const [limitReason, setLimitReason] = useState<string | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>("recent");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;

    async function loadEntries() {
      setIsLoading(true);
      const result = await fetchJournalEntriesFromApi();
      if (!cancelled) {
        setEntries(result.entries);
        setCanCreateNew(result.canCreateNew);
        setLimitReason(result.limitReason);
        setIsLoading(false);
      }
    }

    void loadEntries();

    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  const hasEntries = useMemo(() => entries.length > 0, [entries]);
  const now = useMemo(() => new Date(), []);
  const totalReadings = entries.length;
  const totalRereadings = useMemo(
    () => entries.reduce((acc, entry) => acc + entry.rereadings.length, 0),
    [entries],
  );
  const readingsThisMonth = useMemo(
    () => entries.filter((entry) => isSameMonth(parseEntryDate(entry), now)).length,
    [entries, now],
  );
  const rereadingsThisMonth = useMemo(
    () =>
      entries.reduce((acc, entry) => {
        const monthly = entry.rereadings.filter((item) =>
          isSameMonth(new Date(`${item.rereadingDate}T${item.rereadingTime || "00:00"}`), now),
        ).length;
        return acc + monthly;
      }, 0),
    [entries, now],
  );
  const latestEntry = useMemo(() => {
    if (!entries.length) return null;
    return [...entries].sort((a, b) => parseEntryDate(b).getTime() - parseEntryDate(a).getTime())[0];
  }, [entries]);
  const uniqueCardsRegistered = useMemo(() => {
    const set = new Set<string>();
    for (const entry of entries) {
      for (const placement of entry.canvas.placements) {
        if (placement.cardId) set.add(placement.cardId);
      }
    }
    return set.size;
  }, [entries]);
  const sortedEntries = useMemo(() => {
    const cloned = [...entries];
    cloned.sort((a, b) => {
      const delta = parseEntryDate(b).getTime() - parseEntryDate(a).getTime();
      return sortBy === "recent" ? delta : -delta;
    });
    return cloned;
  }, [entries, sortBy]);

  const pageSize = 6;
  const pageCount = Math.max(1, Math.ceil(sortedEntries.length / pageSize));
  const paginatedEntries = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedEntries.slice(start, start + pageSize);
  }, [sortedEntries, page]);

  useEffect(() => {
    setPage(1);
  }, [sortBy, entries.length]);

  useEffect(() => {
    onViewTypeChange?.(view.type);
  }, [onViewTypeChange, view.type]);

  if (view.type === "new") {
    return (
      <BitacoraWorkbench
        onBack={() => setView({ type: "list" })}
        onSaved={(entry) => {
          setEntries((previous) => [entry, ...previous.filter((item) => item.id !== entry.id)]);
          setRefreshToken((value) => value + 1);
          setView({ type: "detail", entryId: entry.id });
        }}
      />
    );
  }

  if (view.type === "detail") {
    return (
      <JournalEntryDetail
        key={view.entryId}
        entryId={view.entryId}
        onBack={() => {
          setRefreshToken((value) => value + 1);
          setView({ type: "list" });
        }}
      />
    );
  }

  return (
    <section className={styles.journalMain} aria-label="Historial de Diario / Bitácora">
      <div className={styles.topActions}>
        <button 
          type="button" 
          className={styles.newEntryButton} 
          onClick={() => {
            if (!canCreateNew) {
              setShowLimitModal(true);
              return;
            }
            setView({ type: "new" });
          }}
        >
          + Nuevo registro
        </button>
      </div>

      <div className={styles.statsGrid}>
        <article className={styles.statCard}>
          <div className={styles.statIcon}>📖</div>
          <div>
            <p className={styles.statLabel}>Total de lecturas</p>
            <p className={styles.statValue}>{totalReadings}</p>
            <p className={styles.statHint}>↗ +{readingsThisMonth} este mes</p>
          </div>
        </article>
        <article className={styles.statCard}>
          <div className={styles.statIcon}>🔄</div>
          <div>
            <p className={styles.statLabel}>Total de relecturas</p>
            <p className={styles.statValue}>{totalRereadings}</p>
            <p className={styles.statHint}>↗ +{rereadingsThisMonth} este mes</p>
          </div>
        </article>
        <article className={styles.statCard}>
          <div className={styles.statIcon}>🗓</div>
          <div>
            <p className={styles.statLabel}>Última entrada</p>
            <p className={styles.statValueSmall}>{latestEntry ? formatDateOnly(latestEntry.metadata.date) : "--"}</p>
            <p className={styles.statMuted}>
              {latestEntry?.metadata.consultantName || "Sin consultante"} · {latestEntry ? latestEntry.canvas.placements.length : 0} cartas
            </p>
          </div>
        </article>
        <article className={styles.statCard}>
          <div className={styles.statIcon}>✦</div>
          <div>
            <p className={styles.statLabel}>Cartas registradas</p>
            <p className={styles.statValue}>{uniqueCardsRegistered} / 78</p>
            <p className={styles.statMuted}>Mazo completado</p>
          </div>
        </article>
      </div>

      <div className={styles.entriesToolbar}>
        <h3 className={styles.entriesTitle}>✦ Entradas recientes</h3>
        <label className={styles.sortWrap}>
          <span>Ordenar por:</span>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortKey)} className={styles.sortSelect}>
            <option value="recent">Más recientes</option>
            <option value="oldest">Más antiguas</option>
          </select>
        </label>
      </div>

      {isLoading ? (
        <article className={styles.emptyState}>Cargando entradas...</article>
      ) : !hasEntries ? (
        <article className={styles.emptyState}>Aún no hay entradas guardadas. Crea tu primera lectura desde "Nueva entrada".</article>
      ) : (
        <>
          <div className={styles.entriesGrid}>
            {paginatedEntries.map((entry) => (
              <article key={entry.id} className={styles.entryCard}>
                <div className={styles.entryTop}>
                  <div className={styles.entryIconWrap}>
                    {entry.canvas.placements[0]?.image ? (
                      <img
                        src={entry.canvas.placements[0].image}
                        alt={entry.canvas.placements[0].cardName || "Carta"}
                        className={styles.entryCardThumb}
                      />
                    ) : (
                      <span className={styles.entryFallback}>✦</span>
                    )}
                  </div>
                  <div className={styles.entryHeadText}>
                    <h4>{entry.metadata.consultantName || "Sin consultante"}</h4>
                    <p>{formatDateLabel(entry)}</p>
                  </div>
                  <button type="button" className={styles.entryMenu} aria-label="Más opciones">
                    •••
                  </button>
                </div>

                <div className={styles.entryBody}>
                  <p>
                    <strong>Tirada:</strong> {entry.metadata.spreadType}
                  </p>
                  <p>
                    <strong>Tema:</strong> {entry.metadata.question || "Sin tema"}
                  </p>
                </div>

                <div className={styles.entryFooter}>
                  <p>🂠 {entry.canvas.placements.length} cartas</p>
                  <p>◔ {entry.rereadings.length} relecturas</p>
                  <button
                    type="button"
                    className={styles.readButton}
                    onClick={() => setView({ type: "detail", entryId: entry.id })}
                  >
                    Ver lectura →
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className={styles.pagination}>
            <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1}>
              ‹
            </button>
            <span>{page}</span>
            <span className={styles.pageTotal}>/ {pageCount}</span>
            <button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={page >= pageCount}>
              ›
            </button>
          </div>
        </>
      )}

      {showLimitModal && (
        <div className={styles.modalOverlay} onClick={() => setShowLimitModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIcon}>✦</div>
            <h3 className={styles.modalTitle}>Límite Alcanzado</h3>
            <p className={styles.modalText}>
              {limitReason || "Has alcanzado el límite de bitácoras de tu plan."}
            </p>
            <p className={styles.modalSubText}>
              Mejora tu plan para poder guardar más lecturas y seguir tu progreso sin límites.
            </p>
            <div className={styles.modalActions}>
              <button 
                type="button" 
                className={styles.modalCancelBtn} 
                onClick={() => setShowLimitModal(false)}
              >
                Cerrar
              </button>
              <button 
                type="button" 
                className={styles.modalUpgradeBtn}
                onClick={() => {
                  setShowLimitModal(false);
                  router.push('/planes');
                }}
              >
                Ver Planes
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

type JournalEntryDetailProps = {
  entryId: string;
  onBack: () => void;
};

function JournalEntryDetail({ entryId, onBack }: JournalEntryDetailProps) {
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const authSession = useAuthSession();
  const router = useRouter();
  const currentPlan = authSession.plan;

  // Modals state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showRereadingModal, setShowRereadingModal] = useState(false);
  const [rereadingForm, setRereadingForm] = useState(buildInitialRereadingForm);
  const [isSavingRereading, setIsSavingRereading] = useState(false);

  const [showInterpretationModal, setShowInterpretationModal] = useState(false);
  const [interpretationForm, setInterpretationForm] = useState({ newInterpretation: "", reflection: "" });
  const [isSavingInterpretation, setIsSavingInterpretation] = useState(false);

  const [isInterpretationExpanded, setIsInterpretationExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadEntry() {
      setIsLoading(true);
      const nextEntry = await fetchJournalEntryByIdFromApi(entryId);
      if (!cancelled) {
        setEntry(nextEntry);
        setIsLoading(false);
      }
    }
    void loadEntry();
    return () => { cancelled = true; };
  }, [entryId]);

  async function saveRereading() {
    if (!entry || isSavingRereading) return;
    setIsSavingRereading(true);
    try {
      const updatedEntry = await createRereadingInApi(entry.id, {
        didComeTrue: rereadingForm.didComeTrue,
        comment: rereadingForm.comment,
        reflection: rereadingForm.reflection,
        newInterpretation: rereadingForm.newPersonalInterpretation,
        lessonLearned: rereadingForm.lessonLearned,
        recordType: "REREADING"
      });
      setEntry(updatedEntry);
      setRereadingForm(buildInitialRereadingForm());
      setShowRereadingModal(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "No se pudo guardar la relectura.");
    } finally {
      setIsSavingRereading(false);
    }
  }

  async function savePersonalInterpretation() {
    if (!entry || isSavingInterpretation || !interpretationForm.newInterpretation.trim()) return;
    setIsSavingInterpretation(true);
    try {
      const updatedEntry = await createRereadingInApi(entry.id, {
        reflection: interpretationForm.reflection,
        newInterpretation: interpretationForm.newInterpretation,
        recordType: "PERSONAL_INTERPRETATION"
      });
      setEntry(updatedEntry);
      setInterpretationForm({ newInterpretation: "", reflection: "" });
      setShowInterpretationModal(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "No se pudo guardar la interpretación.");
    } finally {
      setIsSavingInterpretation(false);
    }
  }

  async function handleDelete() {
    if (!entry || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteJournalEntryInApi(entry.id);
      onBack();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al eliminar");
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  }

  async function handleExportPdf() {
    if (authSession.status !== "authenticated") {
      router.push("/login?next=/bitacora");
      return;
    }
    if (currentPlan !== "PRO") {
      router.push("/planes?from=feature&feature=export-pdf");
      return;
    }
    if (!entry || isExporting) return;
    setIsExporting(true);
    try {
      await exportJournalEntryToPdf(entry.id);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al exportar PDF");
    } finally {
      setIsExporting(false);
    }
  }

  if (isLoading) {
    return (
      <section className={styles.detailContainer}>
        <div className={styles.detailHeader}>
          <h2 className={styles.detailTitle}>Cargando entrada...</h2>
          <button type="button" className={styles.btnGhost} onClick={onBack}>← Volver a la bitácora</button>
        </div>
      </section>
    );
  }

  if (!entry) {
    return (
      <section className={styles.detailContainer}>
        <div className={styles.detailHeader}>
          <h2 className={styles.detailTitle}>Entrada no encontrada</h2>
          <button type="button" className={styles.btnGhost} onClick={onBack}>← Volver a la bitácora</button>
        </div>
      </section>
    );
  }

  const rereadings = entry.rereadings.filter(r => r.recordType !== "PERSONAL_INTERPRETATION");
  const personalInterpretations = entry.rereadings.filter(r => r.recordType === "PERSONAL_INTERPRETATION");

  return (
    <section className={styles.detailContainer} aria-label="Detalle de lectura">
      <div className={styles.detailHeader}>
        <div className={styles.detailTitleArea}>
          <button type="button" className={styles.backLink} onClick={onBack}>
            <span>←</span> Volver a la bitácora
          </button>
          <h2 className={styles.detailTitle}>Detalle de lectura</h2>
        </div>
        <div className={styles.detailActions}>
          <button type="button" className={styles.btnGhost} onClick={handleExportPdf} disabled={isExporting}>
            {isExporting ? "Generando PDF..." : "Descargar PDF"}
          </button>
          <button type="button" className={`${styles.btnGhost} ${styles.btnDanger}`} onClick={() => setShowDeleteModal(true)}>
            Eliminar
          </button>
        </div>
      </div>

      <div className={styles.detailGrid}>
        <article className={styles.detailCard}>
          <h3 className={styles.detailSectionTitle}>Datos de la lectura</h3>
          <div className={styles.detailCardRow}>
            {entry.metadata.consultantName && (
              <div className={styles.infoItem}>
                <span className={styles.infoIcon}>✦</span>
                <div className={styles.infoText}>
                  <span className={styles.infoLabel}>Consultante</span>
                  <span className={styles.infoValue}>{entry.metadata.consultantName}</span>
                </div>
              </div>
            )}
            <div className={styles.infoItem}>
              <span className={styles.infoIcon}>✦</span>
              <div className={styles.infoText}>
                <span className={styles.infoLabel}>Fecha y hora</span>
                <span className={styles.infoValue}>{formatDateTime(entry.metadata.date, entry.metadata.time)}</span>
              </div>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoIcon}>✦</span>
              <div className={styles.infoText}>
                <span className={styles.infoLabel}>Tirada</span>
                <span className={styles.infoValue}>{entry.metadata.spreadType}</span>
              </div>
            </div>
            {entry.metadata.question && (
              <div className={styles.infoItem}>
                <span className={styles.infoIcon}>✦</span>
                <div className={styles.infoText}>
                  <span className={styles.infoLabel}>Tema o pregunta</span>
                  <span className={styles.infoValue}>{entry.metadata.question}</span>
                </div>
              </div>
            )}
            <div className={styles.infoItem}>
              <span className={styles.infoIcon}>✦</span>
              <div className={styles.infoText}>
                <span className={styles.infoLabel}>Cartas</span>
                <span className={styles.infoValue}>{entry.canvas.placements.length} cartas</span>
              </div>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoIcon}>✦</span>
              <div className={styles.infoText}>
                <span className={styles.infoLabel}>Relecturas</span>
                <span className={styles.infoValue}>{rereadings.length} en el historial</span>
              </div>
            </div>
          </div>
        </article>

        <article className={styles.detailCard}>
          <h3 className={styles.detailSectionTitle}>✦ Interpretación original</h3>
          <div className={`${styles.originalInterpretation} ${isInterpretationExpanded ? styles.textExpanded : styles.textTruncated}`}>
            {entry.reflection.personalInterpretation ? (
              <p style={{ marginBottom: "16px", whiteSpace: "pre-wrap" }}>{entry.reflection.personalInterpretation}</p>
            ) : (
              <p style={{ marginBottom: "16px", fontStyle: "italic", opacity: 0.6 }}>Sin interpretación principal.</p>
            )}
            
            {entry.reflection.finalMessage && (
              <div style={{ marginBottom: "16px" }}>
                <strong style={{ color: "var(--landing-gold-2, #f2d6a0)" }}>Mensaje final:</strong>
                <p style={{ marginTop: "4px", whiteSpace: "pre-wrap" }}>{entry.reflection.finalMessage}</p>
              </div>
            )}

            {entry.reflection.suggestedAction && (
              <div style={{ marginBottom: "16px" }}>
                <strong style={{ color: "var(--landing-gold-2, #f2d6a0)" }}>Acción / Consejo:</strong>
                <p style={{ marginTop: "4px", whiteSpace: "pre-wrap" }}>{entry.reflection.suggestedAction}</p>
              </div>
            )}
          </div>
          {!isInterpretationExpanded && (
            <button className={styles.btnLink} onClick={() => setIsInterpretationExpanded(true)}>
              Ver interpretación completa →
            </button>
          )}

          {personalInterpretations.length > 0 && (
             <div style={{ marginTop: "32px", borderTop: "1px solid var(--landing-line, rgba(215, 173, 105, 0.28))", paddingTop: "20px" }}>
               <h3 className={styles.detailSectionTitle} style={{ fontSize: "16px" }}>Interpretaciones personales</h3>
               <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                 {personalInterpretations.map(pi => (
                   <div key={pi.id} style={{ paddingLeft: "16px", borderLeft: "2px solid var(--landing-gold, #d7ad69)" }}>
                     <span style={{ fontSize: "11px", color: "var(--landing-muted, rgba(247, 239, 226, 0.72))", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                       {formatDateOnly(pi.rereadingDate)}
                     </span>
                     <p style={{ color: "var(--landing-ink, #f7efe2)", fontSize: "14px", lineHeight: 1.6, marginTop: "6px", marginBottom: "0", whiteSpace: "pre-wrap" }}>
                       {pi.newPersonalInterpretation}
                     </p>
                     {pi.reflection && (
                       <p style={{ color: "var(--landing-muted, rgba(247, 239, 226, 0.72))", fontSize: "13px", lineHeight: 1.5, marginTop: "8px", fontStyle: "italic", marginBottom: "0", whiteSpace: "pre-wrap" }}>
                         Contexto: {pi.reflection}
                       </p>
                     )}
                   </div>
                 ))}
               </div>
             </div>
          )}
        </article>
      </div>

      <article className={styles.detailCard}>
        <h3 className={styles.detailSectionTitle}>✦ Mapa de tirada (solo lectura)</h3>
        <div className={styles.mapContainer} style={{ minHeight: entry.canvas.canvasHeight ? Math.max(420, entry.canvas.canvasHeight) : 520 }}>
          <div className={styles.mapCanvas}>
            {entry.canvas.placements.map((placement) => (
              <div
                key={placement.id}
                style={{
                  position: "absolute",
                  left: placement.x,
                  top: placement.y,
                  width: "120px",
                }}
              >
                <div style={{ position: "relative" }}>
                  <img src={placement.image} alt={placement.cardName} style={{ width: "100%", borderRadius: "8px", transform: placement.isReversed ? "rotate(180deg)" : "none", display: "block", border: "1px solid rgba(215, 173, 105, 0.28)", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }} />
                  <div style={{ textAlign: "center", marginTop: "8px", color: "var(--landing-muted)", fontSize: "11px", textTransform: "uppercase" }}>
                    {placement.isReversed ? "Invertida" : "Derecha"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </article>

      <article className={styles.detailCard}>
        <h3 className={styles.detailSectionTitle}>✦ Relecturas</h3>
        {rereadings.length === 0 ? (
          <p style={{ color: "var(--landing-muted, rgba(247, 239, 226, 0.72))", fontSize: "14px", fontStyle: "italic", margin: 0 }}>
            Aún no hay relecturas guardadas. Registra el progreso de esta tirada para ver tu historial aquí.
          </p>
        ) : (
          <div className={styles.timeline}>
            {rereadings.map((item) => (
              <div key={item.id} className={styles.timelineItem}>
                <div className={styles.timelineDot} />
                <span className={styles.timelineDate}>{formatDateTime(item.rereadingDate, item.rereadingTime)}</span>
                <div className={styles.timelineContent}>
                  <div style={{ marginBottom: item.reflection || item.lessonLearned || item.newPersonalInterpretation ? "12px" : "0" }}>
                    <span className={styles.timelineLabel} style={{ fontWeight: 600, color: "var(--landing-gold-2, #f2d6a0)", display: "block", marginBottom: "4px" }}>¿Se cumplió?: </span>
                    <span className={styles.timelineValue}>{getStatusLabel(item.didComeTrue)}</span>
                  </div>
                  {item.reflection && (
                    <div style={{ marginBottom: item.lessonLearned || item.newPersonalInterpretation ? "12px" : "0" }}>
                      <span className={styles.timelineLabel} style={{ fontWeight: 600, color: "var(--landing-gold-2, #f2d6a0)", display: "block", marginBottom: "4px" }}>Reflexión actual: </span>
                      <span className={styles.timelineValue} style={{ whiteSpace: "pre-wrap", display: "block" }}>{item.reflection}</span>
                    </div>
                  )}
                  {item.newPersonalInterpretation && (
                    <div style={{ marginBottom: item.lessonLearned ? "12px" : "0" }}>
                      <span className={styles.timelineLabel} style={{ fontWeight: 600, color: "var(--landing-gold-2, #f2d6a0)", display: "block", marginBottom: "4px" }}>Nueva interpretación: </span>
                      <span className={styles.timelineValue} style={{ whiteSpace: "pre-wrap", display: "block" }}>{item.newPersonalInterpretation}</span>
                    </div>
                  )}
                  {item.lessonLearned && (
                    <div>
                      <span className={styles.timelineLabel} style={{ fontWeight: 600, color: "var(--landing-gold-2, #f2d6a0)", display: "block", marginBottom: "4px" }}>Qué aprendí: </span>
                      <span className={styles.timelineValue} style={{ whiteSpace: "pre-wrap", display: "block" }}>{item.lessonLearned}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </article>

      <div style={{ paddingBottom: "64px" }}>
        <h3 className={styles.detailSectionTitle}>Acciones Rápidas</h3>
        <div className={styles.quickActions}>
          <button type="button" className={styles.quickActionCard} onClick={() => setShowRereadingModal(true)}>
            <div className={styles.quickActionIcon}>↻</div>
            <div className={styles.quickActionText}>
              <h4 className={styles.quickActionTitle}>Agregar relectura futura</h4>
              <p className={styles.quickActionDesc}>Registra el progreso y cumplimiento de la lectura.</p>
            </div>
          </button>
          
          <button type="button" className={styles.quickActionCard} onClick={() => setShowInterpretationModal(true)}>
            <div className={styles.quickActionIcon}>✦</div>
            <div className={styles.quickActionText}>
              <h4 className={styles.quickActionTitle}>Nueva interpretación personal</h4>
              <p className={styles.quickActionDesc}>Registra cómo entiendes hoy la tirada sin modificar la original.</p>
            </div>
          </button>
          
          <button type="button" className={styles.quickActionCard} disabled>
            <div className={styles.quickActionIcon} style={{ opacity: 0.5 }}>➦</div>
            <div className={styles.quickActionText}>
              <h4 className={styles.quickActionTitle}>Compartir lectura</h4>
              <span className={styles.badge}>Próximamente</span>
            </div>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className={styles.modalOverlay} onClick={() => !isDeleting && setShowDeleteModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
             <h3 className={styles.modalTitle} style={{ color: "#f7efe2", fontSize: "24px" }}>Eliminar lectura</h3>
             <p className={styles.modalText} style={{ marginBottom: "24px" }}>
               Esta acción eliminará permanentemente esta lectura y la información asociada. Esta acción no se puede deshacer.
             </p>
             <div className={styles.modalActions}>
               <button type="button" className={styles.btnGhost} onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>Cancelar</button>
               <button type="button" className={`${styles.btnGhost} ${styles.btnDanger}`} onClick={handleDelete} disabled={isDeleting}>
                 {isDeleting ? "Eliminando..." : "Eliminar lectura"}
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Rereading Modal */}
      {showRereadingModal && (
        <div className={styles.modalOverlay} onClick={() => !isSavingRereading && setShowRereadingModal(false)}>
          <div className={styles.modalContent} style={{ maxWidth: "560px" }} onClick={e => e.stopPropagation()}>
             <h3 className={styles.modalTitle} style={{ color: "#f7efe2", fontSize: "24px" }}>Agregar relectura futura</h3>
             <p className={styles.modalText} style={{ marginBottom: "24px" }}>
               Evalúa cómo se desarrolló esta lectura a lo largo del tiempo.
             </p>
             
             <div className={styles.formGroup}>
               <label className={styles.formLabel}>¿Se cumplió la lectura?</label>
               <select className={styles.formInput} value={rereadingForm.didComeTrue} onChange={(e) => setRereadingForm(prev => ({ ...prev, didComeTrue: e.target.value as any }))}>
                 {STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
               </select>
             </div>
             
             <div className={styles.formGroup}>
               <label className={styles.formLabel}>Reflexión actual</label>
               <textarea className={styles.formInput} rows={3} placeholder="Describe qué ocurrió y cómo lo relacionas con la lectura..." value={rereadingForm.reflection} onChange={(e) => setRereadingForm(prev => ({ ...prev, reflection: e.target.value }))} />
             </div>

             <div className={styles.formGroup}>
               <label className={styles.formLabel}>Nueva interpretación (dentro de esta relectura)</label>
               <textarea className={styles.formInput} rows={2} placeholder="Opcional. Una nueva forma de ver esta lectura al re-evaluarla." value={rereadingForm.newPersonalInterpretation} onChange={(e) => setRereadingForm(prev => ({ ...prev, newPersonalInterpretation: e.target.value }))} />
             </div>

             <div className={styles.formGroup}>
               <label className={styles.formLabel}>Qué aprendí</label>
               <textarea className={styles.formInput} rows={2} placeholder="Conclusiones o aprendizajes de esta relectura..." value={rereadingForm.lessonLearned} onChange={(e) => setRereadingForm(prev => ({ ...prev, lessonLearned: e.target.value }))} />
             </div>

             <div className={styles.modalActions} style={{ marginTop: "24px" }}>
               <button type="button" className={styles.btnGhost} onClick={() => setShowRereadingModal(false)} disabled={isSavingRereading}>Cancelar</button>
               <button type="button" className={styles.modalUpgradeBtn} onClick={saveRereading} disabled={isSavingRereading}>
                 {isSavingRereading ? "Guardando..." : "Guardar relectura"}
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Personal Interpretation Modal */}
      {showInterpretationModal && (
        <div className={styles.modalOverlay} onClick={() => !isSavingInterpretation && setShowInterpretationModal(false)}>
          <div className={styles.modalContent} style={{ maxWidth: "560px" }} onClick={e => e.stopPropagation()}>
             <h3 className={styles.modalTitle} style={{ color: "#f7efe2", fontSize: "24px" }}>Nueva interpretación personal</h3>
             <p className={styles.modalText} style={{ marginBottom: "24px" }}>
               Registra cómo entiendes hoy esta tirada sin modificar la interpretación original.
             </p>
             
             <div className={styles.formGroup}>
               <label className={styles.formLabel}>Interpretación <span style={{ color: "#cc0000" }}>*</span></label>
               <textarea className={styles.formInput} rows={5} placeholder="Tu nueva forma de entender las cartas..." value={interpretationForm.newInterpretation} onChange={(e) => setInterpretationForm(prev => ({ ...prev, newInterpretation: e.target.value }))} />
             </div>

             <div className={styles.formGroup}>
               <label className={styles.formLabel}>Reflexión o contexto (opcional)</label>
               <textarea className={styles.formInput} rows={2} placeholder="¿Qué te hizo ver las cosas de esta forma?" value={interpretationForm.reflection} onChange={(e) => setInterpretationForm(prev => ({ ...prev, reflection: e.target.value }))} />
             </div>

             <div className={styles.modalActions} style={{ marginTop: "24px" }}>
               <button type="button" className={styles.btnGhost} onClick={() => setShowInterpretationModal(false)} disabled={isSavingInterpretation}>Cancelar</button>
               <button type="button" className={styles.modalUpgradeBtn} onClick={savePersonalInterpretation} disabled={isSavingInterpretation || !interpretationForm.newInterpretation.trim()}>
                 {isSavingInterpretation ? "Guardando..." : "Guardar interpretación"}
               </button>
             </div>
          </div>
        </div>
      )}

    </section>
  );
}

