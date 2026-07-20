import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { ClientReadingViewer } from "./client-reading-viewer";
import { tarotCards } from "@/src/data/tarotCards";

export default async function MisLecturasDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/mis-lecturas/login");
  }

  const { id } = await params;
  const reading = await prisma.clientReading.findUnique({
    where: { id },
    include: {
      cards: {
        orderBy: { positionIndex: "asc" },
      }
    },
  });

  if (!reading) {
    notFound();
  }

  // Verificar que la lectura pertenece al cliente autenticado
  if (reading.clientId !== user.id && !user.roles.includes("ADMIN") && !user.roles.includes("TAROTIST")) {
    // Si no es el dueño ni un admin/tarotista, redirigir
    redirect("/mis-lecturas");
  }

  // Filtrar notas privadas y devolver solo datos públicos para el visor
  const publicCards = reading.cards.map(card => ({
    id: card.id,
    visualCardId: card.visualCardId,
    cardName: card.cardName,
    positionName: card.positionName,
    interpretation: card.interpretation,
    x: card.x,
    y: card.y,
    rotation: card.rotation,
    relativeScale: card.relativeScale,
    zIndex: card.zIndex,
  }));

  return (
    <div className="panel-container" style={{ maxWidth: "1200px", padding: "2rem 1rem", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem", textAlign: "center" }}>
        <h1 style={{ color: "var(--landing-gold-1)", fontSize: "2rem", fontFamily: "var(--font-cinzel)" }}>{reading.title}</h1>
        <p style={{ color: "var(--muted)", marginTop: "0.5rem" }}>
          Realizada el {new Date(reading.readingDate).toLocaleDateString("es-ES", { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </header>

      {reading.mainQuestion && (
        <div style={{ background: "rgba(200, 165, 106, 0.05)", border: "1px solid rgba(200, 165, 106, 0.2)", padding: "1.5rem", borderRadius: "12px", marginBottom: "2rem", textAlign: "center" }}>
          <h3 style={{ color: "var(--landing-gold-2)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.5rem" }}>Pregunta Principal</h3>
          <p style={{ color: "#f3ebdd", fontSize: "1.1rem", fontStyle: "italic" }}>"{reading.mainQuestion}"</p>
        </div>
      )}
      
      <ClientReadingViewer cards={publicCards} availableCards={tarotCards} />

      {reading.generalInterpretation && (
        <div style={{ marginTop: "3rem", background: "rgba(10, 12, 18, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)", padding: "2rem", borderRadius: "16px" }}>
          <h2 style={{ color: "var(--landing-gold-1)", fontSize: "1.5rem", marginBottom: "1rem", fontFamily: "var(--font-cinzel)" }}>Interpretación de la Lectura</h2>
          <div style={{ color: "rgba(243, 235, 221, 0.9)", lineHeight: "1.7", fontSize: "1.05rem", whiteSpace: "pre-wrap" }}>
            {reading.generalInterpretation}
          </div>
        </div>
      )}
      
      <div style={{ marginTop: "3rem", textAlign: "center" }}>
        <a href="/mis-lecturas" className="btn" style={{ padding: "0.8rem 1.5rem", background: "rgba(255,255,255,0.05)", color: "white", borderRadius: "8px", textDecoration: "none" }}>
          ← Volver a Mis Lecturas
        </a>
      </div>
    </div>
  );
}
