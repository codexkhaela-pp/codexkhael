import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Eye, Gem, Search, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Lecturas | Khael Tarotista",
  description: "Lecturas personalizadas de tarot enfocadas en claridad, reflexion y comprension.",
};

const readingImages = {
  hero: "/assets/lecturas/lecturas1.png",
  about: "/assets/lecturas/lecturas2.png",
  cta: "/assets/lecturas/lecturas7.png",
  sun: "/assets/lecturas/lecturas11.png",
  sun2: "/assets/landing/sol.png?v=3",
} as const;

const whatsappReadingUrl =
  "https://wa.me/51997150983?text=Hola%20Khael%2C%20quiero%20solicitar%20una%20lectura%20de%20tarot.";

const readingTypes = [
  {
    title: "Lectura general",
    description: "Ideal cuando necesitas una visión amplia de tu situación actual.",
    image: "/assets/lecturas/lecturas3.png",
  },
  {
    title: "Lectura relacional",
    description: "Explora dinámicas afectivas, vínculos y patrones de relación.",
    image: "/assets/lecturas/lecturas4.png",
  },
  {
    title: "Lectura de decisión",
    description: "Aporta claridad cuando existen varias alternativas o caminos posibles.",
    image: "/assets/lecturas/lecturas5.png",
  },
  {
    title: "Lectura de profundización",
    description: "Análisis más detallado para comprender procesos complejos o recurrentes.",
    image: "/assets/lecturas/lecturas6.png",
  },
];

const processSteps = [
  {
    title: "Solicitas tu lectura",
    description: "Eliges el tipo de lectura que necesitas.",
    image: "/assets/lecturas/lecturas8.png",
  },
  {
    title: "Definimos el enfoque",
    description: "Conversamos tu situación y tu intención.",
    image: "/assets/lecturas/lecturas9.png",
  },
  {
    title: "Realizo el análisis e interpretación",
    description: "Lectura profunda con método, símbolos y claridad.",
    image: "/assets/lecturas/lecturas10.png",
  },
  {
    title: "Recibes tu lectura y recomendaciones",
    description: "Recibes tu reporte con guía, reflexiones y próximos pasos.",
    image: "/assets/lecturas/lecturas11.png",
  },
];

const benefits = [
  { label: "Interpretación personalizada", Icon: Eye },
  { label: "Enfoque claro y estructurado", Icon: Sparkles },
  { label: "Explicación comprensible", Icon: BookOpen },
  { label: "Espacio para tu reflexión", Icon: Search },
  { label: "Material para tu consulta posterior", Icon: Gem },
];

