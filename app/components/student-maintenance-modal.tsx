"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function StudentMaintenanceModal() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    setIsSubmitting(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <main className="login-shell">
      <div className="login-shell__bg login-shell__bg--left" aria-hidden="true" />
      <div className="login-shell__bg login-shell__bg--right" aria-hidden="true" />
      <div className="login-shell__particles" aria-hidden="true" />

      <section className="login-panel" aria-label="Mantenimiento">
        <div className="login-panel__frame" aria-hidden="true" />
        <div className="login-panel__crest" aria-hidden="true">
          <Image
            src="/assets/logo/logo-codex.png"
            alt="Logo Codex"
            fill
            loading="eager"
            unoptimized
            sizes="96px"
          />
        </div>
        
        <div className="login-panel__divider" aria-hidden="true">
          <i />
          <span>✦</span>
          <i />
        </div>
        
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", color: "#f3ebdd", textAlign: "center", marginBottom: "1rem", marginTop: "1rem" }}>
          Codex Khael se está renovando
        </h1>
        <p className="login-panel__intro" style={{ marginBottom: "1rem" }}>
          Estamos preparando una nueva experiencia para que puedas estudiar, practicar y profundizar en el tarot de una forma mucho más completa.
        </p>
        <p className="login-panel__intro" style={{ marginBottom: "1rem" }}>
          Muy pronto volverás a acceder a tus cartas, lecturas, desafíos, repasos y herramientas de aprendizaje.
        </p>
        <p className="login-panel__intro" style={{ marginBottom: "2rem" }}>
          Gracias por acompañarnos durante esta renovación.
        </p>

        <button 
          className="btn btn-primary auth-submit login-form__submit" 
          onClick={handleLogout} 
          disabled={isSubmitting}
        >
          <span aria-hidden="true">✦</span>
          {isSubmitting ? "Saliendo..." : "Volver al inicio"}
          <span aria-hidden="true">✦</span>
        </button>
      </section>
    </main>
  );
}
