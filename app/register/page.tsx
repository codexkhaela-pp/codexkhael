import { RegisterForm } from "@/app/register/register-form";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="auth-shell">
      <section className="auth-card" aria-label="Formulario de registro">
        <p className="app-kicker">Registro</p>
        <h1>Crear cuenta</h1>
        <p>Introduce tus datos para registrarte en la plataforma.</p>
        <RegisterForm />
        <div style={{ marginTop: "1rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
            ¿Ya tienes cuenta? <Link href="/login" style={{ color: "var(--gold)", textDecoration: "underline" }}>Inicia sesión</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
