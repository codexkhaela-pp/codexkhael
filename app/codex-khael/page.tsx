import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LandingHeader } from "../components/landing-header";

export const metadata: Metadata = {
  title: "Códex Kahel | Khael Tarotista",
  description:
    "Descubre el contenido, la experiencia y el camino de transformación dentro de Códex Kahel.",
};

const codexImages = {
  hero: "/assets/codex/codex1.png",
  content: "/assets/codex/codex2.png",
  benefit1: "/assets/codex/codex3.png",
  benefit2: "/assets/codex/codex4.png",
  benefit3: "/assets/codex/codex5.png",
  benefit4: "/assets/codex/codex11.png",
  benefit5: "/assets/codex/codex6.png",
  step1: "/assets/codex/codex7.png",
  step2: "/assets/codex/codex3.png",
  step3: "/assets/codex/codex8.png",
  step4: "/assets/codex/codex9.png",
  final: "/assets/codex/codex10.png",
  sun: "/assets/landing/sol.png?v=3",
} as const;

const codexBenefits = [
  {
    image: codexImages.benefit1,
    title: "Enseñanzas exclusivas",
    description: "Contenido profundo que no encontrarás en ningún otro lugar.",
  },
  {
    image: codexImages.benefit2,
    title: "Herramientas prácticas",
    description: "Ejercicios, rituales y técnicas para aplicar en tu día a día.",
  },
  {
    image: codexImages.benefit3,
    title: "Acceso continuo",
    description: "Nuevo contenido cada semana para tu crecimiento espiritual.",
  },
  {
    image: codexImages.benefit4,
    title: "Comunidad privada",
    description: "Conecta con personas afines en un espacio seguro y sagrado.",
  },
  {
    image: codexImages.benefit5,
    title: "Transformación real",
    description: "Eleva tu energía, tu intuición y vive con propósito.",
  },
];

const journeySteps = [
  {
    image: codexImages.step1,
    number: "1.",
    title: "Accede",
    description: "Únete y recibe acceso inmediato a todo el contenido.",
  },
  {
    image: codexImages.step2,
    number: "2.",
    title: "Aprende",
    description: "Explora enseñanzas profundas y aplica las herramientas.",
  },
  {
    image: codexImages.step3,
    number: "3.",
    title: "Integra",
    description: "Pon en práctica, transforma tu energía y eleva tu conciencia.",
  },
  {
    image: codexImages.step4,
    number: "4.",
    title: "Trasciende",
    description: "Vive con propósito, claridad y conexión espiritual.",
  },
];

const faqs = [
  {
    question: "¿Qué incluye la suscripción?",
    answer:
      "Acceso a enseñanzas, prácticas guiadas, material descargable y nuevos recursos que se irán sumando dentro del Códex.",
  },
  {
    question: "¿Puedo avanzar a mi propio ritmo?",
    answer:
      "Sí. El Códex está pensado para que estudies, practiques e integres cada contenido según tu momento y tu proceso.",
  },
  {
    question: "¿Necesito experiencia previa en tarot?",
    answer:
      "No. Encontrarás contenido útil tanto si estás comenzando como si ya tienes recorrido y quieres profundizar con estructura.",
  },
];

