"use client";

import { useState } from "react";

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

export function ClientReadingViewer({ cards, availableCards }: { cards: PublicCardData[], availableCards: any[] }) {
  const [selectedCard, setSelectedCard] = useState<PublicCardData | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      
      {/* Canvas Area */}
      <div 
        style={{ 
          width: "100%",
          minHeight: "500px",
          background: "rgba(10, 12, 18, 0.4)", 
          border: "1px solid rgba(255,255,255,0.05)", 
          borderRadius: "16px", 
          position: "relative",
          overflow: "hidden",
          boxShadow: "inset 0 0 50px rgba(0,0,0,0.5)"
        }}
      >
        {/* Subtle mystical background */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.03, backgroundImage: "radial-gradient(circle at center, var(--landing-gold-1) 0%, transparent 70%)", pointerEvents: "none" }} />
        
        {cards.map(card => {
          const cardDef = availableCards.find(ac => ac.id === card.visualCardId);
          const imageSrc = cardDef ? cardDef.image : "/assets/cards/back.jpg";
          const isSelected = selectedCard?.id === card.id;
          
          return (
            <div 
              key={card.id}
              onClick={() => setSelectedCard(isSelected ? null : card)}
              style={{
                position: "absolute",
                left: `${card.x}%`,
                top: `${card.y}%`,
                transform: `translate(-50%, -50%) rotate(${card.rotation}deg) scale(${isSelected ? card.relativeScale * 1.05 : card.relativeScale})`,
                zIndex: isSelected ? 100 : card.zIndex,
                width: "120px", 
                aspectRatio: "1 / 1.7",
                cursor: "pointer",
                boxShadow: isSelected ? "0 0 30px rgba(200, 165, 106, 0.6), 0 0 0 2px var(--landing-gold-1)" : "0 8px 16px rgba(0,0,0,0.4)",
                borderRadius: "8px",
                transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                backgroundImage: `url(${imageSrc})`,
                backgroundSize: "cover",
                backgroundPosition: "center"
              }}
            >
              {isSelected && (
                <div style={{ position: "absolute", inset: "-4px", border: "2px solid var(--landing-gold-1)", borderRadius: "10px", pointerEvents: "none" }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Card Interpretation Area */}
      {selectedCard ? (
        <div style={{ 
          background: "linear-gradient(145deg, rgba(20, 22, 28, 0.9), rgba(10, 12, 18, 0.9))", 
          border: "1px solid rgba(200, 165, 106, 0.3)", 
          borderRadius: "16px",
          padding: "2rem",
          display: "flex",
          gap: "2rem",
          animation: "fadeIn 0.3s ease-out",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
        }}>
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @media (max-width: 768px) {
              .card-detail-layout { flex-direction: column; align-items: center; text-align: center; }
            }
          `}</style>
          
          <div className="card-detail-layout" style={{ display: "flex", gap: "2rem", width: "100%" }}>
            <div style={{ flexShrink: 0, width: "140px" }}>
              <img 
                src={availableCards.find(ac => ac.id === selectedCard.visualCardId)?.image || "/assets/cards/back.jpg"} 
                alt={selectedCard.cardName}
                style={{ width: "100%", borderRadius: "8px", boxShadow: "0 8px 20px rgba(0,0,0,0.6)", transform: selectedCard.rotation > 90 || selectedCard.rotation < -90 ? "rotate(180deg)" : "none" }}
              />
            </div>
            
            <div style={{ flex: 1 }}>
              <h4 style={{ color: "var(--landing-gold-2)", textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "1px", marginBottom: "0.5rem" }}>
                {selectedCard.positionName || "Posición de la Carta"}
              </h4>
              <h3 style={{ color: "white", fontSize: "1.8rem", fontFamily: "var(--font-cinzel)", marginBottom: "1rem" }}>
                {selectedCard.cardName}
              </h3>
              
              <div style={{ color: "rgba(243, 235, 221, 0.85)", lineHeight: "1.7", fontSize: "1.05rem", whiteSpace: "pre-wrap" }}>
                {selectedCard.interpretation ? selectedCard.interpretation : <span style={{ fontStyle: "italic", opacity: 0.6 }}>No hay notas específicas para esta carta.</span>}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "2rem", opacity: 0.5 }}>
          <p style={{ fontStyle: "italic" }}>Haz clic en las cartas del lienzo para leer su mensaje específico.</p>
        </div>
      )}

    </div>
  );
}
