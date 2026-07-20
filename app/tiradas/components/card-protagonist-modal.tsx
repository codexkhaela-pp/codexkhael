"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { DrawnCard } from "@/app/tiradas/types";

type CardProtagonistModalProps = {
  isOpen: boolean;
  entry: DrawnCard | null;
  positionNumber: number | null;
  onClose: () => void;
  onOpenMeaning: () => void;
};

const focusableSelector =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function CardProtagonistModal({
  isOpen,
  entry,
  positionNumber,
  onClose,
  onOpenMeaning,
}: CardProtagonistModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((element) => !element.hasAttribute("disabled"));

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen || !entry || positionNumber === null) return null;

  const orientationLabel = entry.reversed ? "Invertido" : "Derecho";

  return createPortal(
    <div
      className="card-protagonist-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        ref={dialogRef}
        className="card-protagonist-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-protagonist-title"
      >
        <button
          ref={closeButtonRef}
          type="button"
          className="card-protagonist-close"
          onClick={onClose}
          aria-label="Cerrar vista de carta"
        >
          x
        </button>

        <div className="card-protagonist-image-panel">
          <div className="card-protagonist-image-frame">
            <img
              src={entry.card.image}
              alt={entry.card.nameEs}
              className={`card-protagonist-image${entry.reversed ? " is-reversed" : ""}`}
            />
          </div>
        </div>

        <div className="card-protagonist-copy">
          <span className="card-protagonist-kicker">Posicion {positionNumber}</span>
          <h2 id="card-protagonist-title">{entry.position.label}</h2>
          {entry.position.subtitle ? (
            <p className="card-protagonist-subtitle">{entry.position.subtitle}</p>
          ) : null}

          <div className="card-protagonist-divider" aria-hidden="true" />

          <div className="card-protagonist-cardname">
            <strong>{entry.card.nameEs}</strong>
            <span>{orientationLabel}</span>
          </div>

          <div className="card-protagonist-actions">
            <button type="button" className="btn btn-primary" onClick={onOpenMeaning}>
              Ver significado completo
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}
