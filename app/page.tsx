import Image from "next/image";
import Link from "next/link";
import { LandingHeader } from "./components/landing-header";
import { BookMarked, BookOpen, Layers, Notebook, ShoppingBag, Sparkles } from "lucide-react";
import { WhatsappFloatingButton } from "./components/whatsapp-floating-button";

const landingImages = {
  hero: "/assets/landing/imagen_principal.png?v=3",
  about: "/assets/landing/fondo_hombre.png?v=3",
  star: "/assets/landing/estrella.png?v=3",
  moon: "/assets/landing/luna_fondo.png?v=3",
  sun: "/assets/landing/sol.png?v=3",
  bitacora: "/assets/landing/bitacora.png?v=3",
  bolsa: "/assets/landing/bolsa.png?v=3",
  taza: "/assets/landing/taza.png?v=3",
  tomatodo: "/assets/landing/tomatodo.png?v=3",
  vela: "/assets/landing/vela.png?v=3",
} as const;

const whatsappReadingUrl =
  "https://wa.me/51997150983?text=Hola%20Khael%2C%20quiero%20solicitar%20una%20lectura%20de%20tarot.";

const universeItems = [
  {
    title: "Lecturas",
    text: "Lecturas profundas y personalizadas para cada etapa de tu camino.",
    href: "/lecturas",
    action: "Solicitar lectura",
    Icon: Sparkles,
  },
  {
    title: "Carta del Día",
    text: "Inspiración diaria para conectar con tu guía y tu intuición.",
    href: "/carta-del-dia",
    action: "Ver carta del día",
    Icon: BookOpen,
  },
  {
    title: "Diario",
    text: "Reflexiona, organiza y observa tu evolución con claridad.",
    href: "/diario",
    action: "Ir al diario",
    Icon: Notebook,
  },
  {
    title: "Bitácora",
    text: "Registra tiradas, aprendizajes y notas para construir tu archivo.",
    href: "/bitacora",
    action: "Abrir bitácora",
    Icon: BookMarked,
  },
  {
    title: "Codex Khael",
    text: "Tu grimorio digital para estudiar, practicar y guardar memoria simbólica.",
    href: "/codex-khael",
    action: "Conocer el Codex",
    Icon: Layers,
  },
  {
    title: "Tienda",
    text: "Herramientas y objetos que acompañan tu práctica espiritual.",
    href: "#tienda",
    action: "Ver productos",
    Icon: ShoppingBag,
  },
];

const products = [
  {
    title: "Bitácora de Tarot",
    price: "$29.990 CLP",
    image: landingImages.bitacora,
  },

  {
    title: "Vela Khael Tarotista",
    price: "$7.990 CLP",
    image: landingImages.vela,
  },
  {
    title: "Taza Codex Khael",
    price: "$16.990 CLP",
    image: landingImages.taza,
  },
  {
    title: "Porta tarot Codex Khael",
    price: "$26.990 CLP",
    image: landingImages.bolsa,
  },
];

