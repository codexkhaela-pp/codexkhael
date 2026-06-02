"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  Users,
  HeartPlus,
  Heart,
  Star,
  Flag,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  Target,
  Sprout,
  User,
  Activity,
  Brain,
  Leaf,
  HeartPulse,
  Plane,
  MapPin,
  BookOpen,
  Network,
  Flower2,
  Sparkles,
  Infinity as InfinityIcon,
  Flame,
} from "lucide-react";
import { fetchTarotModalData } from "@/lib/tarot-modal-client";
import styles from "./TarotCardModal.module.css";

interface TarotCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardId: string | null;
  imageUrl?: string;
  simulatePlan?: string;
  getCardImage?: (cardId: string, ambito: string, orientacion: "derecho" | "invertido") => string;
}

type TabType = "resumen" | "amor" | "trabajo" | "dinero" | "salud" | "viajes" | "espiritual" | "simbologia";
type OrientationType = "derecho" | "invertido";

const TAB_CONFIG: { id: TabType; label: string; icon: string }[] = [
  { id: "resumen", label: "Resumen", icon: "✨" },
  { id: "amor", label: "Amor", icon: "💖" },
  { id: "trabajo", label: "Trabajo", icon: "⚒️" },
  { id: "dinero", label: "Dinero", icon: "🪙" },
  { id: "salud", label: "Salud", icon: "🌿" },
  { id: "viajes", label: "Viajes", icon: "✈️" },
  { id: "espiritual", label: "Espiritual", icon: "🔮" },
  { id: "simbologia", label: "Simbología", icon: "👁️" },
];

function getBlockIcon(iconName?: string) {
  const icons = {
    users: Users,
    "heart-plus": HeartPlus,
    heart: Heart,
    star: Star,
    flag: Flag,
    "alert-triangle": AlertTriangle,
    lightbulb: Lightbulb,
    "chart-up": TrendingUp,
    target: Target,
    sprout: Sprout,
    user: User,
    activity: Activity,
    brain: Brain,
    leaf: Leaf,
    "heart-pulse": HeartPulse,
    plane: Plane,
    "map-pin": MapPin,
    "book-open": BookOpen,
    network: Network,
    lotus: Flower2,
    sparkles: Sparkles,
    infinity: InfinityIcon,
    flame: Flame,
  } as const;

  return icons[iconName as keyof typeof icons] ?? Sparkles;
}

