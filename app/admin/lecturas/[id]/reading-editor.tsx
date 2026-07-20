"use client";

import { useState, useRef, useEffect, MouseEvent as ReactMouseEvent } from "react";
import { updateCardLayout, updateReadingInterpretation, addCardToReading, deleteCard, updateCardInterpretation } from "./actions";

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
  const [generalInterpretation, setGeneralInterpretation] = useState(reading.generalInterpretation || "");
  const [isSavingLayout, setIsSavingLayout] = useState(false);
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
      await updateCardLayout(card.id, { x: card.x, y: card.y, rotation: card.rotation, zIndex: card.zIndex });
    }
    await updateReadingInterpretation(reading.id, generalInterpretation);
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
    await updateCardLayout(editingCard.id, { x: editingCard.x, y: editingCard.y, rotation, zIndex: editingCard.zIndex });
    
    setEditingCard(null);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "2rem", minHeight: "80vh" }}>
      
      {/* Canvas Area */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.2rem", color: "var(--landing-gold-1)" }}>Lienzo de Tirada</h2>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn" style={{ padding: "0.5rem 1rem", background: "rgba(255,255,255,0.1)", color: "white", borderRadius: "6px" }} onClick={() => setShowSelector(true)}>
              + Añadir Carta
            </button>
            <button className="btn btn-primary" style={{ padding: "0.5rem 1rem" }} onClick={saveLayout} disabled={isSavingLayout}>
              {isSavingLayout ? "Guardando..." : "Guardar Disposición"}
            </button>
          </div>
        </div>
        
        <div 
          ref={containerRef}
          style={{ 
            flex: 1, 
            background: "rgba(10, 12, 18, 0.9)", 
            border: "1px solid rgba(255,255,255,0.1)", 
            borderRadius: "12px", 
            position: "relative",
            overflow: "hidden",
            touchAction: "none"
          }}
        >
          {/* Background Grid Pattern */}
          <div style={{ position: "absolute", inset: 0, opacity: 0.05, backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "40px 40px" }} pointerEvents="none" />
          
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
                  width: "100px", // Base size, scaled by relativeScale
                  aspectRatio: "1 / 1.7",
                  cursor: draggingId === card.id ? "grabbing" : "grab",
                  boxShadow: draggingId === card.id ? "0 10px 30px rgba(0,0,0,0.5), 0 0 0 2px var(--landing-gold-1)" : "0 4px 10px rgba(0,0,0,0.3)",
                  borderRadius: "6px",
                  transition: draggingId === card.id ? "none" : "box-shadow 0.2s, transform 0.2s",
                  backgroundImage: `url(${imageSrc})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }}
              >
                {/* Optional Overlays */}
                {editingCard?.id === card.id && (
                  <div style={{ position: "absolute", inset: "-4px", border: "2px solid var(--landing-gold-1)", borderRadius: "8px", pointerEvents: "none" }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar Area */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", background: "rgba(255,255,255,0.03)", padding: "1.5rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", overflowY: "auto" }}>
        
        {editingCard ? (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ color: "var(--landing-gold-1)", fontSize: "1.1rem" }}>Editar Carta</h3>
              <button onClick={() => setEditingCard(null)} style={{ color: "var(--muted)", background: "none", border: "none", cursor: "pointer" }}>✕</button>
            </div>
            
            <form onSubmit={saveCardDetails} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ padding: "0.8rem", background: "rgba(0,0,0,0.3)", borderRadius: "6px", fontSize: "0.9rem" }}>
                <strong>{editingCard.cardName}</strong><br/>
                <span style={{ color: "var(--muted)" }}>{editingCard.positionName}</span>
              </div>
              
              <label className="login-form__field" style={{ gap: "0.5rem" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Rotación (grados)</span>
                <input type="number" name="rotation" defaultValue={editingCard.rotation} style={{ width: "100%", padding: "8px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
              </label>

              <label className="login-form__field" style={{ gap: "0.5rem" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Escala (1.0 = normal)</span>
                <input type="number" step="0.1" name="scale" defaultValue={editingCard.relativeScale} style={{ width: "100%", padding: "8px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
              </label>

              <label className="login-form__field" style={{ gap: "0.5rem" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Interpretación Específica</span>
                <textarea name="interpretation" defaultValue={editingCard.interpretation || ""} rows={5} style={{ width: "100%", padding: "10px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", resize: "vertical" }} />
              </label>
              
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: "0.5rem" }}>Guardar Detalles</button>
                <button type="button" onClick={() => handleDeleteCard(editingCard.id)} className="btn" style={{ padding: "0.5rem", background: "rgba(220, 53, 69, 0.2)", color: "#ff8c8c", border: "1px solid rgba(220, 53, 69, 0.4)", borderRadius: "6px" }}>Eliminar</button>
              </div>
            </form>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <h3 style={{ color: "var(--landing-gold-1)", fontSize: "1.1rem" }}>Interpretación General</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Esta síntesis será visible para el consultante en su portal.</p>
            <textarea 
              value={generalInterpretation}
              onChange={e => setGeneralInterpretation(e.target.value)}
              rows={12} 
              style={{ width: "100%", padding: "12px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", resize: "vertical", fontSize: "0.95rem", lineHeight: "1.5" }} 
              placeholder="Escribe la interpretación general de la lectura..."
            />
          </div>
        )}
        
      </div>

      {/* Modal Selector */}
      {showSelector && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "var(--background)", width: "100%", maxWidth: "800px", maxHeight: "80vh", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            
            <div style={{ padding: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ color: "var(--landing-gold-1)", fontSize: "1.2rem" }}>Añadir Carta</h3>
              <button onClick={() => setShowSelector(false)} style={{ color: "white", background: "none", border: "none", cursor: "pointer", fontSize: "1.5rem" }}>✕</button>
            </div>
            
            <div style={{ padding: "1rem", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              <input 
                type="text" 
                placeholder="Buscar carta..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: "100%", padding: "12px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
              />
            </div>
            
            <div style={{ padding: "1rem", overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "1rem" }}>
              {filteredCards.map(ac => (
                <div 
                  key={ac.id} 
                  onClick={() => handleAddCard(ac)}
                  style={{ display: "flex", flexDirection: "column", gap: "0.5rem", cursor: "pointer", padding: "0.5rem", borderRadius: "8px", transition: "background 0.2s" }}
                  onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                  onMouseOut={e => e.currentTarget.style.background = "transparent"}
                >
                  <img src={ac.image} alt={ac.nameEs} style={{ width: "100%", aspectRatio: "1/1.7", objectFit: "cover", borderRadius: "4px" }} />
                  <span style={{ fontSize: "0.75rem", color: "var(--muted)", textAlign: "center", lineHeight: "1.2" }}>{ac.nameEs}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