export default function HomePage() {
  return (
    <div className="landing-page">
      <LandingHeader />

      <main>
        <section className="landing-hero" id="inicio">
          <div className="landing-hero__copy">
            <p className="landing-kicker">Tarot · Estudio · Simbolismo</p>
            <h1>
              Más que cartas.
              <span>Un camino de conocimiento.</span>
            </h1>
            <div className="landing-divider" aria-hidden="true">
              ✦
            </div>
            <p className="landing-hero__lead">
              Explora el tarot con método, registra tu proceso, conecta con tu intuición y
              transforma tu práctica en claridad, comprensión y propósito.
            </p>
            <div className="landing-actions">
              <a
                className="landing-btn landing-btn--primary"
                href={whatsappReadingUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Solicitar lectura <span>+</span>
              </a>
              <Link className="landing-btn landing-btn--ghost" href="/codex-khael">
                Explorar Codex
              </Link>
              <a className="landing-btn landing-btn--ghost" href="#tienda">
                Tienda <span>♧</span>
              </a>
            </div>
          </div>

          <div className="landing-hero__visual" aria-label="Libreta, carta y vela Khael Tarotista">
            <Image
              src={landingImages.hero}
              alt="Libreta, carta de tarot y vela de Khael Tarotista"
              fill
              priority
              unoptimized
              sizes="(max-width: 768px) 100vw, 58vw"
            />
          </div>
        </section>

        <section className="landing-universe" aria-labelledby="universo-khael">
          <div className="landing-section-title">
            <span />
            <h2 id="universo-khael">El universo Khael</h2>
            <span />
          </div>

          <div className="landing-universe__grid">
            {universeItems.map((item) => (
              <article className="landing-universe-card" key={item.title}>
                <div className="landing-universe-card__icon" aria-hidden="true">
                  <item.Icon strokeWidth={1.25} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <Link href={item.href}>
                  {item.action} →
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-about" id="sobre-mi">
          <div className="landing-about__image">
            <Image
              src={landingImages.about}
              alt="Khael Tarotista escribiendo en su mesa de estudio"
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 38vw"
            />
          </div>

          <div className="landing-about__copy">
            <p className="landing-kicker">Sobre Khael</p>
            <h2>Tarotista. Estudiante. Creador de método.</h2>
            <p>
              Mi enfoque combina estudio, práctica y simbolismo. No busco predecir el futuro, sino
              comprender el presente para tomar decisiones más conscientes.
            </p>
            <Link className="landing-btn landing-btn--ghost" href="/acerca-de-mi">
              Conocer más sobre mí <span>+</span>
            </Link>
          </div>

          <div className="landing-about__points">
            <p>
              <span>✺</span> Enfoque basado en estudio y práctica
            </p>
            <p>
              <span>☿</span> Método claro, profundo y aplicable
            </p>
            <p>
              <span>♢</span> Acompañamiento honesto y humano
            </p>
          </div>
        </section>

        <section className="landing-practice" id="tienda">
          <article className="landing-daily-card">
            <div>
              <p className="landing-kicker">Carta del Día</p>
              <h2>La guía diaria que necesitas.</h2>
              <blockquote>
                “Confía en el proceso.
                <br />
                Tu luz guía el camino.”
              </blockquote>
              <Link className="landing-btn landing-btn--light" href="/carta-del-dia">
                Ver interpretación <span>+</span>
              </Link>
            </div>
            <div className="landing-daily-card__image">
              <Image
                src={landingImages.star}
                alt="Carta del día La Estrella"
                width={420}
                height={594}
                unoptimized
                sizes="(max-width: 768px) 230px, 270px"
              />
            </div>
          </article>

          <article className="landing-shop">
            <div className="landing-shop__header">
              <button type="button" aria-label="Producto anterior">
                ←
              </button>
              <h2>Herramientas para tu práctica</h2>
              <button type="button" aria-label="Producto siguiente">
                →
              </button>
            </div>
            <div className="landing-products">
              {products.map((product) => (
                <a className="landing-product" href="#contacto" key={product.title}>
                  <span className="landing-product__image">
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      unoptimized
                      sizes="160px"
                    />
                  </span>
                  <strong>{product.title}</strong>
                  {/*<small>{product.price}</small>*/}
                </a>
              ))}
            </div>
            <div className="landing-dots" aria-hidden="true">
              <span className="is-active" />
              <span />
              <span />
            </div>
          </article>
        </section>

        <section className="landing-contact" id="contacto">
          <div className="landing-contact__art">
            <Image
              src={landingImages.moon}
              alt=""
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 280px"
            />
          </div>
          <div>
            <h2>¿Dudas, consultas o colaboraciones?</h2>
            <p>Escríbeme y conversemos. Estoy aquí para acompañarte.</p>
          </div>
          <a className="landing-btn landing-btn--primary" href="mailto:hola@codexkhael.com">
            Contactar <span>+</span>
          </a>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer__brand">
          <a className="landing-brand" href="#inicio" aria-label="Khael Tarotista">
            <Image 
              src="/assets/brand/final-01.png" 
              alt="Khael Tarotista Logo" 
              width={65} 
              height={65}
              className="landing-brand-logo-img"
              style={{ objectFit: "contain" }}
            />
          </a>
          <p>Tarot · Estudio · Simbolismo</p>
          <small>© 2026 Khael Tarotista. Todos los derechos reservados.</small>
        </div>

        <div className="landing-footer__links">
          <h3>Enlaces</h3>
          <Link href="/lecturas">Lecturas</Link>
          <Link href="/carta-del-dia">Carta del día</Link>
          <Link href="/codex-khael">
            Codex Khael
          </Link>
          <Link href="/mis-lecturas/login">MIS LECTURAS</Link>
          {/* <a href="#tienda">Tienda</a> */}
          <Link href="/acerca-de-mi">Sobre mí</Link>
          {/* <a href="#contacto">Contacto</a> */}
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
          <label htmlFor="landing-email">Recibe inspiración semanal</label>
          <div className="landing-email">
            <input id="landing-email" type="email" placeholder="Tu correo electrónico" />
            <button type="button" aria-label="Enviar correo">
              →
            </button>
          </div>
        </div>

        <div className="landing-footer__sun">
          <Image src={landingImages.sun} alt="" fill unoptimized sizes="280px" />
        </div>
      </footer>
      <WhatsappFloatingButton />
    </div>
  );
}
