"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ClientsLoginFormProps = {
  nextPath: string;
};

export function ClientsLoginForm({ nextPath }: ClientsLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The existing auth endpoint might accept username or email. Let's send username as email to reuse existing logic, or just email if it supports it.
        // I will send it as `username: email` to be compatible with the current `/api/auth/login` body expectations.
        body: JSON.stringify({ username: email, password }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(payload?.error ?? "No se pudo iniciar sesión.");
        return;
      }

      router.push(nextPath);
      router.refresh();
    } catch {
      setError("No se pudo iniciar sesión. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form login-form" onSubmit={onSubmit}>
      <label className="login-form__field">
        <span>Correo electrónico</span>
        <div className="login-form__input-wrap">
          <span className="login-form__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path
                d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M22 6l-10 7L2 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            placeholder="ejemplo@correo.com"
          />
        </div>
      </label>

      <label className="login-form__field">
        <span>Contraseña</span>
        <div className="login-form__input-wrap">
          <span className="login-form__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path
                d="M7 10V8a5 5 0 1 1 10 0v2m-9 0h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            placeholder="Tu contraseña"
          />
          <button
            type="button"
            className="login-form__visibility"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            onClick={() => setShowPassword((current) => !current)}
          >
            <svg viewBox="0 0 24 24" focusable="false">
              <path
                d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="12"
                cy="12"
                r="3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              />
            </svg>
          </button>
        </div>
      </label>

      {error ? (
        <p className="auth-error">{error}</p>
      ) : null}

      <button className="btn btn-primary auth-submit login-form__submit" type="submit" disabled={isSubmitting}>
        <span aria-hidden="true">✦</span>
        {isSubmitting ? "Ingresando..." : "Ingresar a mis lecturas"}
        <span aria-hidden="true">✦</span>
      </button>
    </form>
  );
}
