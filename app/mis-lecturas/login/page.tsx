import { ClientsLoginForm } from "@/app/mis-lecturas/login/clients-login-form";
import Image from "next/image";
import Link from "next/link";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ClientsLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextRaw = params.next;
  let nextCandidate = Array.isArray(nextRaw) ? nextRaw[0] : nextRaw;
  const nextPath =
    nextCandidate && nextCandidate.startsWith("/") ? nextCandidate : "/mis-lecturas";

  return (
    <main className="login-shell">
      <div className="login-shell__bg login-shell__bg--left" aria-hidden="true" style={{ opacity: 0.6 }} />
      <div className="login-shell__bg login-shell__bg--right" aria-hidden="true" style={{ opacity: 0.6 }} />
      <div className="login-shell__particles" aria-hidden="true" />

      <section className="login-panel" aria-label="Acceso a Mis Lecturas">
        <div className="login-panel__frame" aria-hidden="true" style={{ borderColor: 'rgba(201, 166, 107, 0.4)' }} />
        
        <div className="login-panel__crest" aria-hidden="true" style={{ borderRadius: '50%', overflow: 'hidden', background: '#09090f', border: '1px solid rgba(201,166,107,0.3)' }}>
          <Image
            src="/assets/landing/luna_fondo.png"
            alt=""
            fill
            loading="eager"
            unoptimized
            sizes="96px"
            style={{ objectFit: 'cover', transform: 'scale(1.2)' }}
          />
        </div>
        
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.45rem", color: "#f3ebdd", textAlign: "center", marginBottom: "0.5rem", marginTop: "1rem" }}>
          Tus lecturas, en un solo lugar
        </h1>
        
        <div className="login-panel__divider" aria-hidden="true" style={{ marginBottom: "1rem" }}>
          <i />
          <span>✦</span>
          <i />
        </div>
        
        <p className="login-panel__intro" style={{ marginBottom: "1.5rem", fontSize: "0.95rem" }}>
          Ingresa a tu espacio privado para revisar las consultas realizadas con Khael Tarotista, las cartas obtenidas, las interpretaciones recibidas y tus mensajes del oráculo.
        </p>

        <ClientsLoginForm nextPath={nextPath} />

        <p className="login-panel__intro" style={{ marginTop: "1.5rem", fontSize: "0.8rem", opacity: 0.6 }}>
          Cada consultante solo puede visualizar sus propias lecturas.
        </p>

        <nav className="login-panel__links" aria-label="Enlaces de acceso" style={{ marginTop: "1rem" }}>
          <Link href="/forgot-password">Olvidé mi contraseña</Link>
        </nav>
      </section>
    </main>
  );
}
