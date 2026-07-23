"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { format, isThisMonth } from "date-fns";
import { es } from "date-fns/locale";
import { Search, Eye, FilterX, Users, BookOpen, Calendar as CalendarIcon, Sparkles, BookCopy, MoreVertical } from "lucide-react";
import styles from "./lecturas-premium.module.css";

type Reading = {
  id: string;
  clientName: string | null;
  clientEmail: string | null;
  title: string;
  category: string | null;
  mainQuestion: string;
  spreadType: string;
  customSpreadName: string | null;
  totalCards: number;
  readingDate: Date;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "CANCELLED";
  client?: {
    phone: string | null;
  } | null;
};

type Props = {
  readings: Reading[];
};

export function ClientReadingsManager({ readings }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [spreadFilter, setSpreadFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL"); // ALL, TODAY, THIS_WEEK, THIS_MONTH, LAST_MONTH
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Extract unique categories and spreads for filters
  const categories = useMemo(() => {
    const cats = new Set(readings.map(r => r.category).filter(Boolean));
    return Array.from(cats) as string[];
  }, [readings]);

  const spreadTypes = useMemo(() => {
    const spreads = new Set(readings.map(r => r.customSpreadName || r.spreadType).filter(Boolean));
    return Array.from(spreads) as string[];
  }, [readings]);

  // Calculations for KPIs (must use all readings, not filtered ones)
  const kpis = useMemo(() => {
    // 1. Unique Clients
    const clientMap = new Map();
    readings.forEach(r => {
      const key = r.clientEmail ? r.clientEmail.toLowerCase() : r.clientName?.toLowerCase() || "unknown";
      if (key !== "unknown") clientMap.set(key, true);
    });
    
    // 2. This month readings
    const thisMonthReadings = readings.filter(r => isThisMonth(new Date(r.readingDate)));
    
    // 3. Most used spread
    const spreadCounts: Record<string, number> = {};
    readings.forEach(r => {
      const spread = r.customSpreadName || r.spreadType;
      spreadCounts[spread] = (spreadCounts[spread] || 0) + 1;
    });
    let topSpread = "Ninguna";
    let topSpreadCount = 0;
    Object.entries(spreadCounts).forEach(([spread, count]) => {
      if (count > topSpreadCount) {
        topSpread = spread;
        topSpreadCount = count;
      }
    });
    const topSpreadPercentage = readings.length > 0 ? Math.round((topSpreadCount / readings.length) * 100) : 0;

    return {
      totalClients: clientMap.size,
      totalReadings: readings.length,
      thisMonthReadings: thisMonthReadings.length,
      topSpread,
      topSpreadPercentage
    };
  }, [readings]);

  // Additional dynamic calculations for KPI change text
  const kpiChanges = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Clients this week
    const clientsThisWeekMap = new Map();
    readings.forEach(r => {
      const d = new Date(r.readingDate);
      if (d >= oneWeekAgo) {
        const key = r.clientEmail ? r.clientEmail.toLowerCase() : r.clientName?.toLowerCase() || "unknown";
        if (key !== "unknown") clientsThisWeekMap.set(key, true);
      }
    });

    // Readings this week
    const readingsThisWeek = readings.filter(r => new Date(r.readingDate) >= oneWeekAgo).length;

    // Monthly change percent
    const thisMonthReadings = readings.filter(r => {
      const d = new Date(r.readingDate);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    let lastMonth = now.getMonth() - 1;
    let lastMonthYear = now.getFullYear();
    if (lastMonth < 0) {
      lastMonth = 11;
      lastMonthYear -= 1;
    }
    const lastMonthReadings = readings.filter(r => {
      const d = new Date(r.readingDate);
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    }).length;

    let monthlyChangePercent = 0;
    if (lastMonthReadings > 0) {
      monthlyChangePercent = Math.round(((thisMonthReadings - lastMonthReadings) / lastMonthReadings) * 100);
    } else if (thisMonthReadings > 0) {
      monthlyChangePercent = 100;
    }

    return {
      clientsThisWeek: clientsThisWeekMap.size,
      readingsThisWeek,
      monthlyChangePercent
    };
  }, [readings]);

  // Filtering Logic
  const filteredReadings = useMemo(() => {
    return readings.filter(r => {
      // Search term
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        (r.clientName?.toLowerCase().includes(searchLower)) ||
        (r.clientEmail?.toLowerCase().includes(searchLower)) ||
        (r.title.toLowerCase().includes(searchLower)) ||
        (r.mainQuestion.toLowerCase().includes(searchLower)) ||
        ((r.customSpreadName || r.spreadType).toLowerCase().includes(searchLower));

      // Category
      const matchesCategory = categoryFilter === "ALL" || r.category === categoryFilter;

      // Spread
      const matchesSpread = spreadFilter === "ALL" || (r.customSpreadName || r.spreadType) === spreadFilter;

      // Date
      let matchesDate = true;
      if (dateFilter !== "ALL") {
        const d = new Date(r.readingDate);
        const now = new Date();
        if (dateFilter === "TODAY") {
          matchesDate = d.toDateString() === now.toDateString();
        } else if (dateFilter === "THIS_WEEK") {
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = d >= oneWeekAgo && d <= now;
        } else if (dateFilter === "THIS_MONTH") {
          matchesDate = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        } else if (dateFilter === "LAST_MONTH") {
          let lastMonth = now.getMonth() - 1;
          let year = now.getFullYear();
          if (lastMonth < 0) {
            lastMonth = 11;
            year -= 1;
          }
          matchesDate = d.getMonth() === lastMonth && d.getFullYear() === year;
        }
      }

      return matchesSearch && matchesCategory && matchesSpread && matchesDate;
    });
  }, [readings, searchTerm, categoryFilter, spreadFilter, dateFilter]);

  const hasActiveFilters = searchTerm !== "" || categoryFilter !== "ALL" || spreadFilter !== "ALL" || dateFilter !== "ALL";

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("ALL");
    setSpreadFilter("ALL");
    setDateFilter("ALL");
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getWhatsAppShareUrl = (reading: Reading) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const readingUrl = `${origin}/mis-lecturas/${reading.id}`;
    const name = reading.clientName || "Consultante";
    const text = `Hola ${name}, ya está disponible tu lectura de Tarot "${reading.title}" en tu perfil: ${readingUrl}`;
    const encodedText = encodeURIComponent(text);
    const phone = reading.client?.phone;
    
    if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, "");
      return `https://wa.me/${cleanPhone}?text=${encodedText}`;
    }
    
    return `https://api.whatsapp.com/send?text=${encodedText}`;
  };

  // 1. ESTADO VACÍO TOTAL Y VISTA PRINCIPAL UNIFICADOS
  return (
    <div className={styles.container}>
      
      {/* HERO SECTION */}
      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <h1 className={styles.heroTitle}>Gestor de <span className={styles.heroTitleHighlight}>Consultantes</span></h1>
          <p className={styles.heroSubtitle}>Administra las lecturas realizadas a tus clientes.</p>
          <Link href="/admin/lecturas/nueva" className={styles.heroButton}>
            <span aria-hidden="true">+</span> Registrar Nueva Lectura
          </Link>
        </div>
        <div className={styles.heroRight}>
          <img src="/assets/landing/imagen_principal.png" alt="Libreta, carta de tarot y vela de Khael Tarotista" className={styles.heroImage} />
        </div>
      </div>

      <div className={styles.filtersBar}>
        <div className={styles.searchInputWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Buscar consultante, correo, pregunta o lectura..." 
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Buscar lecturas"
          />
        </div>
        
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Categoría</label>
          <select 
            className={styles.selectInput}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filtro de Categoría"
          >
            <option value="ALL">Todas</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Tipo de Tirada</label>
          <select 
            className={styles.selectInput}
            value={spreadFilter}
            onChange={(e) => setSpreadFilter(e.target.value)}
            aria-label="Filtro de Tipo de Tirada"
          >
            <option value="ALL">Todos</option>
            {spreadTypes.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Fecha</label>
          <select 
            className={styles.selectInput}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            aria-label="Filtro de Fecha"
          >
            <option value="ALL">Todas</option>
            <option value="TODAY">Hoy</option>
            <option value="THIS_WEEK">Esta semana</option>
            <option value="THIS_MONTH">Este mes</option>
            <option value="LAST_MONTH">Mes anterior</option>
          </select>
        </div>

        <button onClick={clearFilters} className={styles.filterActionBtn} aria-label="Limpiar filtros" style={{ visibility: hasActiveFilters ? "visible" : "hidden" }}>
          <FilterX size={16} /> Filtros
        </button>
      </div>

      {/* KPI CARDS */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper}><Users size={18} /></div>
          <div className={styles.kpiContent}>
            <h3 className={styles.kpiTitle}>Total Consultantes</h3>
            <p className={styles.kpiValue}>{kpis.totalClients}</p>
            <span className={styles.kpiChangeNeutral}>+{kpiChanges.clientsThisWeek} esta semana</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper}><BookCopy size={18} /></div>
          <div className={styles.kpiContent}>
            <h3 className={styles.kpiTitle}>Lecturas Totales</h3>
            <p className={styles.kpiValue}>{kpis.totalReadings}</p>
            <span className={styles.kpiChangeNeutral}>+{kpiChanges.readingsThisWeek} esta semana</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper}><CalendarIcon size={18} /></div>
          <div className={styles.kpiContent}>
            <h3 className={styles.kpiTitle}>Lecturas este Mes</h3>
            <p className={styles.kpiValue}>{kpis.thisMonthReadings}</p>
            <span className={styles.kpiChange}>
              {kpiChanges.monthlyChangePercent >= 0 ? `+${kpiChanges.monthlyChangePercent}` : kpiChanges.monthlyChangePercent}% vs mes anterior
            </span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper}><Sparkles size={18} /></div>
          <div className={styles.kpiContent}>
            <h3 className={styles.kpiTitle}>Tirada más utilizada</h3>
            <p className={styles.kpiValueText} title={kpis.topSpread}>{kpis.topSpread === "Ninguna" ? "Sin datos" : kpis.topSpread}</p>
            <span className={styles.kpiChangeNeutral}>{kpis.topSpreadPercentage}% del total</span>
          </div>
        </div>
      </div>

      {/* READINGS LIST */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>Lecturas Recientes</h2>
        </div>

        {/* ESTADO VACÍO TOTAL */}
        {readings.length === 0 ? (
          <div className={styles.emptyState}>
            <Sparkles size={48} className={styles.emptyIcon} strokeWidth={1} />
            <h3 className={styles.emptyTitle}>Todavía no has registrado ninguna lectura.</h3>
            <p className={styles.emptyText}>
              Empieza creando la primera consulta para construir el historial de tus consultantes.
            </p>
            <Link href="/admin/lecturas/nueva" className={styles.emptyButton}>
              <span aria-hidden="true">+</span> Registrar Primera Lectura
            </Link>
          </div>
        ) : filteredReadings.length === 0 ? (
          /* ESTADO VACÍO POR FILTROS */
          <div className={styles.emptyState}>
            <FilterX size={48} className={styles.emptyIcon} strokeWidth={1} />
            <h3 className={styles.emptyTitle}>No encontramos lecturas con los filtros seleccionados.</h3>
            <button onClick={clearFilters} className={styles.filterActionBtn} style={{ marginTop: "1rem" }}>
              Limpiar filtros
            </button>
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Consultante</th>
                    <th>Pregunta Principal</th>
                    <th>Tipo de Tirada</th>
                    <th>Fecha</th>
                    <th style={{ textAlign: "right" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReadings.map(reading => (
                    <tr key={reading.id} className={styles.tableRow}>
                      <td>
                        <div className={styles.clientInfo}>
                          <div className={styles.avatar}>{getInitials(reading.clientName)}</div>
                          <div>
                            <span className={styles.clientName}>{reading.clientName || "Sin Nombre"}</span>
                            <span className={styles.clientEmail}>{reading.clientEmail || "Sin correo registrado"}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={styles.questionText} title={reading.mainQuestion}>
                          {reading.mainQuestion}
                        </div>
                      </td>
                      <td>
                        <span className={styles.spreadType}>{reading.customSpreadName || reading.spreadType}</span>
                      </td>
                      <td>
                        <span className={styles.dateText}>
                          {format(new Date(reading.readingDate), "dd/MM/yyyy")}
                        </span>
                        <span className={styles.timeText}>
                          {format(new Date(reading.readingDate), "HH:mm")}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionsGroup}>
                          <Link 
                            href={`/admin/lecturas/${reading.id}`} 
                            className={styles.actionIconBtn}
                            aria-label="Ver lectura"
                            title="Ver lectura"
                          >
                            <Eye size={18} />
                          </Link>
                          <div style={{ position: "relative" }}>
                            <button 
                              onClick={() => setActiveDropdown(activeDropdown === reading.id ? null : reading.id)}
                              className={styles.actionIconBtn}
                              aria-label="Más opciones"
                              title="Más opciones"
                            >
                              <MoreVertical size={18} />
                            </button>
                            {activeDropdown === reading.id && (
                              <div style={{
                                position: "absolute",
                                right: 0,
                                top: "100%",
                                marginTop: "4px",
                                background: "#151226",
                                border: "1px solid rgba(197, 168, 128, 0.3)",
                                borderRadius: "8px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                                zIndex: 10,
                                minWidth: "120px"
                              }}>
                                <Link 
                                  href={`/admin/lecturas/${reading.id}`}
                                  style={{
                                    display: "block",
                                    padding: "8px 12px",
                                    color: "#e2e1e9",
                                    fontSize: "0.85rem",
                                    textDecoration: "none",
                                    textAlign: "left"
                                  }}
                                  onClick={() => setActiveDropdown(null)}
                                >
                                  Editar Lectura
                                </Link>
                                {reading.status === "PUBLISHED" && (
                                  <a 
                                    href={getWhatsAppShareUrl(reading)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      display: "block",
                                      padding: "8px 12px",
                                      color: "#4ade80",
                                      fontSize: "0.85rem",
                                      textDecoration: "none",
                                      textAlign: "left",
                                      borderTop: "1px solid rgba(255, 255, 255, 0.05)"
                                    }}
                                    onClick={() => setActiveDropdown(null)}
                                  >
                                    Compartir WhatsApp
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}
            <div className={styles.mobileCardsList}>
              {filteredReadings.map(reading => (
                <div key={reading.id} className={styles.mobileCard}>
                  <div className={styles.mobileCardHeader}>
                    <div className={styles.clientInfo}>
                      <div className={styles.avatar}>{getInitials(reading.clientName)}</div>
                      <div>
                        <span className={styles.clientName}>{reading.clientName || "Sin Nombre"}</span>
                        <span className={styles.dateText}>
                          {format(new Date(reading.readingDate), "dd MMM yyyy", { locale: es })}
                        </span>
                      </div>
                    </div>
                    <span className={`${styles.badge} ${styles['badge' + reading.status]}`}>
                      {reading.status === "DRAFT" ? "Pendiente" : 
                       reading.status === "PUBLISHED" ? "Completada" : 
                       reading.status === "ARCHIVED" ? "Archivada" : "Cancelada"}
                    </span>
                  </div>
                  
                  <div className={styles.mobileQuestion}>
                    "{reading.mainQuestion}"
                  </div>
                  
                  <div className={styles.mobileCardFooter}>
                    <span className={styles.spreadType} style={{ fontSize: "0.85rem" }}>
                      <BookOpen size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                      {reading.customSpreadName || reading.spreadType}
                    </span>
                    <Link 
                      href={`/admin/lecturas/${reading.id}`} 
                      className={styles.actionIconBtn}
                      style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                      aria-label="Ver lectura"
                    >
                      <Eye size={18} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.tableFooter}>
              <Link href="/admin/lecturas" className={styles.viewAllBtn}>
                Ver todas las lecturas <span>→</span>
              </Link>
            </div>
          </>
        )}
      </div>

    </div>
  );
}
