import { ForgotPasswordForm } from "@/app/forgot-password/forgot-password-form";
import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <main className="auth-shell">
      <section className="auth-card" aria-label="Recuperar contraseña">
        <p className="app-kicker">Recuperación</p>
        <h1>¿Olvidaste tu contraseña?</h1>
        <p>Introduce tu correo y te enviaremos instrucciones para restablecerla.</p>
        <ForgotPasswordForm />
        <div style={{ marginTop: "1rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
            <Link href="/login" style={{ color: "var(--gold)", textDecoration: "underline" }}>Volver al inicio de sesión</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
