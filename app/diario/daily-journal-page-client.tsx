"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./daily-journal-page.module.css";
import {
  DAILY_JOURNAL_AREAS,
  type DailyJournalArea,
  type DailyJournalEntryPayload,
} from "@/lib/daily-journal/types";

type DailyJournalPageClientProps = {
  initialEntry: DailyJournalEntryPayload;
  timezone: string;
};

const STATUS_COPY: Record<DailyJournalEntryPayload["status"], { label: string; tone: string }> = {
  EMPTY: { label: "Sin registrar", tone: "empty" },
  PARTIAL: { label: "Parcial", tone: "partial" },
  COMPLETED: { label: "Completado", tone: "completed" },
};

const AREA_LABELS: Record<DailyJournalArea, string> = {
  amor: "Amor",
  trabajo: "Trabajo",
  dinero: "Dinero",
  salud: "Salud",
  familia: "Familia",
  espiritualidad: "Espiritualidad",
  decisiones: "Decisiones",
  otro: "Otro",
};

function formatDateLabel(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const dateValue = new Date(Date.UTC(year, (month || 1) - 1, day || 1, 12, 0, 0));

  return dateValue.toLocaleDateString("es-PE", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function DailyJournalPageClient({ initialEntry, timezone }: DailyJournalPageClientProps) {
  const [entry, setEntry] = useState(initialEntry);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  function updateField<K extends keyof DailyJournalEntryPayload>(key: K, value: DailyJournalEntryPayload[K]) {
    setEntry((current) => ({ ...current, [key]: value }));
  }

  function toggleArea(area: DailyJournalArea) {
    setEntry((current) => {
      const nextAreas = current.manifestedAreas.includes(area)
        ? current.manifestedAreas.filter((item) => item !== area)
        : [...current.manifestedAreas, area];

      return { ...current, manifestedAreas: nextAreas };
    });
  }

  async function handleSave() {
    setIsSaving(true);
    setFeedback(null);

    try {
      const response = await fetch(
        `/api/daily-journal/today?timezone=${encodeURIComponent(timezone)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            morningIntention: entry.morningIntention,
            experience: entry.experience,
            manifestedAreas: entry.manifestedAreas,
            intensity: entry.intensity,
            nightReflection: entry.nightReflection,
          }),
        },
      );

      const payload = (await response.json()) as { entry?: DailyJournalEntryPayload; error?: string };

      if (!response.ok || !payload.entry) {
        throw new Error(payload.error || "No se pudo guardar el diario.");
      }

      setEntry(payload.entry);
      setFeedback({ kind: "success", message: "Diario guardado correctamente." });
    } catch (error) {
      setFeedback({
        kind: "error",
        message: error instanceof Error ? error.message : "No se pudo guardar el diario.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  const status = STATUS_COPY[entry.status];

  return (
    <section className={styles.page}>
      <article className={styles.summaryCard}>
        <div className={styles.summaryHeader}>
          <div>
            <p className={styles.eyebrow}>Carta del día</p>
            <h2 className={styles.cardTitle}>{entry.card.name}</h2>
            <p className={styles.cardMeta}>
              {formatDateLabel(entry.date)} · {entry.card.orientation === "REVERSED" ? "Invertida" : "Al derecho"}
            </p>
          </div>

          <span className={`${styles.statusBadge} ${styles[`status_${status.tone}`]}`}>
            {status.label}
          </span>
        </div>

        <div className={styles.summaryBody}>
          <div className={styles.cardVisual}>
            <div className={styles.cardFrame}>
              <Image
                src={entry.card.imageUrl}
                alt={entry.card.name}
                fill
                className={`${styles.cardImage} ${entry.card.orientation === "REVERSED" ? styles.cardImageReversed : ""}`}
                sizes="200px"
              />
            </div>
          </div>

          <div className={styles.messagePanel}>
            <p className={styles.messageLabel}>Mensaje del día</p>
            <p className={styles.messageCopy}>{entry.card.dailyMessage}</p>
          </div>
        </div>
      </article>

      <div className={styles.bodyGrid}>
        <article className={styles.formCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h3>Registro diario</h3>
              <p>Una sola entrada por día, editable durante la jornada.</p>
            </div>
          </div>

          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>Intención de la mañana</span>
              <textarea
                value={entry.morningIntention}
                onChange={(event) => updateField("morningIntention", event.target.value)}
                placeholder="¿Qué quiero manifestar hoy con esta energía?"
                rows={4}
              />
            </label>

            <label className={styles.field}>
              <span>Mi experiencia con esta carta</span>
              <textarea
                value={entry.experience}
                onChange={(event) => updateField("experience", event.target.value)}
                placeholder="¿Qué ocurrió hoy que sentiste conectado con esta carta?"
                rows={6}
              />
            </label>

            <fieldset className={styles.fieldset}>
              <legend>¿Dónde sentiste esta energía?</legend>
              <div className={styles.areaGrid}>
                {DAILY_JOURNAL_AREAS.map((area) => {
                  const checked = entry.manifestedAreas.includes(area);
                  return (
                    <label key={area} className={`${styles.areaChip} ${checked ? styles.areaChipChecked : ""}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggleArea(area)} />
                      <span>{AREA_LABELS[area]}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className={styles.fieldset}>
              <legend>Intensidad percibida</legend>
              <p className={styles.helperText}>¿Cuánto sentiste la energía de esta carta durante el día?</p>
              <div className={styles.intensityRow}>
                {[1, 2, 3, 4, 5].map((value) => {
                  const active = entry.intensity === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      className={`${styles.intensityButton} ${active ? styles.intensityButtonActive : ""}`}
                      onClick={() => updateField("intensity", value)}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <label className={styles.field}>
              <span>Reflexión nocturna</span>
              <textarea
                value={entry.nightReflection}
                onChange={(event) => updateField("nightReflection", event.target.value)}
                placeholder="Después de vivir este día, ¿qué aprendiste?"
                rows={5}
              />
            </label>
          </div>

          {feedback ? (
            <p className={feedback.kind === "success" ? styles.successMessage : styles.errorMessage}>
              {feedback.message}
            </p>
          ) : null}

          <div className={styles.actions}>
            <button type="button" className={styles.saveButton} onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar diario"}
            </button>
            <Link href="/dashboard-preview" className={styles.secondaryButton}>
              Volver al dashboard
            </Link>
          </div>
        </article>

        <aside className={styles.guideCard}>
          <p className={styles.eyebrow}>Guía de escritura</p>
          <h3>Preguntas para aterrizar tu día</h3>
          <ul className={styles.guideList}>
            <li>¿Qué sentí hoy con más claridad?</li>
            <li>¿Qué situación conectó directamente con la carta?</li>
            <li>¿Qué aprendizaje quiero conservar mañana?</li>
          </ul>
          <div className={styles.guideFooter}>
            <Link href="/bitacora" className={styles.ghostLink}>
              Abrir bitácora de lecturas
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
