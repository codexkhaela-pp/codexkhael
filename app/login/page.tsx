import { LoginForm } from "@/app/login/login-form";
import Image from "next/image";
import Link from "next/link";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextRaw = params.next;
  let nextCandidate = Array.isArray(nextRaw) ? nextRaw[0] : nextRaw;
  if (nextCandidate === "/dashboard") nextCandidate = "/dashboard-preview";
  const nextPath =
    nextCandidate && nextCandidate.startsWith("/") ? nextCandidate : "/dashboard-preview";

  return (
    <main className="login-shell">
      <div className="login-shell__bg login-shell__bg--left" aria-hidden="true" />
      <div className="login-shell__bg login-shell__bg--right" aria-hidden="true" />
      <div className="login-shell__particles" aria-hidden="true" />

      <section className="login-panel" aria-label="Formulario de acceso">
        <div className="login-panel__frame" aria-hidden="true" />
        <div className="login-panel__crest" aria-hidden="true">
          <Image
            src="/assets/logo/logo-codex.png"
            alt=""
            fill
            loading="eager"
            unoptimized
            sizes="96px"
          />
        </div>
        <p className="login-panel__eyebrow">Acceso privado</p>
        <div className="login-panel__divider" aria-hidden="true">
          <i />
          <span>✦</span>
          <i />
        </div>
        <p className="login-panel__intro">
          Ingresa tus credenciales para acceder a tu espacio de estudio, reflexión y crecimiento.
        </p>

        <LoginForm nextPath={nextPath} />

        <nav className="login-panel__links" aria-label="Enlaces de acceso">
          <Link href="/forgot-password">¿Olvidaste tu contraseña?</Link>
        </nav>
      </section>
    </main>
  );
}
