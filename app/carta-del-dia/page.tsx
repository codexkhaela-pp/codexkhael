"use client";

import Image from "next/image";
import Link from "next/link";
import { LandingHeader } from "../components/landing-header";
import { useEffect, useState, type ReactNode } from "react";
import { WhatsappFloatingButton } from "../components/whatsapp-floating-button";

type DailyCardOrientation = "UPRIGHT" | "REVERSED";

type HistoryItem = {
  label: string;
  fecha: string;
  cardName: string;
  orientation: DailyCardOrientation;
};

type CartaDelDiaDTO = {
  id: string;
  cardId: string;
  orientation: DailyCardOrientation;
  isRevealed: boolean;
  hasReflection: boolean;
  timezone: string;
  HeroMensaje: string;
  NombreCarta: string;
  ImagenCarta: string;
  MensajePrincipal: string;
  Amor: string;
  Dinero: string;
  Trabajo: string;
  CrecimientoPersonal: string;
  AccionRecomendada: string;
  PreguntaReflexion: string;
  Sombra: string;
  Fecha: string;
  historialEnergetico: HistoryItem[];
};

const footerSun = "/assets/landing/sol.png?v=3";
const defaultTimezone = "America/Lima";

const manifestationAreas = [
  { key: "Amor", icon: "♥", title: "Amor" },
  { key: "Dinero", icon: "◇", title: "Dinero" },
  { key: "Trabajo", icon: "✦", title: "Trabajo" },
  { key: "CrecimientoPersonal", icon: "✧", title: "Crecimiento personal" },
] as const;

function getOrientationLabel(orientation: DailyCardOrientation): string {
  return orientation === "REVERSED" ? "Invertida" : "Al derecho";
}

function PublicHeader() {
  return <LandingHeader />;
}

function PublicFooter() {
  return (
    <footer className="landing-footer">
      <div className="landing-footer__brand">
        <Link className="landing-brand" href="/" aria-label="Khael Tarotista">
          <Image 
            src="/assets/brand/final-01.png" 
            alt="Khael Tarotista Logo" 
            width={65} 
            height={65}
            priority
            className="landing-brand-logo-img"
            style={{ objectFit: "contain" }}
          />
        </Link>
        <p>Tarot · Estudio · Simbolismo</p>
        <small>© 2026 Khael Tarotista. Todos los derechos reservados.</small>
      </div>

      <div className="landing-footer__links">
        <h3>Enlaces</h3>
        <Link href="/lecturas">Lecturas</Link>
        <Link href="/carta-del-dia">Carta del Día</Link>
        <Link href="/codex-khael">
          Codex Khael
        </Link>
        <Link href="/mis-lecturas/login">MIS LECTURAS</Link>
        {/* <Link href="/#tienda">Tienda</Link> */}
        <Link href="/acerca-de-mi">Sobre mí</Link>
        {/* <Link href="/#contacto">Contacto</Link> */}
      </div>

      <div className="landing-footer__newsletter">
        <h3>Sígueme</h3>
        <div className="landing-socials" aria-label="Redes sociales">
          <a href="https://www.instagram.com/khael.tarotista?igsh=ZDh0a2x3ZHpwN2k4&utm_source=qr" target="_blank" rel="noopener noreferrer">◍</a>
          <a href="mailto:hola@codexkhael.com">♪</a>
          <a href="mailto:hola@codexkhael.com">▶</a>
          <a href="mailto:hola@codexkhael.com">✉</a>
        </div>
        <label htmlFor="daily-email">Recibe inspiración semanal</label>
        <div className="landing-email">
          <input id="daily-email" type="email" placeholder="Tu correo electrónico" />
          <button type="button" aria-label="Enviar correo">
            →
          </button>
        </div>
      </div>

      <div className="landing-footer__sun">
        <Image src={footerSun} alt="" fill unoptimized sizes="280px" />
      </div>
    </footer>
  );
}

function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="landing-page readings-page daily-public-page">
      <PublicHeader />
      {children}
      <PublicFooter />
      <WhatsappFloatingButton />
    </div>
  );
}

function DailyCardSkeleton() {
  return (
    <PublicLayout>
      <main className="daily-card-page">
        <section className="daily-card-skeleton" aria-label="Cargando carta del día">
          <div className="daily-skeleton-line daily-skeleton-date" />
          <div className="daily-skeleton-title" />
          <div className="daily-skeleton-card" />
          <div className="daily-skeleton-line daily-skeleton-copy" />
        </section>
      </main>
    </PublicLayout>
  );
}

