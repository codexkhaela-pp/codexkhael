"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Search, BookOpen, Clock, Calendar, Bookmark, Eye, Download, Share2, Library, Sparkles } from "lucide-react";
import styles from "./mis-lecturas.module.css";

// Props from Server Component
interface MisLecturasClientProps {
  readings: any[];
  availableCards: any[];
}

export default function MisLecturasClient({ readings, availableCards }: MisLecturasClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [deckFilter, setDeckFilter] = useState("Todas");
  const [orderFilter, setOrderFilter] = useState("Más recientes");

  // Calculate Summary Stats
  const stats = useMemo(() => {
    if (readings.length === 0) return null;

    const firstReadingDate = new Date(Math.min(...readings.map(r => new Date(r.readingDate).getTime())));
    const lastReadingDate = new Date(Math.max(...readings.map(r => new Date(r.readingDate).getTime())));
    
    // Most used deck
    const deckCounts: Record<string, number> = {};
    readings.forEach(r => {
      const deck = r.realDeckName || "Desconocida";
      deckCounts[deck] = (deckCounts[deck] || 0) + 1;
    });
    const mostUsedDeck = Object.keys(deckCounts).reduce((a, b) => deckCounts[a] > deckCounts[b] ? a : b, "Desconocida");

    return {
      total: readings.length,
      firstDate: firstReadingDate,
      lastDate: lastReadingDate,
      mostUsedDeck,
      mostUsedDeckCount: deckCounts[mostUsedDeck] || 0
    };
  }, [readings]);

  // Extract unique options for filters
  const uniqueCategories = ["Todas", ...Array.from(new Set(readings.map(r => r.category).filter(Boolean)))];
  const uniqueDecks = ["Todas", ...Array.from(new Set(readings.map(r => r.realDeckName).filter(Boolean)))];

  // Apply filters and sorting
  const filteredReadings = useMemo(() => {
    let result = [...readings];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(r => 
        r.title?.toLowerCase().includes(lower) || 
        r.mainQuestion?.toLowerCase().includes(lower) ||
        r.spreadDescription?.toLowerCase().includes(lower)
      );
    }

    if (categoryFilter !== "Todas") {
      result = result.filter(r => r.category === categoryFilter);
    }

    if (deckFilter !== "Todas") {
      result = result.filter(r => r.realDeckName === deckFilter);
    }

    result.sort((a, b) => {
      const dateA = new Date(a.readingDate).getTime();
      const dateB = new Date(b.readingDate).getTime();
      return orderFilter === "Más recientes" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [readings, searchTerm, categoryFilter, deckFilter, orderFilter]);

  // Helper to get category style class
  const getCategoryClass = (category: string) => {
    switch (category?.toLowerCase()) {
      case "amor": return styles.catAmor;
      case "trabajo": return styles.catTrabajo;
      case "dinero": return styles.catDinero;
      default: return "";
    }
  };

  return (
    <div className={styles.container}>
      {/* INTEGRATED HERO (REUSED FROM LECTURAS) */}
      <section className="readings-hero">
        <div className="readings-hero__copy">
          <p className="landing-kicker">MI BIBLIOTECA PRIVADA</p>
          <h1>
            Mis Lecturas
          </h1>
          <p>
            Aquí encontrarás todas las consultas realizadas con Khael Tarotista. Cada interpretación permanecerá disponible para que puedas volver a ella siempre que lo necesites.
          </p>
          <div className="landing-actions readings-actions">
            <a
              className="landing-btn landing-btn--primary"
              href="https://wa.me/51997150983?text=Hola%20Khael%2C%20quiero%20solicitar%20una%20nueva%20lectura."
              target="_blank"
              rel="noopener noreferrer"
            >
              Solicitar Nueva Lectura <span>→</span>
            </a>
            <Link className="landing-btn landing-btn--ghost" href="/">
              Conocer el proceso <span>→</span>
            </Link>
          </div>
        </div>

        <div className={`readings-hero__image ${styles.heroMask}`}>
          <Image
            src="/assets/lecturas/lecturas1.png"
            alt="Herramientas de lectura de Khael Tarotista"
            fill
            priority
            unoptimized
            sizes="(max-width: 768px) 100vw, 54vw"
          />
        </div>
      </section>

      {/* SUMMARY */}
      {stats && (
        <section className={styles.summarySection}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon}><BookOpen size={20} /></div>
            <div className={styles.summaryData}>
              <span className={styles.summaryLabel}>Lecturas realizadas</span>
              <span className={styles.summaryValue}>{stats.total}</span>
              <span className={styles.summarySub}>Consultas guardadas</span>
            </div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon}><Calendar size={20} /></div>
            <div className={styles.summaryData}>
              <span className={styles.summaryLabel}>Primera consulta</span>
              <span className={styles.summaryValue}>{format(stats.firstDate, "dd MMM yyyy", { locale: es })}</span>
            </div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon}><Clock size={20} /></div>
            <div className={styles.summaryData}>
              <span className={styles.summaryLabel}>Última consulta</span>
              <span className={styles.summaryValue}>Hace {formatDistanceToNow(stats.lastDate, { locale: es })}</span>
              <span className={styles.summarySub}>{format(stats.lastDate, "dd MMM yyyy", { locale: es })}</span>
            </div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon}><Bookmark size={20} /></div>
            <div className={styles.summaryData}>
              <span className={styles.summaryLabel}>Baraja más utilizada</span>
              <span className={styles.summaryValue}>{stats.mostUsedDeck}</span>
              <span className={styles.summarySub}>{stats.mostUsedDeckCount} lecturas</span>
            </div>
          </div>
        </section>
      )}

      {/* FILTERS */}
      {readings.length > 0 && (
        <section className={styles.filtersSection}>
          <div className={styles.filtersBar}>
            <div className={styles.searchBox}>
              <Search size={16} className={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Buscar lectura..." 
                className={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Categoría</span>
              <select className={styles.filterSelect} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Baraja</span>
              <select className={styles.filterSelect} value={deckFilter} onChange={(e) => setDeckFilter(e.target.value)}>
                {uniqueDecks.map(deck => <option key={deck} value={deck}>{deck}</option>)}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Ordenar por</span>
              <select className={styles.filterSelect} value={orderFilter} onChange={(e) => setOrderFilter(e.target.value)}>
                <option value="Más recientes">Más recientes</option>
                <option value="Más antiguas">Más antiguas</option>
              </select>
            </div>
          </div>
        </section>
      )}

      {/* LIBRARY GRID */}
      <section className={styles.librarySection}>
        {readings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '120px 20px', maxWidth: '600px', margin: '0 auto' }}>
            <span style={{ fontSize: '32px', marginBottom: '16px', display: 'block', opacity: 0.8 }}>📖</span>
            <h2 style={{ fontFamily: 'var(--font-cinzel), serif', fontSize: '1.8rem', color: '#f3ebdd', marginBottom: '16px', fontWeight: 400 }}>Tu biblioteca aún está vacía</h2>
            <p style={{ color: '#a19ba8', lineHeight: 1.6, marginBottom: '40px' }}>
              Cada consulta realizada con Khael Tarotista aparecerá aquí organizada cronológicamente para que puedas volver a consultarla cuando lo desees.
            </p>
            <a
              className="landing-btn landing-btn--primary"
              style={{ display: 'inline-flex' }}
              href="https://wa.me/51997150983?text=Hola%20Khael%2C%20quiero%20solicitar%20mi%20primera%20lectura."
              target="_blank"
              rel="noopener noreferrer"
            >
              Solicitar mi primera lectura
            </a>
          </div>
        ) : filteredReadings.length === 0 ? (
          <div className={styles.emptyState}>
            <Search size={48} className={styles.emptyIcon} style={{ opacity: 0.5, marginBottom: '20px' }} strokeWidth={1} />
            <h2 className={styles.emptyTitle}>No se encontraron lecturas</h2>
            <p className={styles.emptyText}>No hay ninguna lectura que coincida con tus filtros de búsqueda.</p>
            <button onClick={() => { setSearchTerm(""); setCategoryFilter("Todas"); setDeckFilter("Todas"); }} className={styles.btnSecondary}>
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className={styles.libraryGrid}>
            {filteredReadings.map((reading, index) => {
              // Create slight variations based on index to feel like a collection
              const rotation = index % 2 === 0 ? 9 : 11;
              const translateY = index % 3 === 0 ? 4 : (index % 3 === 1 ? -2 : 0);
              
              let imageSrc = `/assets/carta_dia/carta${(index % 7) + 1}.png`; // fallback
              if (reading.cards && reading.cards.length > 0 && reading.cards[0].visualCardId) {
                 const cardDef = availableCards.find(ac => ac.id === reading.cards[0].visualCardId);
                 if (cardDef) {
                   imageSrc = cardDef.image;
                 }
              }

              return (
                <Link key={reading.id} href={`/mis-lecturas/${reading.id}`} className={styles.readingCard}>
                  
                  {/* Decorative Background */}
                  <div className={styles.cardDeco}></div>
                  
                  {/* Subtle Watermark Symbol */}
                  <Sparkles size={160} className={styles.cardWatermark} strokeWidth={0.3} />

                  {/* Tarot Card Image */}
                  <div className={styles.cardImageWrapper} style={{ transform: `rotate(${rotation}deg) translateY(${translateY}px)` }}>
                    <Image 
                      src={imageSrc}
                      alt="Carta del Tarot"
                      fill
                    />
                  </div>

                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>{reading.title}</h3>
                    <div className={styles.cardMeta}>
                      <span>{format(new Date(reading.readingDate), "dd 'de' MMMM 'de' yyyy", { locale: es })}</span>
                      {reading.category && (
                        <>
                          <span className={styles.metaDot}>•</span>
                          <span>{reading.category}</span>
                        </>
                      )}
                      {reading.realDeckName && (
                        <>
                          <span className={styles.metaDot}>•</span>
                          <span>{reading.realDeckName}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className={styles.cardBody}>
                    <p className={styles.cardExcerpt}>
                      {reading.spreadDescription || reading.mainQuestion || "Sin interpretación disponible."}
                    </p>
                  </div>

                  <div className={styles.cardSeparator}></div>

                  <div className={styles.cardFooter}>
                    <div className={styles.cardAction}>
                      <Eye className={styles.cardActionIcon} strokeWidth={1.5} />
                      Ver lectura
                    </div>
                    <div className={styles.cardAction}>
                      <Download className={styles.cardActionIcon} strokeWidth={1.5} />
                      PDF
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
