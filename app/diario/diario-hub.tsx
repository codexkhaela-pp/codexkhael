"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BitacoraWorkbench } from "@/app/diario/bitacora-workbench";
import { addJournalRereading, getJournalEntries, getJournalEntryById } from "@/app/diario/storage";
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

function createRereadingId() {
  return `reread-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

function buildInitialRereadingForm() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  return {
    rereadingDate: date,
    rereadingTime: time,
    didComeTrue: "pendiente" as NonNullable<JournalRereading["didComeTrue"]>,
    reflection: "",
    newPersonalInterpretation: "",
    lessonLearned: "",
  };
}

function getStatusLabel(value?: JournalRereading["didComeTrue"]) {
  if (!value) {
    return "Aún pendiente";
  }

  return STATUS_OPTIONS.find((option) => option.value === value)?.label ?? "Aún pendiente";
}

interface StatusDropdownProps {
  value: NonNullable<JournalRereading["didComeTrue"]>;
  onChange: (value: NonNullable<JournalRereading["didComeTrue"]>) => void;
}

function StatusDropdown({ value, onChange }: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = STATUS_OPTIONS.find((option) => option.value === value) ?? STATUS_OPTIONS[0];

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!dropdownRef.current) {
        return;
      }

      if (!dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div ref={dropdownRef} className="deck-dropdown journal-spread-dropdown">
      <button
        type="button"
        className="deck-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>{selectedOption.label}</span>
        <span className={`deck-chevron${isOpen ? " deck-chevron-open" : ""}`}>v</span>
      </button>
      {isOpen ? (
        <ul className="deck-menu" role="listbox" aria-label="Seleccionar estado de cumplimiento">
          {STATUS_OPTIONS.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                className={`deck-option${value === option.value ? " deck-option-active" : ""}`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function DiarioHub() {
  const [view, setView] = useState<ViewMode>({ type: "list" });
  const [refreshToken, setRefreshToken] = useState(0);

  const entries = useMemo(() => getJournalEntries(), [refreshToken]);

  if (view.type === "new") {
    return (
      <BitacoraWorkbench
        onBack={() => setView({ type: "list" })}
        onSaved={(entry) => {
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
        onRereadingSaved={() => setRefreshToken((value) => value + 1)}
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
        {entries.length === 0 ? (
          <article className="journal-history-card">
            <p>Aún no hay entradas guardadas. Crea tu primera lectura desde "Nueva entrada".</p>
          </article>
        ) : (
          entries.map((entry) => (
            <article key={entry.id} className="journal-history-card">
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
  onRereadingSaved: () => void;
};

function JournalEntryDetail({ entryId, onBack, onRereadingSaved }: JournalEntryDetailProps) {
  const [form, setForm] = useState(buildInitialRereadingForm);
  const [message, setMessage] = useState("");

  const entry = getJournalEntryById(entryId);

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

  function saveRereading() {
    if (!entry) {
      return;
    }

    const payload: JournalRereading = {
      id: createRereadingId(),
      createdAt: new Date().toISOString(),
      rereadingDate: form.rereadingDate,
      rereadingTime: form.rereadingTime,
      didComeTrue: form.didComeTrue,
      reflection: form.reflection,
      newPersonalInterpretation: form.newPersonalInterpretation,
      lessonLearned: form.lessonLearned,
    };

    addJournalRereading(entry.id, payload);
    onRereadingSaved();
    setMessage("Relectura guardada.");
    setForm(buildInitialRereadingForm());
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
          <label>
            Fecha
            <input
              type="date"
              value={form.rereadingDate}
              onChange={(event) => setForm((prev) => ({ ...prev, rereadingDate: event.target.value }))}
            />
          </label>
          <label>
            Hora
            <input
              type="time"
              value={form.rereadingTime}
              onChange={(event) => setForm((prev) => ({ ...prev, rereadingTime: event.target.value }))}
            />
          </label>
          <label className="journal-field-wide">
            ¿Se cumplió la lectura?
            <StatusDropdown
              value={form.didComeTrue}
              onChange={(nextValue) => setForm((prev) => ({ ...prev, didComeTrue: nextValue }))}
            />
          </label>
          <label className="journal-field-wide">
            Reflexión actual
            <textarea
              value={form.reflection}
              onChange={(event) => setForm((prev) => ({ ...prev, reflection: event.target.value }))}
            />
          </label>
          <label className="journal-field-wide">
            Nueva interpretación personal
            <textarea
              value={form.newPersonalInterpretation}
              onChange={(event) => setForm((prev) => ({ ...prev, newPersonalInterpretation: event.target.value }))}
            />
          </label>
          <label className="journal-field-wide">
            Qué aprendí de esta tirada
            <textarea
              value={form.lessonLearned}
              onChange={(event) => setForm((prev) => ({ ...prev, lessonLearned: event.target.value }))}
            />
          </label>
        </div>
        <div className="journal-save-actions journal-rereading-actions">
          <button type="button" className="btn btn-primary" onClick={saveRereading}>
            Guardar relectura
          </button>
          {message ? <p>{message}</p> : null}
        </div>
      </article>
    </section>
  );
}
