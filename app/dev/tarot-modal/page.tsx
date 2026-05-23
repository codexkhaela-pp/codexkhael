"use client";

import React, { useState } from "react";
import { TarotCardModal } from "@/components/tarot/TarotCardModal";

export default function TarotModalDevPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [simulatedPlan, setSimulatedPlan] = useState("FREE");

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif", background: "#f5f5f5", minHeight: "100vh", color: "#333" }}>
      <h1>🧪 Dev Test: Tarot Card Modal</h1>
      <p style={{ marginBottom: "2rem" }}>
        Esta página es solo para validar la lógica del modal de Arcanos Mayores. 
        Puedes cambiar el plan simulado y luego abrir el modal para ver cómo se restringen los datos y la interfaz.
      </p>

      <div style={{ marginBottom: "2rem", padding: "1rem", background: "white", borderRadius: "8px", border: "1px solid #ccc" }}>
        <h3>1. Selecciona el Plan a Simular</h3>
        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          {["FREE", "BASIC", "PRO"].map((plan) => (
            <button
              key={plan}
              onClick={() => {
                setSimulatedPlan(plan);
                setModalOpen(false); // Close to force reload data on next open
              }}
              style={{
                padding: "0.5rem 1rem",
                cursor: "pointer",
                background: simulatedPlan === plan ? "#A58A59" : "#eee",
                color: simulatedPlan === plan ? "white" : "#333",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontWeight: simulatedPlan === plan ? "bold" : "normal"
              }}
            >
              Simular {plan}
            </button>
          ))}
        </div>
        <p style={{ marginTop: "1rem", fontStyle: "italic", fontSize: "0.9rem", color: "#666" }}>
          Plan actual: <strong>{simulatedPlan}</strong>
        </p>
      </div>

      <div style={{ marginBottom: "2rem", padding: "1rem", background: "white", borderRadius: "8px", border: "1px solid #ccc" }}>
        <h3>2. Abre el Modal</h3>
        <button
          onClick={() => setModalOpen(true)}
          style={{
            marginTop: "1rem",
            padding: "0.8rem 1.5rem",
            background: "#0E0E23",
            color: "#C9A66B",
            border: "1px solid #C9A66B",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "1rem"
          }}
        >
          Abrir Carta "El Mago"
        </button>
        <p style={{ marginTop: "1rem", fontStyle: "italic", fontSize: "0.9rem", color: "#666" }}>
          Al abrir, abre <strong>DevTools → Network</strong> y verifica la respuesta del endpoint.
        </p>
      </div>

      <TarotCardModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        cardId="the-magician"
        simulatePlan={simulatedPlan}
      />
    </div>
  );
}
