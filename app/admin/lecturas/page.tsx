import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default async function AdminLecturasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  
  const hasAccess = user.roles.includes("ADMIN") || user.roles.includes("TAROTIST");
  if (!hasAccess) redirect("/dashboard-preview");

  const readings = await prisma.clientReading.findMany({
    where: { tarotistId: user.id },
    orderBy: { readingDate: "desc" },
  });

  return (
    <div className="panel-container">
      <header className="panel-header" style={{ marginBottom: "2rem" }}>
        <div>
          <h1 className="panel-title">Gestor de Consultantes</h1>
          <p className="panel-subtitle">Administra las lecturas realizadas a tus clientes</p>
        </div>
        <Link href="/admin/lecturas/nueva" className="btn btn-primary">
          <span aria-hidden="true">✦</span> Registrar Nueva Lectura
        </Link>
      </header>

      <section className="panel-section">
        {readings.length === 0 ? (
          <div className="empty-state" style={{ padding: "4rem 2rem", textAlign: "center", border: "1px dashed rgba(201,166,107,0.3)", borderRadius: "8px" }}>
            <span style={{ fontSize: "2rem", opacity: 0.5, display: "block", marginBottom: "1rem" }}>🔮</span>
            <p style={{ color: "var(--muted)", marginBottom: "1rem" }}>No hay lecturas registradas aún.</p>
            <Link href="/admin/lecturas/nueva" className="btn" style={{ background: "rgba(201,166,107,0.1)" }}>
              Crear primera lectura
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "var(--landing-gold-2)" }}>
                  <th style={{ padding: "1rem" }}>Fecha</th>
                  <th style={{ padding: "1rem" }}>Consultante</th>
                  <th style={{ padding: "1rem" }}>Pregunta / Tema</th>
                  <th style={{ padding: "1rem" }}>Tirada</th>
                  <th style={{ padding: "1rem" }}>Estado</th>
                  <th style={{ padding: "1rem", textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {readings.map((reading) => (
                  <tr key={reading.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "1rem", whiteSpace: "nowrap" }}>
                      {format(new Date(reading.readingDate), "dd MMM yyyy", { locale: es })}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      {reading.clientName || "Sin Nombre"}<br/>
                      <small style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{reading.clientEmail}</small>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <strong>{reading.title}</strong><br/>
                      <small style={{ color: "var(--muted)" }}>{reading.category || "General"}</small>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      {reading.customSpreadName || reading.spreadType}
                      {reading.totalCards > 0 && <span style={{ opacity: 0.6, fontSize: "0.8rem", marginLeft: "0.5rem" }}>({reading.totalCards} cartas)</span>}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span style={{ 
                        padding: "4px 8px", 
                        borderRadius: "12px", 
                        fontSize: "0.75rem",
                        background: reading.status === "PUBLISHED" ? "rgba(100,200,100,0.1)" : "rgba(200,100,100,0.1)",
                        color: reading.status === "PUBLISHED" ? "#88dd88" : "#dd8888"
                      }}>
                        {reading.status}
                      </span>
                    </td>
                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      <Link href={`/admin/lecturas/${reading.id}`} style={{ color: "var(--landing-gold-2)", fontSize: "0.9rem" }}>
                        Ver / Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
