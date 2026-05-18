"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ResetPasswordFormProps = {
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!token) {
      setError("Token de recuperación no encontrado. Solicita un nuevo enlace.");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; message?: string }
        | null;

      if (!response.ok) {
        setError(payload?.error ?? "No se pudo restablecer la contraseña.");
        return;
      }

      setSuccessMessage(payload?.message ?? "Contraseña actualizada. Redirigiendo...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch {
      setError("Ocurrió un error. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <label htmlFor="password">Nueva contraseña</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />

      <label htmlFor="confirmPassword">Confirmar contraseña</label>
      <input
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        required
      />

      {error ? <p className="auth-error">{error}</p> : null}
      {successMessage ? <p style={{ color: "var(--success, #4ade80)", fontSize: "0.85rem", marginBottom: "1rem" }}>{successMessage}</p> : null}

      <button className="btn btn-primary auth-submit" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Actualizando..." : "Restablecer contraseña"}
      </button>
    </form>
  );
}
