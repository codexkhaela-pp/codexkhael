import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default async function MisLecturasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/mis-lecturas/login");
  
  // Clients can see their own readings. Khael can also test this view.
  const isKhael = user.roles.includes("ADMIN") || user.roles.includes("TAROTIST");
  
  const readings = await prisma.clientReading.findMany({
    where: isKhael ? {} : { 
      OR: [
        { clientId: user.id },
        { clientEmail: user.email }
      ],
      status: "PUBLISHED" // Consultantes solo ven las publicadas
    },
    orderBy: { readingDate: "desc" },
    include: {
      tarotist: { select: { profile: { select: { displayName: true } }, name: true } }
    }
  });

  return (
    <main className="landing-shell">
      <header className="landing-header">
        <Link href="/" className="landing-brand">
          <span className="landing-brand__symbol">✦</span>
          <span className="landing-brand__text">
            Khael
            <span>Tarotista</span>
          </span>
        </Link>
        <div style={{ display: 'flex', gap: '12px' }}>
          <form action="/api/auth/logout" method="POST">
            <button className="landing-access" type="submit" style={{ background: 'transparent', borderColor: 'rgba(215, 173, 105, 0.4)' }}>
              Cerrar Sesión <span>→</span>
            </button>
          </form>
        </div>
      </header>

      <section className="landing-hero" style={{ minHeight: "auto", paddingTop: "60px", paddingBottom: "40px" }}>
        <div className="landing-hero__copy" style={{ maxWidth: "100%", textAlign: "center" }}>
          <p className="landing-kicker">Tu espacio privado</p>
          <h1>
            Mis <span>Lecturas</span>
          </h1>
          <p style={{ color: "var(--muted)", maxWidth: "600px", margin: "1rem auto" }}>
            Aquí encontrarás el registro detallado de las consultas realizadas con Khael Tarotista.
          </p>
        </div>
      </section>

      <section style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 5vw 4rem" }}>
        {readings.length === 0 ? (
          <div className="empty-state" style={{ padding: "4rem 2rem", textAlign: "center", background: "rgba(5,6,10,0.5)", border: "1px solid rgba(201,166,107,0.2)", borderRadius: "8px" }}>
            <span style={{ fontSize: "2rem", opacity: 0.5, display: "block", marginBottom: "1rem" }}>✨</span>
            <p style={{ color: "var(--muted)", marginBottom: "1rem" }}>No tienes lecturas publicadas en este momento.</p>
            {isKhael && <p style={{ color: "var(--landing-gold-2)", fontSize: "0.8rem" }}>Como Admin, verías aquí todas las lecturas (pero no hay ninguna).</p>}
          </div>
        ) : (
          <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
            {readings.map((reading) => (
              <Link key={reading.id} href={`/mis-lecturas/${reading.id}`} style={{ 
                display: "block", 
                padding: "1.5rem", 
                background: "rgba(5,6,10,0.6)", 
                border: "1px solid rgba(201,166,107,0.2)", 
                borderRadius: "12px",
                textDecoration: "none",
                transition: "all 0.3s ease"
              }}>
                <div style={{ color: "var(--landing-gold-2)", fontSize: "0.8rem", marginBottom: "0.5rem" }}>
                  {format(new Date(reading.readingDate), "dd 'de' MMMM, yyyy", { locale: es })}
                </div>
                <h3 style={{ color: "#f3ebdd", fontSize: "1.2rem", marginBottom: "0.5rem" }}>{reading.title}</h3>
                {reading.category && (
                  <span style={{ display: "inline-block", padding: "2px 8px", background: "rgba(201,166,107,0.1)", color: "rgba(201,166,107,0.8)", borderRadius: "4px", fontSize: "0.75rem", marginBottom: "1rem" }}>
                    {reading.category}
                  </span>
                )}
                <p style={{ color: "var(--muted)", fontSize: "0.9rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {reading.mainQuestion}
                </p>
                <div style={{ marginTop: "1.5rem", color: "var(--landing-gold-1)", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>Ver detalles</span>
                  <span>→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
