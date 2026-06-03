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
  const [form, setForm] = useState(buildInitialRereadingForm);
  const [saveMessage, setSaveMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const authSession = useAuthSession();
  const router = useRouter();
  const currentPlan = authSession.plan;

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

    return () => {
      cancelled = true;
    };
  }, [entryId]);

  async function saveRereading() {
    if (!entry || isSaving) {
      return;
    }

    setIsSaving(true);
    setSaveMessage("");

    try {
      const updatedEntry = await createRereadingInApi(entry.id, {
        didComeTrue: form.didComeTrue,
        comment: form.comment,
        reflection: form.reflection,
        newInterpretation: form.newPersonalInterpretation,
        lessonLearned: form.lessonLearned,
      });
      setEntry(updatedEntry);
      setForm(buildInitialRereadingForm());
      setSaveMessage("Relectura guardada.");
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "No se pudo guardar la relectura.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!entry || isDeleting) return;
    const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.");
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      await deleteJournalEntryInApi(entry.id);
      onBack(); // Go back to list, which should refresh since we increment refreshToken in parent usually (wait, onBack in detail view does `setRefreshToken(v=>v+1)` and `setView({ type: "list" })`)
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al eliminar");
      setIsDeleting(false);
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
      <section className="journal-history">
        <div className="journal-history-header">
          <h2>Cargando entrada...</h2>
          <button type="button" className="btn btn-secondary" onClick={onBack}>
            Volver al historial
          </button>
        </div>
      </section>
    );
  }

  if (!entry) {
    return (
      <section className="journal-history">
        <div className="journal-history-header">
          <h2>Entrada no encontrada</h2>
          <button type="button" className="btn btn-secondary" onClick={onBack}>
            Volver al historial
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="journal-detail" aria-label="Detalle de entrada de bitácora">
      <div className="journal-history-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <h2>Entrada registrada</h2>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", maxWidth: "100%" }}>
          <button type="button" className="btn btn-secondary" onClick={handleExportPdf} disabled={isExporting}>
            {isExporting
              ? "Generando..."
              : authSession.status === "loading"
                ? "Cargando plan..."
                : currentPlan === "PRO"
                  ? "Descargar PDF"
                  : "PDF bloqueado"}
          </button>
          <button type="button" className="btn btn-secondary" style={{ borderColor: "#cc0000", color: "#cc0000" }} onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Eliminando..." : "🗑️ Eliminar"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onBack}>
            Volver al historial
          </button>
        </div>
      </div>

      <article className="journal-detail-card">
        <h3>Datos básicos</h3>
        <p>
          <strong>Consultante:</strong> {entry.metadata.consultantName || "Sin consultante"}
        </p>
        <p>
          <strong>Fecha:</strong> {formatDateTime(entry.metadata.date, entry.metadata.time)}
        </p>
        <p>
          <strong>Lugar:</strong> {entry.metadata.place || "Sin lugar"}
        </p>
        <p>
          <strong>Estado emocional:</strong> {entry.metadata.emotionalState || "Sin registro"}
        </p>
        <p>
          <strong>Tirada:</strong> {entry.metadata.spreadType}
        </p>
        <p>
          <strong>Tema:</strong> {entry.metadata.question || "Sin tema"}
        </p>
      </article>

      <article className="journal-detail-card">
        <h3>Mapa de tirada (solo lectura)</h3>
        <div
          className="journal-detail-canvas"
          style={{
            minHeight: entry.canvas.canvasHeight ? Math.max(420, entry.canvas.canvasHeight) : 520,
          }}
        >
          {entry.canvas.placements.map((placement) => (
            <div
              key={placement.id}
              className="journal-detail-placement"
              style={{
                left: placement.x,
                top: placement.y,
              }}
            >
              <div className="journal-card">
                <img src={placement.image} alt={placement.cardName} className={placement.isReversed ? "is-reversed" : ""} />
              </div>
            </div>
          ))}
        </div>
      </article>

      <article className="journal-detail-card">
        <h3>Interpretación original</h3>
        <p>{entry.reflection.personalInterpretation || "Sin interpretación."}</p>
        <h4>Mensaje final / conclusión</h4>
        <p>{entry.reflection.finalMessage || "Sin conclusión."}</p>
        <h4>Acción o consejo</h4>
        <p>{entry.reflection.suggestedAction || "Sin consejo."}</p>
      </article>

      <article className="journal-detail-card">
        <h3>Relecturas futuras</h3>
        {entry.rereadings.length === 0 ? <p>Aún no hay relecturas para esta entrada.</p> : null}
        <div className="journal-rereadings-list">
          {entry.rereadings.map((item) => (
            <article key={item.id} className="journal-rereading-card">
              <p>
                <strong>Fecha:</strong> {formatDateTime(item.rereadingDate, item.rereadingTime)}
              </p>
              <p>
                <strong>¿Se cumplió?:</strong> {getStatusLabel(item.didComeTrue)}
              </p>
              <p>
                <strong>Reflexión actual:</strong> {item.reflection || "Sin reflexión."}
              </p>
              <p>
                <strong>Nueva interpretación:</strong> {item.newPersonalInterpretation || "Sin nueva interpretación."}
              </p>
              <p>
                <strong>Aprendizaje:</strong> {item.lessonLearned || "Sin aprendizaje."}
              </p>
            </article>
          ))}
        </div>
      </article>

      <article className="journal-detail-card">
        <h3>Agregar relectura futura</h3>
        <div className="journal-form-grid">
          <label className="journal-field-wide">
            ¿Se cumplió la lectura?
            <select
              value={form.didComeTrue}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  didComeTrue: event.target.value as NonNullable<JournalRereading["didComeTrue"]>,
                }))
              }
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="journal-field-wide">
            Comentario
            <textarea
              value={form.comment}
              onChange={(event) => setForm((previous) => ({ ...previous, comment: event.target.value }))}
            />
          </label>
          <label className="journal-field-wide">
            Reflexión actual
            <textarea
              value={form.reflection}
              onChange={(event) => setForm((previous) => ({ ...previous, reflection: event.target.value }))}
            />
          </label>
          <label className="journal-field-wide">
            Nueva interpretación personal
            <textarea
              value={form.newPersonalInterpretation}
              onChange={(event) => setForm((previous) => ({ ...previous, newPersonalInterpretation: event.target.value }))}
            />
          </label>
          <label className="journal-field-wide">
            Qué aprendí de esta tirada
            <textarea
              value={form.lessonLearned}
              onChange={(event) => setForm((previous) => ({ ...previous, lessonLearned: event.target.value }))}
            />
          </label>
        </div>
        <div className="journal-save-actions journal-rereading-actions">
          <button type="button" className="btn btn-primary" onClick={saveRereading} disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar relectura"}
          </button>
          {saveMessage ? <p>{saveMessage}</p> : null}
        </div>
      </article>
    </section>
  );
}
