"use client";

import { FormEvent, useState } from "react";
import { Mail } from "lucide-react";
import styles from "./forgot-password.module.css";

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
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.inputGroup}>
        <label htmlFor="email" className={styles.label}>Correo electrónico</label>
        <div className={styles.inputWrapper}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className={styles.input}
          />
          <Mail className={styles.inputIcon} size={20} />
        </div>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}
      {successMessage ? <p className={styles.success}>{successMessage}</p> : null}

      <button className={styles.submitBtn} type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Enviando..." : "Enviar instrucciones"}
      </button>
    </form>
  );
}
