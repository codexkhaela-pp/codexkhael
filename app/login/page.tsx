import { LoginForm } from "@/app/login/login-form";

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
      </section>
    </main>
  );
}

