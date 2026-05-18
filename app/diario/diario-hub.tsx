"use client";

import { useEffect, useMemo, useState } from "react";
import { BitacoraWorkbench } from "@/app/diario/bitacora-workbench";
import { createRereadingInApi, fetchJournalEntriesFromApi, fetchJournalEntryByIdFromApi } from "@/app/diario/api-client";
import type { JournalEntry, JournalRereading } from "@/app/diario/types";

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

function formatDateTime(date: string, time: string): string {
  if (!date) {
    return "Sin fecha";
  }

  const parsed = new Date(`${date}T${time || "00:00"}`);
  if (Number.isNaN(parsed.getTime())) {
    return `${date} ${time}`.trim();
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

export function DiarioHub() {
  const [view, setView] = useState<ViewMode>({ type: "list" });
  const [refreshToken, setRefreshToken] = useState(0);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadEntries() {
      setIsLoading(true);
      const nextEntries = await fetchJournalEntriesFromApi();
      if (!cancelled) {
        setEntries(nextEntries);
        setIsLoading(false);
      }
    }

    void loadEntries();

    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  const hasEntries = useMemo(() => entries.length > 0, [entries]);

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
    <section className="journal-history" aria-label="Historial de Diario / Bitácora">
      <div className="journal-history-header">
        <h2>Diario / Bitácora</h2>
        <button type="button" className="btn btn-primary" onClick={() => setView({ type: "new" })}>
          Nueva entrada
        </button>
      </div>

      <div className="journal-history-list">
        {isLoading ? (
          <article className="journal-history-card">
            <p>Cargando entradas...</p>
          </article>
        ) : !hasEntries ? (
          <article className="journal-history-card">
            <p>Aún no hay entradas guardadas. Crea tu primera lectura desde "Nueva entrada".</p>
          </article>
        ) : (
          entries.map((entry) => (
            <article key={entry.id} className="journal-history-card">
              {(() => {
                const hasRereadings = entry.rereadings.length > 0;
                const hasFulfilled = entry.rereadings.some((item) => item.didComeTrue === "si");
                return (
                  <>
                    {hasRereadings ? <p><strong>Seguimiento:</strong> Con relecturas</p> : null}
                    {hasFulfilled ? <p><strong>Cumplimiento:</strong> Marcada como cumplida</p> : null}
                  </>
                );
              })()}
              <h3>{entry.metadata.consultantName || "Sin consultante"}</h3>
              <p>
                <strong>Fecha:</strong> {formatDateTime(entry.metadata.date, entry.metadata.time)}
              </p>
              <p>
                <strong>Tirada:</strong> {entry.metadata.spreadType}
              </p>
              <p>
                <strong>Tema:</strong> {entry.metadata.question || "Sin tema"}
              </p>
              <p>
                <strong>Cartas:</strong> {entry.canvas.placements.length}
              </p>
              <p>
                <strong>Relecturas:</strong> {entry.rereadings.length}
              </p>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setView({ type: "detail", entryId: entry.id })}
              >
                Ver
              </button>
            </article>
          ))
        )}
      </div>
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
      <div className="journal-history-header">
        <h2>Entrada registrada</h2>
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          Volver al historial
        </button>
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
