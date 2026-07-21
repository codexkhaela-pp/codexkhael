"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Compass, Download, Share2, ArrowRight, Sun } from "lucide-react";
import styles from "./viewer.module.css";

type PublicCardData = {
  id: string;
  visualCardId: string | null;
  cardName: string;
  positionName: string | null;
  interpretation: string | null;
  x: number;
  y: number;
  rotation: number;
  relativeScale: number;
  zIndex: number;
};

export function ClientReadingViewer({ 
  reading, 
  cards, 
  availableCards, 
  user 
}: { 
  reading: any, 
  cards: PublicCardData[], 
  availableCards: any[],
  user: any
}) {
  const [activeSection, setActiveSection] = useState('pregunta');
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const isScrollingRef = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isScrollingRef.current) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -40% 0px', threshold: 0 }
    );

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    isScrollingRef.current = true;
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setTimeout(() => {
      isScrollingRef.current = false;
    }, 1000); // Wait for smooth scroll to finish before enabling observer again
  };

  const formattedDate = new Date(reading.readingDate).toLocaleDateString("es-ES", { 
    year: 'numeric', month: 'long', day: 'numeric' 
  });

  return (
    <div className={styles.pageContainer}>
      
      {/* HEADER */}
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <Compass size={32} className={styles.brandLogo} strokeWidth={1} />
          <div className={styles.brandText}>
            <span className={styles.brandName}>KHAEL</span>
            <span className={styles.brandSubtitle}>TAROTISTA</span>
          </div>
        </Link>

        <div className={styles.userNav}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {user.name ? user.name.substring(0, 2).toUpperCase() : user.email.substring(0, 2).toUpperCase()}
            </div>
            <div className={styles.userDetails}>
              <span className={styles.userWelcome}>Bienvenido,</span>
              <span className={styles.userName}>{user.name || "Usuario"}</span>
              <span className={styles.userEmail}>{user.email}</span>
            </div>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className={styles.logoutBtn}>
              Cerrar Sesión <ArrowRight size={14} />
            </button>
          </form>
        </div>
      </header>

      {/* MAIN BODY */}
      <div className={styles.mainLayout}>
        
        {/* SIDEBAR NAVIGATION */}
        <aside className={styles.sidebar}>
          <span className={styles.sidebarTitle}>Navegación</span>
          
          <ul className={styles.navIndex}>
            {reading.mainQuestion && (
              <li>
                <a 
                  href="#pregunta" 
                  onClick={(e) => { e.preventDefault(); scrollToSection('pregunta'); }}
                  className={`${styles.navItem} ${activeSection === 'pregunta' ? styles.active : ''}`}
                >
                  <span className={styles.navDiamond}>✧</span> Pregunta
                </a>
              </li>
            )}
            
            <li>
              <a 
                href="#tirada" 
                onClick={(e) => { e.preventDefault(); scrollToSection('tirada'); }}
                className={`${styles.navItem} ${activeSection === 'tirada' ? styles.active : ''}`}
              >
                <span className={styles.navDiamond}>✧</span> Tirada
              </a>
            </li>

            {reading.spreadDescription && (
              <li>
                <a 
                  href="#interpretacion" 
                  onClick={(e) => { e.preventDefault(); scrollToSection('interpretacion'); }}
                  className={`${styles.navItem} ${activeSection === 'interpretacion' ? styles.active : ''}`}
                >
                  <span className={styles.navDiamond}>✧</span> Interpretación General
                </a>
              </li>
            )}

            {cards.map((c, i) => {
              const isInverted = c.rotation > 90 || c.rotation < -90;
              return (
                <li key={`nav-pos-${i}`}>
                  <a 
                    href={`#posicion-${i}`} 
                    onClick={(e) => { e.preventDefault(); scrollToSection(`posicion-${i}`); }}
                    className={`${styles.navItem} ${activeSection === `posicion-${i}` ? styles.active : ''}`}
                    style={{ alignItems: "flex-start" }}
                  >
                    <span className={styles.navDiamond} style={{ marginTop: "5px" }}>✧</span> 
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ lineHeight: 1.2 }}>{i + 1}. {c.positionName || `Posición ${i + 1}`}</span>
                      <span style={{ fontSize: "0.8em", opacity: 0.7, lineHeight: 1.2 }}>
                        {c.cardName}{isInverted ? ' (Invertida)' : ''}
                      </span>
                    </div>
                  </a>
                </li>
              );
            })}

            <li>
              <a 
                href="#conclusion" 
                onClick={(e) => { e.preventDefault(); scrollToSection('conclusion'); }}
                className={`${styles.navItem} ${activeSection === 'conclusion' ? styles.active : ''}`}
              >
                <span className={styles.navDiamond}>✧</span> Conclusión Final
              </a>
            </li>
          </ul>

          <div className={styles.sidebarFooter}>
            <Compass size={32} strokeWidth={0.5} />
          </div>
        </aside>

        {/* CONTENT */}
        <main className={styles.contentArea}>
          <div className={styles.contentWrapper}>
            
            {/* HERO */}
            <section className={styles.heroSection}>
              <div className={styles.heroSupertitle}>
                <span className={styles.ornament}>— ✧ —</span>
                LECTURA PERSONALIZADA
                <span className={styles.ornament}>— ✧ —</span>
              </div>
              <h1 className={styles.heroTitle}>{reading.title}</h1>
              
              <div className={styles.heroMetadata}>
                <div className={styles.metaItem}>📅 {formattedDate}</div>
                <span className={styles.ornament}>✧</span>
                <div className={styles.metaItem}>🃏 Rider Waite</div>
                <span className={styles.ornament}>✧</span>
                <div className={styles.metaItem}>📄 {cards.length} cartas</div>
              </div>
            </section>

            {/* PREGUNTA */}
            {reading.mainQuestion && (
              <section 
                id="pregunta" 
                className={styles.questionSection}
                ref={(el) => { sectionRefs.current['pregunta'] = el; }}
              >
                <span className={styles.sectionLabel}>PREGUNTA DEL CONSULTANTE</span>
                <div className={styles.questionText}>
                  <span className={styles.quoteMark} style={{ top: "-10px", left: "-35px" }}>“</span>
                  {reading.mainQuestion}
                  <span className={styles.quoteMark} style={{ bottom: "-30px", right: "-35px" }}>”</span>
                </div>
              </section>
            )}

            {/* TIRADA */}
            <section 
              id="tirada" 
              className={styles.spreadSection}
              ref={(el) => { sectionRefs.current['tirada'] = el; }}
            >
              <span className={styles.sectionLabel}>TIRADA</span>
              <div className={styles.canvasWrapper}>
                <div className={styles.canvasTexture} />
                <div className={styles.canvasContainer}>
                  {cards.map(card => {
                    const cardDef = availableCards.find(ac => ac.id === card.visualCardId);
                    const imageSrc = cardDef ? cardDef.image : "/assets/cards/back.jpg";
                    return (
                      <div 
                        key={card.id}
                        className={styles.cardSlot}
                        style={{
                          left: `${card.x}%`,
                          top: `${card.y}%`,
                          transform: `translate(-50%, -50%) rotate(${card.rotation}deg) scale(${card.relativeScale})`,
                          zIndex: card.zIndex,
                          backgroundImage: `url(${imageSrc})`
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </section>

            {/* INTERPRETACIÓN GENERAL */}
            {reading.spreadDescription && (
              <section 
                id="interpretacion" 
                className={styles.interpretationSection}
                ref={(el) => { sectionRefs.current['interpretacion'] = el; }}
              >
                <span className={styles.mainSectionTitle}>— ✧ — INTERPRETACIÓN GENERAL — ✧ —</span>
                <div className={styles.editorialText}>
                  {reading.spreadDescription.split('\n')
                    .filter((paragraph: string) => paragraph.trim() !== '')
                    .map((paragraph: string, idx: number) => (
                      <p key={idx}>{paragraph}</p>
                  ))}
                </div>
              </section>
            )}

            {/* DETALLE DE POSICIONES */}
            <section className={styles.positionsSection}>
              <span className={styles.mainSectionTitle}>— ✧ — DETALLE DE CADA POSICIÓN — ✧ —</span>
              
              <div className={styles.positionsList}>
                {cards.map((card, i) => {
                  const cardDef = availableCards.find(ac => ac.id === card.visualCardId);
                  const imageSrc = cardDef ? cardDef.image : "/assets/cards/back.jpg";
                  const isInverted = card.rotation > 90 || card.rotation < -90;
                  
                  return (
                    <div 
                      id={`posicion-${i}`}
                      key={`pos-${i}`} 
                      className={styles.positionBlock}
                      ref={(el) => { sectionRefs.current[`posicion-${i}`] = el; }}
                    >
                      <img 
                        src={imageSrc} 
                        alt={card.cardName} 
                        className={styles.positionCardImage} 
                        style={{ transform: `rotate(${card.rotation}deg)` }}
                      />
                      
                      <div className={styles.positionContent}>
                        <div className={styles.positionLabel}>POSICIÓN {i + 1}</div>
                        {card.positionName && card.positionName.trim().toLowerCase() !== `posición ${i + 1}` && (
                          <div className={styles.positionFunction}>{card.positionName}</div>
                        )}
                        <h3 className={styles.positionCardName}>{card.cardName}{isInverted ? ' (Invertida)' : ''}</h3>
                        
                        <div className={styles.editorialText}>
                          {card.interpretation ? (
                            card.interpretation.split('\n')
                              .filter((p: string) => p.trim() !== '')
                              .map((p: string, idx: number) => <p key={idx}>{p}</p>)
                          ) : (
                            <p style={{ fontStyle: 'italic', opacity: 0.6 }}>Esta posición habla por sí sola dentro de la lectura general.</p>
                          )}
                        </div>
                      </div>

                      {/* Mystical watermark icon */}
                      <svg viewBox="0 0 100 100" className={styles.positionWatermark} fill="none" stroke="currentColor" strokeWidth="1">
                        <circle cx="50" cy="50" r="40" />
                        <path d="M10,50 Q50,10 90,50 Q50,90 10,50" />
                        <circle cx="50" cy="50" r="10" />
                      </svg>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* CONCLUSIÓN FINAL */}
            <section 
              id="conclusion" 
              className={styles.conclusionSection}
              style={{ paddingBottom: '40vh' }}
              ref={(el) => { sectionRefs.current['conclusion'] = el; }}
            >
              <span className={styles.mainSectionTitle}>— ✧ — CONCLUSIÓN FINAL — ✧ —</span>
              <div className={styles.conclusionBlock}>
                <Sun size={48} strokeWidth={1} className={styles.conclusionIcon} />
                <div className={styles.conclusionText}>
                  {reading.spreadDescription ? 
                    "Esta lectura te muestra un camino de transformación profunda. A pesar de las dudas y miedos iniciales, el tarot confirma que estás construyendo algo sólido y duradero. Confía en tu visión, protege tu energía y sigue avanzando con estrategia."
                  : 
                    "Toda lectura es una guía temporal. Usa esta sabiduría para iluminar tus próximos pasos."}
                </div>
                <span className={styles.conclusionQuote}>”</span>
              </div>
            </section>

            {/* BOTTOM ACTIONS */}
            <div className={styles.actionsBar}>
              <Link href="/mis-lecturas" className={`${styles.btnAction} ${styles.btnActionTransparent}`}>
                ← Volver a Mis Lecturas
              </Link>
              
              <button className={`${styles.btnAction} ${styles.btnActionSolid}`}>
                <Download size={16} /> Descargar PDF
              </button>
              
              <Link href="/mis-lecturas" className={`${styles.btnAction} ${styles.btnActionTransparent}`}>
                Nueva Consulta →
              </Link>
            </div>

          </div>
        </main>
      </div>

    </div>
  );
}