export function TarotCardModal({ isOpen, onClose, cardId, imageUrl, simulatePlan, getCardImage }: TarotCardModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("resumen");
  const [orientation, setOrientation] = useState<OrientationType>("derecho");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !cardId) return;
    
    let isMounted = true;
    setLoading(true);
    
    setActiveTab("resumen");
    setOrientation("derecho");
    
    fetchTarotModalData(cardId, simulatePlan)
      .then((res) => {
        if (isMounted) {
          setData(res.carta);
          setUserPlan(res.plan === "FREE" || res.plan === "BASIC" || res.plan === "PRO" ? res.plan : null);
        }
      })
      .catch((err) => {
        console.error("Error cargando carta:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [isOpen, cardId, simulatePlan]);

  if (!mounted || !isOpen || !cardId) return null;

  const handleClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onClose();
  };

  const handleTabClick = (tabId: TabType) => {
    if (isTabLocked(tabId, userPlan)) {
      alert("🔒 Contenido premium. Por favor, actualiza a BASIC o PRO para ver este contenido.");
      router.push(`/planes?from=feature&feature=${tabId}`);
      return;
    }
    setActiveTab(tabId);
  };

  const isTabLocked = (tabId: TabType, plan: string | null) => {
    if (!plan) return true;
    if (plan === "PRO") return false;
    if (plan === "BASIC") {
      return ["viajes", "espiritual", "simbologia"].includes(tabId);
    }
    return ["trabajo", "dinero", "salud", "viajes", "espiritual", "simbologia"].includes(tabId);
  };

  const defaultGetCardImage = (id: string, ambito: string, ori: OrientationType) => {
    return `/tarot/${id.replace(/-/g, "_")}.jpg`;
  };

  const currentImage = imageUrl || (getCardImage 
    ? getCardImage(cardId, activeTab, orientation) 
    : defaultGetCardImage(cardId, activeTab, orientation));

  const ambitoData = data?.ambitos ? data.ambitos[activeTab] : null;
  const activeData = ambitoData ? ambitoData[orientation] : null;

  // Fallback visual adapter
  const buildFallbackBlocks = (cardData: any, ambitoId: string, or: OrientationType) => {
    const currentAmbitoData = cardData.ambitos?.[ambitoId]?.[or] || {};
    const resumen = cardData.resumen?.[or] || "";
    const keywords = cardData.keywords?.[or] || [];
    const psicologia = cardData.psicologia_profunda?.[or];
    const accion = cardData.accion_concreta?.[or];
    const alertas = cardData.alertas?.[or];
    const lectura = cardData.lectura_profesional;

    const keywordsStr = keywords.length > 0 ? `Temas clave: ${keywords.join(", ")}.` : "";
    const fallbackMaster = resumen || currentAmbitoData.general || "Interpretación profunda en construcción.";

    const fbProyectos = currentAmbitoData.general || currentAmbitoData.detalle || resumen || fallbackMaster;
    const fbAmbiente = currentAmbitoData.detalle || psicologia || lectura?.uso_en_tirada || resumen || fallbackMaster;
    
    const fbFortalezas = accion || keywordsStr || currentAmbitoData.consejo || resumen || fallbackMaster;
    const fbDebilidades = alertas || keywordsStr || psicologia || resumen || fallbackMaster;
    const fbTercerBloque = or === "derecho" ? fbFortalezas : fbDebilidades;
    
    const fbDesafio = alertas || psicologia || currentAmbitoData.consejo || resumen || fallbackMaster;
    const fbConsejo = currentAmbitoData.consejo || accion || alertas || resumen || fallbackMaster;

    const sectionsData: Record<string, {label: string, icon: string, content: any}[]> = {
      "trabajo": [
        { label: "Proyectos y metas", icon: "🎯", content: fbProyectos },
        { label: "Ambiente laboral", icon: "🏢", content: fbAmbiente },
        { label: or === "derecho" ? "Fortalezas" : "Debilidades", icon: or === "derecho" ? "💪" : "📉", content: fbTercerBloque },
        { label: "Desafío", icon: "⚔️", content: fbDesafio },
        { label: "Consejo práctico", icon: "💡", content: fbConsejo },
      ],
      "amor": [
        { label: "Relaciones", icon: "💞", content: fbProyectos },
        { label: "Solteros", icon: "✨", content: fbAmbiente },
        { label: "Parejas", icon: "💑", content: fbTercerBloque },
        { label: "Consejo", icon: "💡", content: fbConsejo },
      ],
      "dinero": [
        { label: "Ingresos y oportunidades", icon: "💰", content: fbProyectos },
        { label: "Gestión y estrategia", icon: "📊", content: fbAmbiente },
        { label: "Inversiones y crecimiento", icon: "📈", content: fbTercerBloque },
        { label: "Actitud clave", icon: "🔑", content: fbDesafio },
        { label: "Consejo práctico", icon: "💡", content: fbConsejo },
      ],
      "salud": [
        { label: "Energía física", icon: "⚡", content: fbProyectos },
        { label: "Bienestar mental", icon: "🧠", content: fbAmbiente },
        { label: "Hábitos y estilo de vida", icon: "🌿", content: fbTercerBloque },
        { label: "Sistema delicado", icon: "⚠️", content: fbDesafio },
        { label: "Consejo práctico", icon: "💡", content: fbConsejo },
      ],
      "viajes": [
        { label: "Viajes y desplazamientos", icon: "✈️", content: fbProyectos },
        { label: "Nuevos destinos", icon: "🗺️", content: fbAmbiente },
        { label: "Aprendizaje en el camino", icon: "📚", content: fbTercerBloque },
        { label: "Conexiones en ruta", icon: "🤝", content: fbDesafio },
        { label: "Consejo práctico", icon: "💡", content: fbConsejo },
      ],
      "espiritual": [
        { label: "Conexión espiritual", icon: "🔮", content: fbProyectos },
        { label: "Propósito del alma", icon: "⭐", content: fbAmbiente },
        { label: "Manifestación consciente", icon: "👁️", content: fbTercerBloque },
        { label: "Energía vital elevada", icon: "✨", content: fbDesafio },
        { label: "Consejo práctico", icon: "💡", content: fbConsejo },
      ],
    };

    let blocks = sectionsData[ambitoId];
    if (!blocks) {
      blocks = [
        { label: "Situación central", icon: "🎯", content: fbProyectos },
        { label: "Entorno general", icon: "🏢", content: fbAmbiente },
        { label: "Aspectos clave", icon: "🔑", content: fbTercerBloque },
        { label: "Consejo de cierre", icon: "💡", content: fbConsejo }
      ];
    }
    
    return blocks.map((b, i) => ({ ...b, key: `sec_${i}` }));
  };

  // Check JSON 'bloques' first
  const getVisualBlocks = (cardData: any, ambitoId: string, or: OrientationType) => {
    if (!cardData) return [];

    const specificAmbitoData = cardData.ambitos?.[ambitoId]?.[or];

    if (Array.isArray(specificAmbitoData?.bloques) && specificAmbitoData.bloques.length > 0) {
      return specificAmbitoData.bloques.map((b: any, i: number) => ({
        key: `sec_${i}`,
        label: b.titulo || "Bloque",
        icon: b.icono || "✦",
        content: b.texto || "Contenido no disponible"
      }));
    }

    return buildFallbackBlocks(cardData, ambitoId, or);
  };

  const renderSubBlocks = (orient: OrientationType) => {
    const blocks = getVisualBlocks(data, activeTab, orient);
    
    if (blocks.length === 0) return null;

    return (
      <div className={styles.subBlocksContainer}>
        {blocks.map((block: any) => {
          const Icon = getBlockIcon(block.icon);
          return (
            <div key={block.key} className={styles.subBlock}>
              <div className={styles.subBlockHeader}>
                <span className={styles.subBlockIcon}>
                  {typeof block.icon === "string" && block.icon.length > 3 ? (
                    <Icon size={14} aria-hidden="true" />
                  ) : (
                    block.icon
                  )}
                </span>
                <span className={styles.subBlockTitle}>{block.label}</span>
              </div>
              {typeof block.content === 'string' && block.content.includes("🔒") ? (
                <div className={styles.lockedSubBlock}>🔒 {block.content}</div>
              ) : (
                <p className={styles.subBlockText}>{block.content}</p>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // RESUMEN DASHBOARD RENDERER
  const renderResumenDashboard = () => {
    const ambitosKeys: TabType[] = ["amor", "trabajo", "dinero", "salud", "viajes", "espiritual"];
    
    return (
      <div className={styles.resumenContainer}>
        {/* Resumen Central */}
        <div className={styles.resumenMainCard}>
          <h3 className={styles.resumenCardTitle}>Resumen Central</h3>
          <div className={styles.resumenSplit}>
            <div className={styles.resumenHalf}>
              <span className={styles.resumenLabel}>⬆️ Al derecho:</span>
              <p className={styles.resumenText}>{data?.resumen?.derecho || "Lectura en preparación."}</p>
            </div>
            <div className={styles.resumenHalf}>
              <span className={styles.resumenLabel}>⬇️ Invertido:</span>
              <p className={styles.resumenText}>{data?.resumen?.invertido || "Lectura en preparación."}</p>
            </div>
          </div>
        </div>

        {/* Ambitos Cards */}
        <div className={styles.resumenAmbitosGrid}>
          {ambitosKeys.map(k => {
            const ambDataD = data?.ambitos?.[k]?.derecho?.general;
            const ambDataI = data?.ambitos?.[k]?.invertido?.general;
            if (!ambDataD && !ambDataI) return null;
            
            const tabConfig = TAB_CONFIG.find(t => t.id === k);
            const label = tabConfig?.label || k;
            const icon = tabConfig?.icon || "✦";

            return (
              <div key={k} className={styles.resumenAmbitoCard}>
                <h3 className={styles.resumenCardTitle}>{icon} {label}</h3>
                <div className={styles.resumenSplit}>
                  <div className={styles.resumenHalf}>
                    <span className={styles.resumenLabel}>⬆️ Al derecho:</span>
                    <p className={styles.resumenText}>{ambDataD || "Lectura en preparación."}</p>
                  </div>
                  <div className={styles.resumenHalf}>
                    <span className={styles.resumenLabel}>⬇️ Invertido:</span>
                    <p className={styles.resumenText}>{ambDataI || "Lectura en preparación."}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Simbologia Preview in Resumen */}
        {data?.simbologia && data.simbologia.length > 0 && (
          <div className={styles.resumenMainCard} style={{ marginTop: '0.2rem' }}>
            <h3 className={styles.resumenCardTitle}>👁️ Simbología Principal</h3>
            <div className={styles.resumenSymbolsList}>
              {data.simbologia.slice(0, 4).map((sym: any, idx: number) => (
                <div key={idx} className={styles.resumenSymbolItem}>
                  <span className={styles.resumenSymbolName}>{sym.simbolo}:</span>
                  <span className={styles.resumenSymbolDesc}>{sym.derecho || sym.lectura_visual || "Ver detalles en su sección."}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Safe Fallbacks para Panel Lateral
  const fallbackResumenMaster = data?.resumen?.[orientation] || data?.ambitos?.[activeTab]?.general || "Lectura en preparación.";
  const momentCardData = activeData?.general || activeData?.detalle || fallbackResumenMaster;
  
  const questionsCardData = activeData?.preguntas && activeData.preguntas.length > 0 
    ? activeData.preguntas 
    : [
      `¿De qué manera puedo integrar la energía de ${data?.nombre || "este arcano"} hoy?`,
      "¿Qué mensaje subyacente me resisto a ver en esta situación?",
      "¿Qué pequeño paso puedo dar para alinearme con esta revelación?"
    ];

  const affirmationCardData = activeData?.afirmacion 
    || activeData?.consejo 
    || data?.accion_concreta?.[orientation] 
    || fallbackResumenMaster;

  const tipCardData = activeData?.consejo || data?.accion_concreta?.[orientation] || fallbackResumenMaster;

  return createPortal(
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modalShell} onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className={styles.header}>
          <div className={styles.titleBlock}>
            <h1 className={styles.nombreCarta}>{data?.nombre || "Cargando..."}</h1>
            <span className={styles.arcanoNumero}>Arcano {data?.arcano || ""} • N° {data?.numero || ""}</span>
          </div>
          
          <div className={styles.orientationToggle}>
            <button 
              className={`${styles.toggleBtn} ${orientation === "derecho" ? styles.active : ""}`}
              onClick={() => setOrientation("derecho")}
            >
              Derecho
            </button>
            <button 
              className={`${styles.toggleBtn} ${orientation === "invertido" ? styles.active : ""}`}
              onClick={() => setOrientation("invertido")}
            >
              Invertido
            </button>
          </div>

          <button className={styles.closeButton} onClick={handleClose}>✕</button>
        </div>

        {/* BODY GRID */}
        <div className={styles.bodyGrid}>
          
          {/* LEFT PANEL: 25% */}
          <div className={styles.leftPanel}>
            <div className={styles.cardImageFrame}>
              {currentImage ? (
                <img 
                  src={currentImage} 
                  alt={data?.nombre || "Carta"} 
                  className={`${styles.imagePlaceholder} ${orientation === "invertido" ? styles.reversed : ""}`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.classList.add(styles.fallbackFrame);
                  }}
                />
              ) : (
                <div className={styles.fallbackFrame}>
                  <span className={styles.fallbackIcon}>✦</span>
                </div>
              )}
            </div>
            
            <div className={styles.keywordsTitle}>Palabras Clave</div>
            <div className={styles.keywordsGrid}>
              {data?.keywords && data.keywords[orientation]?.map((kw: string, i: number) => (
                <span key={i} className={styles.keywordItem}>{kw}</span>
              ))}
            </div>

            {data?.resumen?.mensaje_clave && (
              <div className={styles.keyMessageCard}>
                <div className={styles.keyMessageTitle}>✧ Mensaje Clave</div>
                <div className={styles.keyMessageText}>"{data.resumen.mensaje_clave}"</div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL: 75% */}
          <div className={styles.rightPanel}>
            
            {/* TABS BAR */}
            <div className={styles.tabsBar}>
              {TAB_CONFIG.map((tab) => {
                const locked = isTabLocked(tab.id, userPlan);
                const isActive = activeTab === tab.id;
                
                return (
                  <button 
                    key={tab.id}
                    className={`${styles.tabBtn} ${isActive ? styles.active : ""} ${locked ? styles.locked : ""}`}
                    onClick={() => handleTabClick(tab.id)}
                  >
                    <span>{locked ? "🔒" : tab.icon}</span>
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* CONTENT GRID */}
            {loading ? (
              <div style={{ padding: "2rem" }}>Invocando arcanos...</div>
            ) : !data ? (
              <div style={{ padding: "2rem" }}>No se pudo cargar la información.</div>
            ) : (
              <div className={`${styles.contentGrid} ${activeTab === "resumen" || activeTab === "simbologia" ? styles.fullWidth : ""}`}>
                
                {/* MAIN CONTENT AREA */}
                <div className={styles.mainContentArea}>
                  <h2 className={styles.tabTitle}>
                    {activeTab === "resumen" ? "Resumen Central" : (activeTab === "simbologia" ? "Simbología Profunda" : (activeData?.titulo || `${TAB_CONFIG.find(t => t.id === activeTab)?.label}`))}
                  </h2>
                  
                  {activeTab === "resumen" ? (
                    renderResumenDashboard()
                  ) : activeTab === "simbologia" ? (
                    <div className={styles.symbologyGrid}>
                      {data.simbologia && data.simbologia.length > 0 ? (
                        data.simbologia.map((sym: any, i: number) => (
                          <div key={i} className={styles.symbolCard}>
                            <h3 className={styles.symbolTitle}>✦ {sym.simbolo}</h3>
                            <div className={styles.symbolSections}>
                              {sym.derecho && (
                                <div className={styles.symbolSection}>
                                  <span className={styles.symbolLabel}>⬆️ Al derecho:</span>
                                  <span className={styles.symbolText}>{sym.derecho}</span>
                                </div>
                              )}
                              {sym.invertido && (
                                <div className={styles.symbolSection}>
                                  <span className={styles.symbolLabel}>⬇️ Invertido:</span>
                                  <span className={styles.symbolText}>{sym.invertido}</span>
                                </div>
                              )}
                              {sym.lectura_visual && (
                                <div className={styles.symbolSection}>
                                  <span className={styles.symbolLabel}>👁️ Lectura visual:</span>
                                  <span className={styles.symbolText}>{sym.lectura_visual}</span>
                                </div>
                              )}
                              {sym.pregunta_reflexion && (
                                <div className={styles.symbolSection}>
                                  <span className={styles.symbolLabel}>💭 Pregunta:</span>
                                  <span className={styles.symbolText}>{sym.pregunta_reflexion}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className={styles.emptyState}>Simbología detallada en desarrollo.</div>
                      )}
                    </div>
                  ) : (
                    <div className={styles.interpretationGrid}>
                      <div className={`${styles.uprightCard} ${orientation === "derecho" ? styles.active : ""}`}>
                        <div className={styles.sectionHeader}>
                          <span className={styles.sectionIcon}>⬆️</span>
                          <h3 className={styles.sectionTitle}>Derecho</h3>
                        </div>
                        {renderSubBlocks("derecho")}
                      </div>

                      <div className={`${styles.reversedCard} ${orientation === "invertido" ? styles.active : ""}`}>
                        <div className={styles.sectionHeader}>
                          <span className={styles.sectionIcon}>⬇️</span>
                          <h3 className={styles.sectionTitle}>Invertido</h3>
                        </div>
                        {renderSubBlocks("invertido")}
                      </div>
                    </div>
                  )}
                </div>

                {/* SIDE CONTENT AREA (Solo para los tabs de ámbito) */}
                {activeTab !== "resumen" && activeTab !== "simbologia" && (
                  <div className={styles.sideContentArea}>
                    <div className={styles.momentCard}>
                      <div className={styles.cardHeader}>👁️ Momento Clave</div>
                      <div className={styles.cardText}>{momentCardData}</div>
                    </div>

                    <div className={styles.questionsCard}>
                      <div className={styles.cardHeader}>💭 Preguntas</div>
                      {typeof questionsCardData[0] === 'string' && questionsCardData[0].includes("🔒") ? (
                        <div className={styles.lockedBlock}>🔒 {questionsCardData[0]}</div>
                      ) : (
                        <ul className={styles.questionsList}>
                          {questionsCardData.map((pregunta: string, idx: number) => (
                            <li key={idx}>{pregunta}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className={styles.affirmationCard}>
                      <div className={styles.cardHeader}>✨ Afirmación</div>
                      <div className={styles.cardText}>{affirmationCardData}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* BOTTOM BAR: Practical Tip + AI Button */}
            {!loading && data && (
              <div className={styles.bottomBarArea}>
                <div className={styles.practicalTipBar}>
                  <div className={styles.tipIcon}>
                    {activeTab === "resumen" || activeTab === "simbologia" ? "💡" : (tipCardData.includes("🔒") ? "🔒" : "💡")}
                  </div>
                  <div className={styles.tipContent}>
                    <h4>Tip Práctico</h4>
                    {activeTab === "resumen" || activeTab === "simbologia" ? (
                      <p>Selecciona un ámbito de lectura para recibir consejos prácticos específicos.</p>
                    ) : (
                      <p>{tipCardData}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