export default function CartaDelDiaPage() {
  const [carta, setCarta] = useState<CartaDelDiaDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDailyCard() {
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || defaultTimezone;
        const response = await fetch(`/api/carta-del-dia?timezone=${encodeURIComponent(timezone)}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("No se pudo cargar la carta del día.");
        }

        const data = (await response.json()) as CartaDelDiaDTO;
        if (!cancelled) {
          setCarta({ ...data, isRevealed: true });
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Error inesperado.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDailyCard();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <DailyCardSkeleton />;
  }

  if (error || !carta) {
    return (
      <PublicLayout>
        <main className="daily-card-page">
          <section className="daily-error-card">
            <p className="daily-kicker">Carta del Día</p>
            <h1>No se pudo abrir el oráculo diario.</h1>
            <p>{error || "Inténtalo nuevamente en unos minutos."}</p>
          </section>
        </main>
      </PublicLayout>
    );
  }

  const paragraphs = carta.MensajePrincipal.split(/\n+/).filter(Boolean).slice(0, 4);

  return (
    <PublicLayout>
      <main className="daily-card-page">
        <section className="daily-hero daily-hero--landing" aria-labelledby="daily-card-title">
          <Image
            src="/assets/carta_dia/carta1.png"
            alt=""
            fill
            priority
            unoptimized
            sizes="(max-width: 768px) 100vw, 70vw"
            className="daily-hero-bg"
          />
          <div className="daily-hero-copy">
            <p className="landing-kicker">Carta del Día</p>
            <h1 id="daily-card-title">Tu guía para hoy</h1>
            <div className="daily-date-line">
              <span />
              <p className="daily-date">{carta.Fecha}</p>
              <span />
            </div>

            <div className="daily-arcane-name">
              <h2>{carta.NombreCarta}</h2>
              <span>{getOrientationLabel(carta.orientation)}</span>
            </div>

            <p className="daily-hero-message">{carta.HeroMensaje}</p>
          </div>

          <div className="daily-hero-stage" aria-hidden="true">
            <div className="daily-card-visual is-revealed">
              <Image
                src={carta.ImagenCarta}
                alt={carta.NombreCarta}
                width={340}
                height={560}
                priority
                className={carta.orientation === "REVERSED" ? "is-reversed" : undefined}
              />
            </div>
          </div>
        </section>

        <section className="daily-content-grid">
          <section className="daily-reading-pair" aria-label="Mensaje y acción del día">
            <article className="daily-premium-card daily-message-card">
              <div className="daily-card-heading">
                <span>✦</span>
                <h2>Mensaje para hoy</h2>
              </div>
              <div className="daily-message-copy">
                {paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>

            <article className="daily-premium-card daily-action-card">
              <div className="daily-action-illustration" aria-hidden="true">
                <Image
                  src="/assets/carta_dia/carta2.png"
                  alt=""
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 90vw, 520px"
                />
              </div>
              <div className="daily-card-heading">
                <span>◇</span>
                <h2>Acción para hoy</h2>
              </div>
              <p>{carta.AccionRecomendada}</p>
            </article>
          </section>

          <section className="daily-manifestation" aria-labelledby="manifestation-title">
            <div className="landing-section-title daily-section-title">
              <span />
              <h2 id="manifestation-title">Áreas de manifestación</h2>
              <span />
            </div>
            <div className="daily-area-grid">
              {manifestationAreas.map((area) => (
                <article className="daily-area-card" key={area.key}>
                  <span className="daily-area-icon" aria-hidden="true">
                    {area.icon}
                  </span>
                  <h3>{area.title}</h3>
                  <p>{carta[area.key]}</p>
                </article>
              ))}
            </div>
          </section>

          <article className="daily-premium-card daily-reflection-card">
            <div>
              <div className="daily-card-heading">
                <span>☽</span>
                <h2>Pregunta para reflexionar</h2>
              </div>
              <p>"{carta.PreguntaReflexion}"</p>
            </div>
          </article>

          <details className="daily-premium-card daily-shadow-card open">
            <summary>Ver aprendizaje de la sombra</summary>
            <p>{carta.Sombra}</p>
          </details>

          <div className="daily-cta-row">
            <Link href="/codex-khael" className="landing-access">
              ¿Quieres aprender más? Inscríbete en Codex Khael <span>+</span>
            </Link>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
