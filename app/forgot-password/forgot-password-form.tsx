"use client";

import { FormEvent, useState } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(payload?.error ?? "No se pudo procesar la solicitud.");
        return;
      }

      setSuccessMessage("Si el correo existe, recibirás instrucciones para restablecer tu contraseña. Revisa la consola del servidor en modo desarrollo.");
    } catch {
      setError("Ocurrió un error. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <label htmlFor="email">Correo electrónico</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />

      {error ? <p className="auth-error">{error}</p> : null}
      {successMessage ? <p style={{ color: "var(--success, #4ade80)", fontSize: "0.85rem", marginBottom: "1rem" }}>{successMessage}</p> : null}

      <button className="btn btn-primary auth-submit" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Enviando..." : "Enviar instrucciones"}
      </button>
    </form>
  );
}
