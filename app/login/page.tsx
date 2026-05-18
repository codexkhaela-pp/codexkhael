import { LoginForm } from "@/app/login/login-form";
import Link from "next/link";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextRaw = params.next;
  const nextCandidate = Array.isArray(nextRaw) ? nextRaw[0] : nextRaw;
  const nextPath =
    nextCandidate && nextCandidate.startsWith("/") ? nextCandidate : "/dashboard";

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-label="Formulario de acceso">
        <p className="app-kicker">Acceso</p>
        <h1>Iniciar sesión</h1>
        <p>Introduce tus credenciales para entrar al panel.</p>
        <LoginForm nextPath={nextPath} />
        <div style={{ marginTop: "0.75rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
            <Link href="/forgot-password" style={{ color: "var(--muted)", textDecoration: "underline" }}>¿Olvidaste tu contraseña?</Link>
          </p>
        </div>
        <div style={{ marginTop: "0.5rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
            ¿No tienes cuenta? <Link href="/register" style={{ color: "var(--gold)", textDecoration: "underline" }}>Regístrate</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

