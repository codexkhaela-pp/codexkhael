"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type LoginFormProps = {
  nextPath: string;
};

export function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
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
        body: JSON.stringify({ username, password }),
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

  const isActivationNotice = error.includes("pendiente de activación");

  return (
    <form className="auth-form login-form" onSubmit={onSubmit}>
      <label className="login-form__field">
        <span>Usuario</span>
        <div className="login-form__input-wrap">
          <span className="login-form__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path
                d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.86 0-7 1.79-7 4v1h14v-1c0-2.21-3.14-4-7-4Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
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
        <p className={isActivationNotice ? "login-form__notice" : "auth-error"}>{error}</p>
      ) : null}

      <button className="btn btn-primary auth-submit login-form__submit" type="submit" disabled={isSubmitting}>
        <span aria-hidden="true">✦</span>
        {isSubmitting ? "Ingresando..." : "Entrar"}
        <span aria-hidden="true">✦</span>
      </button>
    </form>
  );
}
