import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LandingHeader } from "../components/landing-header";
import { ArrowRight, BookOpen, Compass, Ear, Eye, Heart, Sparkles } from "lucide-react";
import { WhatsappFloatingButton } from "../components/whatsapp-floating-button";

export const metadata: Metadata = {
  title: "Acerca de mí | Khael Tarotista",
  description: "Conoce el camino, el propósito y la visión de Khael Tarotista.",
};

const aboutImages = {
  hero: "/assets/acerca_de_mi/acerca_de_mi.png",
  approach: "/assets/acerca_de_mi/acerca_de_mi_2.png",
  cta: "/assets/lecturas/lecturas7.png",
  sun: "/assets/landing/sol.png?v=3",
} as const;

const whatsappReadingUrl =
  "https://wa.me/51997150983?text=Hola%20Khael%2C%20quiero%20solicitar%20una%20lectura%20de%20tarot.";

export default function AcercaDeMiPage() {
  return (
    <div className="landing-page about-me-page">
      <LandingHeader />

      <main>
        <section className="about-hero" aria-labelledby="about-hero-title">
          <div className="about-hero__copy">
            <p className="about-hero__eyebrow">✦ SOBRE MÍ ✦</p>
            <h1 id="about-hero-title">
              Conoce mi camino,
              <span>mi propósito y mi visión.</span>
            </h1>
            <div className="landing-divider" aria-hidden="true">
              ✦
            </div>
            <p className="about-hero__lead">
              El tarot no es solo un conjunto de cartas, es un lenguaje simbólico que nos conecta
              con nuestra verdad más profunda.
            </p>
            <p className="about-hero__lead">
              Mi misión es ayudarte a comprender tu realidad, tomar decisiones conscientes y
              caminar tu propio destino con claridad.
            </p>
            <div className="landing-actions about-hero__actions">
              <a className="landing-btn landing-btn--primary" href="#enfoque">
                Conoce mi enfoque <span>→</span>
              </a>
            </div>
          </div>

          <div className="about-hero__visual">
            <Image
              src={aboutImages.hero}
              alt="Khael Tarotista en su espacio de lectura y estudio"
              fill
              priority
              unoptimized
              sizes="(max-width: 768px) 100vw, 58vw"
            />
          </div>
        </section>

        <section className="about-manifesto" id="enfoque" aria-labelledby="about-manifesto-title">
          <div className="about-manifesto__panel">
            <div className="about-manifesto__left">
              <article className="about-statement">
                <div className="about-statement__heading">
                  <span className="about-statement__icon" aria-hidden="true">
                    <Sparkles strokeWidth={1.7} />
                  </span>
                  <h2 id="about-manifesto-title">Mi misión</h2>
                </div>
                <p>
                  Acompañarte a través del tarot y el simbolismo para que encuentres respuestas,
                  claridad y dirección en tu vida.
                </p>
              </article>

              <article className="about-statement">
                <div className="about-statement__heading">
                  <span className="about-statement__icon" aria-hidden="true">
                    <Eye strokeWidth={1.7} />
                  </span>
                  <h2>Mi visión</h2>
                </div>
                <p>
                  Crear una comunidad consciente que use el conocimiento como herramienta para
                  transformar su realidad.
                </p>
              </article>
            </div>

            <div className="about-manifesto__divider" aria-hidden="true" />

            <div className="about-manifesto__right">
              <div className="about-values-heading">
                <span aria-hidden="true">+</span>
                <h3>Mis valores</h3>
              </div>

              <div className="about-values-list">
                <article className="about-value-item">
                  <span className="about-value-item__icon" aria-hidden="true">
                    <Sparkles strokeWidth={1.7} />
                  </span>
                  <div>
                    <h4>Honestidad</h4>
                    <p>Lecturas claras y sinceras, sin endulzar verdades.</p>
                  </div>
                </article>

                <article className="about-value-item">
                  <span className="about-value-item__icon" aria-hidden="true">
                    <Heart strokeWidth={1.7} />
                  </span>
                  <div>
                    <h4>Respeto</h4>
                    <p>Tu proceso es único y merece ser honrado.</p>
                  </div>
                </article>

                <article className="about-value-item">
                  <span className="about-value-item__icon" aria-hidden="true">
                    <BookOpen strokeWidth={1.7} />
                  </span>
                  <div>
                    <h4>Profundidad</h4>
                    <p>Exploramos más allá de lo evidente.</p>
                  </div>
                </article>

                <article className="about-value-item">
                  <span className="about-value-item__icon" aria-hidden="true">
                    <Compass strokeWidth={1.7} />
                  </span>
                  <div>
                    <h4>Compromiso</h4>
                    <p>Estoy aquí para guiarte en tu evolución.</p>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="about-approach" aria-labelledby="about-approach-title">
          <div className="about-approach__panel">
            <div className="about-approach__visual">
              <div className="about-approach__image">
                <Image
                  src={aboutImages.approach}
                  alt="Bitácora, vela y cartas en el espacio de estudio de Khael Tarotista"
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 42vw"
                />
              </div>
            </div>

            <div className="about-approach__content">
              <p className="about-approach__eyebrow">Mi enfoque <span>+</span></p>
              <h2 id="about-approach-title">
                Más que predicciones,
                <span>una guía para tu evolución.</span>
              </h2>
              <div className="about-approach__divider" aria-hidden="true">
                <span>✦</span>
                <i />
              </div>
              <p className="about-approach__lead">
                No utilizo el tarot para imponerte un destino, sino para ayudarte a comprender las
                energías que te rodean y las decisiones que te acercan a tu mejor versión.
              </p>

              <div className="about-approach__features">
                <article className="about-approach__feature">
                  <span className="about-approach__feature-icon" aria-hidden="true">
                    <Ear strokeWidth={1.65} />
                  </span>
                  <h3>Escucha profunda</h3>
                  <p>Cada lectura comienza con empatía y conexión.</p>
                </article>

                <article className="about-approach__feature">
                  <span className="about-approach__feature-icon" aria-hidden="true">
                    <Compass strokeWidth={1.65} />
                  </span>
                  <h3>Análisis simbólico</h3>
                  <p>Interpreto los símbolos para revelar el mensaje esencial.</p>
                </article>

                <article className="about-approach__feature">
                  <span className="about-approach__feature-icon" aria-hidden="true">
                    <Sparkles strokeWidth={1.65} />
                  </span>
                  <h3>Acción consciente</h3>
                  <p>Te entrego herramientas claras para avanzar con seguridad.</p>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="readings-final-cta about-final-cta" aria-labelledby="about-final-cta-title">
          <div className="readings-final-cta__art">
            <Image src={aboutImages.cta} alt="" fill unoptimized sizes="280px" />
          </div>
          <div>
            <h2 id="about-final-cta-title">Listo para comenzar?</h2>
            <p>
              Cada lectura es una oportunidad para observar tu realidad con mas claridad y
              profundidad.
            </p>
          </div>
          <div className="readings-final-cta__actions">
            <a
              className="landing-btn landing-btn--primary"
              href={whatsappReadingUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Solicitar lectura <ArrowRight size={15} />
            </a>
            <a className="landing-btn landing-btn--ghost" href="mailto:hola@codexkhael.com">
              Contactar <ArrowRight size={15} />
            </a>
          </div>
        </section>
      </main>

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
          <Link href="/codex-khael">Codex Khael</Link>
          <Link href="/mis-lecturas/login">MIS LECTURAS</Link>
          {/* <Link href="/#tienda">Tienda</Link> */}
          <Link href="/acerca-de-mi">Sobre mí</Link>
          {/* <Link href="/#contacto">Contacto</Link> */}
        </div>

        <div className="landing-footer__newsletter">
          <h3>Sígueme</h3>
          <div className="landing-socials" aria-label="Redes sociales">
            <a href="https://www.instagram.com/khael.tarotista?igsh=ZDh0a2x3ZHpwN2k4&utm_source=qr" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
              </svg>
            </a>
          </div>
          <label htmlFor="acerca-mi-email">Recibe inspiración semanal</label>
          <div className="landing-email">
            <input id="acerca-mi-email" type="email" placeholder="Tu correo electrónico" />
            <button type="button" aria-label="Enviar correo">
              →
            </button>
          </div>
        </div>

        <div className="landing-footer__sun">
          <Image src={aboutImages.sun} alt="" fill unoptimized sizes="280px" />
        </div>
      </footer>
      <WhatsappFloatingButton />
    </div>
  );
}