export default function CodexKhaelPage() {
  return (
    <div className="landing-page codex-page">
      <LandingHeader />

      <main>
        <section className="codex-hero" id="el-codex" aria-labelledby="codex-hero-title">
          <div className="codex-hero__visual" aria-hidden="true">
            <Image
              src={codexImages.hero}
              alt=""
              fill
              priority
              unoptimized
              sizes="(max-width: 768px) 100vw, 62vw"
            />
          </div>

          <div className="codex-hero__copy">
            <p className="codex-hero__eyebrow">Bienvenido a</p>
            <h1 id="codex-hero-title">Códex Kahel</h1>
            <p className="codex-hero__subhead">
              El conocimiento oculto.
              <span>La sabiduría que transforma.</span>
            </p>
            <div className="codex-hero__divider" aria-hidden="true">
              <i />
              <span>✦</span>
              <i />
            </div>
            <p className="codex-hero__lead">
              Códex Kahel no es solo una suscripción, es tu acceso a enseñanzas profundas,
              herramientas prácticas y secretos que te llevarán al siguiente nivel espiritual.
            </p>

            <div className="codex-hero__actions">
              <Link className="landing-btn landing-btn--primary" href="/suscribete">
                Suscribirme <span>✦</span>
              </Link>
              <Link className="landing-btn landing-btn--ghost" href="/login" prefetch={false}>
                Acceso al Codex <span>+</span>
              </Link>
            </div>

            <p className="codex-hero__note">Acceso exclusivo para miembros</p>
          </div>
        </section>

        <section className="codex-benefits" id="beneficios" aria-labelledby="codex-benefits-title">
          <h2 id="codex-benefits-title" className="sr-only">
            Beneficios del Códex
          </h2>
          <div className="codex-benefits__panel">
            {codexBenefits.map((item) => (
              <article className="codex-benefit-card" key={item.title}>
                <div className="codex-benefit-card__icon" aria-hidden="true">
                  <Image src={item.image} alt="" width={72} height={72} unoptimized sizes="72px" />
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="codex-content" id="contenido" aria-labelledby="codex-content-title">
          <div className="codex-content__copy">
            <h2 id="codex-content-title">¿Qué es Códex Kahel?</h2>
            <div className="codex-content__divider" aria-hidden="true">
              <i />
              <span>✦</span>
            </div>
            <p>
              Es la biblioteca secreta de Khael Tarotista. Un espacio donde la sabiduría ancestral
              y moderna se unen para guiarte en tu despertar, ayudarte a entender el universo y a
              ti mismo, y darte las herramientas para crear la vida que realmente deseas.
            </p>
            <ul className="codex-content__list">
              <li>Contenido en video y escrito</li>
              <li>Descargables exclusivos</li>
              <li>Rituales, meditaciones y prácticas</li>
              <li>Lecturas de tarot profundas</li>
              <li>Y mucho más...</li>
            </ul>
          </div>

          <div className="codex-content__visual" aria-hidden="true">
            <Image
              src={codexImages.content}
              alt=""
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 48vw"
            />
          </div>
        </section>

        <section className="codex-journey" aria-labelledby="codex-journey-title">
          <div className="codex-journey__panel">
            <h2 id="codex-journey-title">Tu camino de transformación</h2>
            <div className="codex-journey__grid">
              {journeySteps.map((step) => (
                <article className="codex-journey-step" key={step.title}>
                  <div className="codex-journey-step__top">
                    <span>{step.number}</span>
                    <div className="codex-journey-step__icon" aria-hidden="true">
                      <Image src={step.image} alt="" width={72} height={72} unoptimized sizes="72px" />
                    </div>
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="codex-faq" id="preguntas" aria-labelledby="codex-faq-title">
          <div className="landing-section-title codex-section-title">
            <span />
            <h2 id="codex-faq-title">Preguntas frecuentes</h2>
            <span />
          </div>

          <div className="codex-faq__list">
            {faqs.map((item) => (
              <details className="codex-faq__item" key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="codex-final" id="suscribirme" aria-labelledby="codex-final-title">
          <div className="codex-final__visual" aria-hidden="true">
            <Image
              src={codexImages.final}
              alt=""
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 100vw"
            />
          </div>
          <div className="codex-final__copy">
            <h2 id="codex-final-title">Estás listo para elevar tu camino.</h2>
            <p>
              El conocimiento te llama. La transformación te espera. Únete a Códex Kahel y
              descubre tu verdadero poder.
            </p>
            <Link className="landing-btn landing-btn--primary" href="/suscribete">
              Suscribirme ahora <span>✦</span>
            </Link>
            <small>Acceso inmediato · Cancela cuando quieras</small>
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
          <label htmlFor="codex-email">Recibe inspiración semanal</label>
          <div className="landing-email">
            <input id="codex-email" type="email" placeholder="Tu correo electrónico" />
            <button type="button" aria-label="Enviar correo">
              →
            </button>
          </div>
        </div>

        <div className="landing-footer__sun">
          <Image src={codexImages.sun} alt="" fill unoptimized sizes="280px" />
        </div>
      </footer>
    </div>
  );
}
