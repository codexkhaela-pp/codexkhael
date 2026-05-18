import { ResetPasswordForm } from "@/app/reset-password/reset-password-form";
import Link from "next/link";

type ResetPasswordPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const tokenRaw = params.token;
  const token = Array.isArray(tokenRaw) ? tokenRaw[0] : tokenRaw;

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-label="Restablecer contraseña">
        <p className="app-kicker">Recuperación</p>
        <h1>Restablecer contraseña</h1>
        <p>Introduce tu nueva contraseña.</p>
        <ResetPasswordForm token={token ?? ""} />
        <div style={{ marginTop: "1rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
            <Link href="/login" style={{ color: "var(--gold)", textDecoration: "underline" }}>Volver al inicio de sesión</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
