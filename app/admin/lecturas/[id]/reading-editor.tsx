"use client";

import { useState, useRef, useEffect, MouseEvent as ReactMouseEvent } from "react";
import { Sparkles, Info } from "lucide-react";
import { updateCardLayout, updateReadingInterpretation, addCardToReading, deleteCard, updateCardInterpretation, updateReadingStatus } from "./actions";
import styles from "./reading-editor.module.css";

type CardData = {
  id: string;
  visualCardId: string | null;
  cardName: string;
  x: number;
  y: number;
  rotation: number;
  zIndex: number;
  orientation: "UPRIGHT" | "REVERSED";
  interpretation: string | null;
  positionName: string | null;
  relativeScale: number;
};

export function ReadingEditor({ reading, availableCards }: { reading: any, availableCards: any[] }) {
  const [cards, setCards] = useState<CardData[]>(reading.cards);
  const [spreadDescription, setSpreadDescription] = useState(reading.spreadDescription || "");
  const [isSavingLayout, setIsSavingLayout] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [status, setStatus] = useState(reading.status || "DRAFT");
  const containerRef = useRef<HTMLDivElement>(null);

  // Selector state
  const [showSelector, setShowSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Editor state for a specific card
  const [editingCard, setEditingCard] = useState<CardData | null>(null);

  // Dragging state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const filteredCards = availableCards.filter(c => c.nameEs.toLowerCase().includes(searchTerm.toLowerCase()));

  const handlePointerDown = (e: React.PointerEvent, id: string, startX: number, startY: number) => {
    e.preventDefault();
    if (!containerRef.current) return;
    
    // Bring to front locally
    const maxZ = Math.max(0, ...cards.map(c => c.zIndex));
    setCards(prev => prev.map(c => c.id === id ? { ...c, zIndex: maxZ + 1 } : c));
    
    const rect = containerRef.current.getBoundingClientRect();
    const pxX = (startX / 100) * rect.width;
    const pxY = (startY / 100) * rect.height;
    
    setDragOffset({
      x: e.clientX - rect.left - pxX,
      y: e.clientY - rect.top - pxY
    });
    setDraggingId(id);
    
    // Capture pointer to track outside bounds
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingId || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const newPxX = e.clientX - rect.left - dragOffset.x;
    const newPxY = e.clientY - rect.top - dragOffset.y;
    
    const newPctX = (newPxX / rect.width) * 100;
    const newPctY = (newPxY / rect.height) * 100;
    
    setCards(prev => prev.map(c => c.id === draggingId ? { ...c, x: newPctX, y: newPctY } : c));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingId) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setDraggingId(null);
    }
  };

  const saveLayout = async () => {
    setIsSavingLayout(true);
    for (const card of cards) {
      await updateCardLayout(card.id, { x: card.x, y: card.y, rotation: card.rotation, zIndex: card.zIndex, relativeScale: card.relativeScale });
    }
    await updateReadingInterpretation(reading.id, spreadDescription);
    setIsSavingLayout(false);
    alert("Layout e interpretación guardados");
  };

  const handleAddCard = async (ac: any) => {
    setShowSelector(false);
    const result = await addCardToReading(reading.id, {
      canonicalCardId: ac.id,
      visualCardId: ac.id,
      cardName: ac.nameEs,
      positionIndex: cards.length,
      positionName: `Posición ${cards.length + 1}`,
      x: 50,
      y: 50,
      zIndex: cards.length + 1,
      relativeScale: 1.0,
      orientation: "UPRIGHT"
    });
    if (result.success && result.card) {
      setCards([...cards, result.card as any]);
    }
  };

  const togglePublish = async () => {
    setIsPublishing(true);
    const newStatus = status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    const res = await updateReadingStatus(reading.id, newStatus);
    if (res.success) {
      setStatus(newStatus);
      alert(newStatus === "PUBLISHED" ? "Lectura publicada y visible para el consultante." : "Lectura devuelta a borrador.");
    }
    setIsPublishing(false);
  };

  const handleDeleteCard = async (id: string) => {
    if (confirm("¿Eliminar carta?")) {
      await deleteCard(id, reading.id);
      setCards(cards.filter(c => c.id !== id));
      if (editingCard?.id === id) setEditingCard(null);
    }
  };

  const saveCardDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard) return;
    
    const formData = new FormData(e.target as HTMLFormElement);
    const interp = formData.get("interpretation") as string;
    const rotation = parseFloat(formData.get("rotation") as string) || 0;
    const scale = parseFloat(formData.get("scale") as string) || 1.0;
    
    // Update local immediately for visual changes
    setCards(prev => prev.map(c => c.id === editingCard.id ? { ...c, interpretation: interp, rotation, relativeScale: scale } : c));
    
    await updateCardInterpretation(editingCard.id, interp, reading.id);
    // Also save rotation/scale to layout right away
    await updateCardLayout(editingCard.id, { x: editingCard.x, y: editingCard.y, rotation, zIndex: editingCard.zIndex, relativeScale: scale });
    
    setEditingCard(null);
  };

  return (
    <div className={styles.mainLayout}>
      
      {/* Canvas Area */}
      <div className={styles.canvasCard}>
        <div className={styles.canvasHeader}>
          <h2 className={styles.canvasTitle}>
            <Sparkles size={20} className={styles.canvasTitleIcon} />
            Lienzo de Tirada
          </h2>
          <div className={styles.canvasActions}>
            <button className={styles.btnSecondary} onClick={() => setShowSelector(true)}>
              + Añadir Carta
            </button>
            <button className={styles.btnPrimary} onClick={saveLayout} disabled={isSavingLayout}>
              {isSavingLayout ? "Guardando..." : "Guardar Disposición"}
            </button>
            <button 
              className={status === "PUBLISHED" ? styles.btnSecondary : styles.btnPrimary} 
              onClick={togglePublish} 
              disabled={isPublishing}
              style={{ background: status === "PUBLISHED" ? "transparent" : "#4ade80", color: status === "PUBLISHED" ? "inherit" : "#000", borderColor: status === "PUBLISHED" ? "rgba(255,255,255,0.2)" : "#4ade80" }}
            >
              {isPublishing ? "Procesando..." : status === "PUBLISHED" ? "Ocultar (Borrador)" : "Publicar Lectura"}
            </button>
          </div>
        </div>
        
        <div 
          ref={containerRef}
          className={styles.canvasBoard}
        >

          
          {cards.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateContent}>
                <div className={styles.emptyStateIcon}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <path d="M7 3v18"></path>
                    <path d="M17 3v18"></path>
                  </svg>
                </div>
                <h3 className={styles.emptyStateTitle}>Aún no hay cartas en esta tirada</h3>
                <p className={styles.emptyStateText}>Añade cartas para comenzar la lectura.</p>
                <button className={styles.btnPrimary} onClick={() => setShowSelector(true)}>
                  + Añadir Primera Carta
                </button>
              </div>
            </div>
          )}

          {cards.map(card => {
            const cardDef = availableCards.find(ac => ac.id === card.visualCardId);
            const imageSrc = cardDef ? cardDef.image : "/assets/cards/back.jpg";
            
            return (
              <div 
                key={card.id}
                onPointerDown={(e) => handlePointerDown(e, card.id, card.x, card.y)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onDoubleClick={() => setEditingCard(card)}
                style={{
                  position: "absolute",
                  left: `${card.x}%`,
                  top: `${card.y}%`,
                  transform: `translate(-50%, -50%) rotate(${card.rotation}deg) scale(${card.relativeScale})`,
                  zIndex: card.zIndex,
                  width: "115px", // Slightly larger for premium feel
                  aspectRatio: "1 / 1.7",
                  cursor: draggingId === card.id ? "grabbing" : "grab",
                  boxShadow: draggingId === card.id ? "0 14px 40px rgba(0,0,0,0.6), 0 0 0 1px #c5a880" : "0 8px 24px rgba(0,0,0,0.5)",
                  borderRadius: "8px",
                  transition: draggingId === card.id ? "none" : "box-shadow 0.25s ease, transform 0.25s ease",
                  backgroundImage: `url(${imageSrc})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  border: "1px solid rgba(197, 168, 128, 0.2)"
                }}
              >
                {/* Optional Overlays */}
                {editingCard?.id === card.id && (
                  <div style={{ position: "absolute", inset: "-4px", border: "2px solid #c5a880", borderRadius: "10px", pointerEvents: "none", boxShadow: "inset 0 0 12px rgba(197, 168, 128, 0.2)" }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar Area */}
      <div className={styles.sidebarSticky}>
        <div className={styles.sidebarCard}>
          {editingCard ? (
            <div className={styles.editCardForm}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 className={styles.sidebarTitle} style={{ borderBottom: "none", paddingBottom: 0 }}>Editar Carta</h3>
                <button onClick={() => setEditingCard(null)} className={styles.modalClose}>✕</button>
              </div>
              
              <form onSubmit={saveCardDetails} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className={styles.editCardHeader}>
                  <strong className={styles.editCardTitle}>{editingCard.cardName}</strong>
                  <span className={styles.editCardSubtitle}>{editingCard.positionName}</span>
                </div>
                
                <div className={styles.formGroup}>
                  <span className={styles.formLabel}>Rotación (grados)</span>
                  <input type="number" name="rotation" defaultValue={editingCard.rotation} className={styles.formInput} />
                </div>

                <div className={styles.formGroup}>
                  <span className={styles.formLabel}>Escala (1.0 = normal)</span>
                  <input type="number" step="0.1" name="scale" defaultValue={editingCard.relativeScale} className={styles.formInput} />
                </div>

                <div className={styles.formGroup}>
                  <span className={styles.formLabel}>Interpretación Específica</span>
                  <textarea name="interpretation" defaultValue={editingCard.interpretation || ""} rows={6} className={styles.formTextarea} />
                </div>
                
                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                  <button type="submit" className={styles.btnPrimary} style={{ flex: 1 }}>Guardar Detalles</button>
                  <button type="button" onClick={() => handleDeleteCard(editingCard.id)} className={styles.btnDanger}>Eliminar</button>
                </div>
              </form>
            </div>
          ) : (
            <>
              <h3 className={styles.sidebarTitle}>Interpretación General</h3>
              <p className={styles.sidebarDesc}>Escribe aquí la interpretación general de la lectura para el consultante. Esta síntesis será visible desde su portal.</p>
              
              <div style={{ position: "relative" }}>
                <textarea 
                  value={spreadDescription}
                  onChange={e => setSpreadDescription(e.target.value)}
                  className={styles.editorTextarea}
                  placeholder="Escribe la interpretación general de la lectura..."
                  maxLength={10000}
                />
                <div className={styles.charCount}>
                  {spreadDescription.length}/10000
                </div>
              </div>
            </>
          )}
        </div>

        {/* Advice block */}
        <div className={styles.adviceBlock}>
          <Sparkles size={16} className={styles.adviceIcon} />
          <p className={styles.adviceText}>
            Conecta las cartas entre sí y con la pregunta para ofrecer una interpretación coherente, profunda y significativa.
          </p>
        </div>
      </div>

      {/* Modal Selector */}
      {showSelector && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Añadir Carta</h3>
              <button onClick={() => setShowSelector(false)} className={styles.modalClose}>✕</button>
            </div>
            
            <div className={styles.modalSearch}>
              <input 
                type="text" 
                placeholder="Buscar carta por nombre..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            
            <div className={styles.modalGrid}>
              {filteredCards.map(ac => (
                <div 
                  key={ac.id} 
                  onClick={() => handleAddCard(ac)}
                  className={styles.cardOption}
                >
                  <img src={ac.image} alt={ac.nameEs} />
                  <span>{ac.nameEs}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