export default function LecturasPage() {
  return (
    <div className="landing-page readings-page">
      <header className="landing-header">
        <Link className="landing-brand" href="/" aria-label="Khael Tarotista">
          <span className="landing-brand__seal" aria-hidden="true">
            ✦
          </span>
          <span className="landing-brand__text">
            <strong>Khael</strong>
            <span>Tarotista</span>
          </span>
        </Link>

        <nav className="landing-nav" aria-label="Navegacion principal">
          <Link href="/">Inicio</Link>
          <Link className="is-active" href="/lecturas">
            Lecturas
          </Link>
          <Link href="/carta-del-dia">Carta del Dia</Link>
          <Link href="/codex-khael">
            Codex Khael
          </Link>
          {/* <Link href="/#tienda">Tienda</Link> */}
          <Link href="/acerca-de-mi">Sobre mi</Link>
          {/* <Link href="/#contacto">Contacto</Link> */}
        </nav>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Link className="landing-access" href="/mis-lecturas/login" prefetch={false} style={{ background: 'transparent', borderColor: 'rgba(215, 173, 105, 0.4)' }}>
            Mis Lecturas <span>+</span>
          </Link>
          <Link className="landing-access" href="/login" prefetch={false}>
            Acceso a Codex <span>+</span>
          </Link>
        </div>
      </header>

      <main>
        <section className="readings-hero" id="inicio">
          <div className="readings-hero__copy">
            <p className="landing-kicker">Lecturas personalizadas</p>
            <h1>
              Cada consulta es un espacio
              <br />
              para comprender, reflexionar
              <br />y{" "}
              <span>encontrar claridad.</span>
            </h1>
            <p>
              Mis lecturas combinan tarot, simbolismo y metodo para ayudarte a observar tu situacion
              desde una perspectiva mas amplia y consciente.
            </p>
            <div className="landing-actions readings-actions">
              <a
                className="landing-btn landing-btn--primary"
                href={whatsappReadingUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Solicitar lectura <span>→</span>
              </a>
              <a className="landing-btn landing-btn--ghost" href="#proceso">
                Conocer el proceso <span>→</span>
              </a>
            </div>
          </div>

          <div className="readings-hero__image">
            <Image
              src={readingImages.hero}
              alt="Herramientas de lectura de Khael Tarotista"
              fill
              priority
              unoptimized
              sizes="(max-width: 768px) 100vw, 54vw"
            />
          </div>
        </section>

        <section className="readings-types" aria-labelledby="tipos-lectura">
          <div className="landing-section-title readings-section-title">
            <span />
            <h2 id="tipos-lectura">Tipos de lectura</h2>
            <span />
          </div>

          <div className="readings-type-grid">
            {readingTypes.map((item) => (
              <article className="readings-type-card" key={item.title}>
                <div className="readings-type-card__image" aria-hidden="true">
                  <Image
                    src={item.image}
                    alt=""
                    width={180}
                    height={180}
                    unoptimized
                    sizes="120px"
                  />
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <a href={whatsappReadingUrl} target="_blank" rel="noopener noreferrer">
                  Solicitar esta lectura <ArrowRight size={14} />
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="readings-method" aria-labelledby="metodo-lecturas">
          <div className="readings-method__image">
            <Image
              src={readingImages.about}
              alt="Khael preparando una lectura"
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 38vw"
            />
          </div>

          <div className="readings-method__copy">
            <p className="landing-kicker">Mi método</p>
            <h2 id="metodo-lecturas">Más allá de la predicción.</h2>
            <p>No utilizo el tarot para imponer respuestas absolutas.</p>
            <p>
              Mi enfoque busca ayudarte a comprender mejor tu realidad, identificar patrones,
              reconocer posibilidades y tomar decisiones más conscientes y alineadas con tu
              propósito.
            </p>
          </div>
        </section>

        <section className="readings-process" id="proceso" aria-labelledby="como-funciona">
          <div className="landing-section-title readings-process-title">
            <span />
            <h2 id="como-funciona">¿Cómo funciona?</h2>
            <span />
          </div>

          <div className="readings-timeline">
            {processSteps.map((step, index) => (
              <article className="readings-step" key={step.title}>
                <span>{index + 1}</span>
                <div className="readings-step__image" aria-hidden="true">
                  <Image
                    src={step.image}
                    alt=""
                    width={126}
                    height={126}
                    unoptimized
                    sizes="88px"
                  />
                </div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="readings-benefits" aria-labelledby="que-recibes">
          <div className="landing-section-title readings-benefits-title">
            <span />
            <h2 id="que-recibes">¿Qué recibes en tu lectura?</h2>
            <span />
          </div>

          <div className="readings-benefit-grid">
            {benefits.map((benefit) => (
              <article className="readings-benefit" key={benefit.label}>
                <benefit.Icon aria-hidden="true" strokeWidth={1.4} />
                <p>{benefit.label}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="readings-final-cta">
          <div className="readings-final-cta__art">
            <Image src={readingImages.cta} alt="" fill unoptimized sizes="280px" />
          </div>
          <div>
            <h2>Listo para comenzar?</h2>
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
            <span className="landing-brand__seal" aria-hidden="true">
              ✦
            </span>
            <span className="landing-brand__text">
              <strong>Khael</strong>
              <span>Tarotista</span>
            </span>
          </Link>
          <p>Tarot · Estudio · Simbolismo</p>
          <small>© 2026 Khael Tarotista. Todos los derechos reservados.</small>
        </div>

        <div className="landing-footer__links">
          <h3>Enlaces</h3>
          <Link href="/lecturas">Lecturas</Link>
          <Link href="/carta-del-dia">Carta del dia</Link>
          <Link href="/codex-khael">
            Codex Khael
          </Link>
          <Link href="/mis-lecturas/login">MIS LECTURAS</Link>
          {/* <Link href="/#tienda">Tienda</Link> */}
          <Link href="/acerca-de-mi">Sobre mi</Link>
          {/* <Link href="/#contacto">Contacto</Link> */}
        </div>

        <div className="landing-footer__newsletter">
          <h3>Sígueme</h3>
          <div className="landing-socials" aria-label="Redes sociales">
            <a href="mailto:hola@codexkhael.com">◎</a>
            <a href="mailto:hola@codexkhael.com">♪</a>
            <a href="mailto:hola@codexkhael.com">▶</a>
            <a href="mailto:hola@codexkhael.com">✉</a>
          </div>
          <label htmlFor="lecturas-email">Recibe inspiracion semanal</label>
          <div className="landing-email">
            <input id="lecturas-email" type="email" placeholder="Tu correo electronico" />
            <button type="button" aria-label="Enviar correo">
              →
            </button>
          </div>
        </div>

        <div className="landing-footer__sun">
          <Image src={readingImages.sun2} alt="" fill unoptimized sizes="280px" />
        </div>
      </footer>
    </div>
  );
}
