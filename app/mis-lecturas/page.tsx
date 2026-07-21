import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import MisLecturasClient from "./mis-lecturas-client";
import ChangePasswordModal from "./ChangePasswordModal";
import { tarotCards } from "@/src/data/tarotCards";

export default async function MisLecturasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/mis-lecturas/login");
  
  const isKhael = user.roles.includes("ADMIN") || user.roles.includes("TAROTIST");
  
  // La biblioteca siempre debe mostrar solo las lecturas donde el usuario actual es el consultante.
  // Debug mode query
  const baseWhere: any = {
    OR: [
      { clientId: user.id },
      { clientEmail: user.email }
    ]
  };

  if (!isKhael) {
    baseWhere.status = "PUBLISHED";
  }

  const readings = await prisma.clientReading.findMany({
    where: baseWhere,
    orderBy: { readingDate: "desc" },
    include: {
      tarotist: { select: { profile: { select: { displayName: true } }, name: true } },
      cards: { take: 1, select: { visualCardId: true } }
    }
  });

  return (
    <div className="landing-page readings-page">
      <header className="landing-header">
        <Link className="landing-brand" href="/" aria-label="Khael Tarotista">
          <span className="landing-brand__seal" aria-hidden="true">
            ✦
          </span>
          <span className="landing-brand__text">
            <strong>Khael</strong>
            <span>Tarotista</span>
          </span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginLeft: 'auto' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(201, 166, 107, 0.1)',
              color: '#c9a66b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '15px',
              fontFamily: 'var(--font-cinzel), serif',
              border: '1px solid rgba(201, 166, 107, 0.2)'
            }}>
              {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#f3ebdd', fontSize: '14px', fontWeight: 500 }}>
                {user.name || user.email.split('@')[0]}
              </span>
              <span style={{ color: '#8c8694', fontSize: '12px' }}>
                {user.email}
              </span>
            </div>
          </div>

          <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.1)' }}></div>

          <ChangePasswordModal />

          <form action="/api/auth/logout" method="POST">
            <button type="submit" style={{ 
              background: 'transparent', 
              borderColor: 'rgba(215, 173, 105, 0.4)',
              border: '1px solid',
              borderRadius: '999px',
              padding: '8px 16px',
              color: 'var(--muted)',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              Cerrar Sesión <span>→</span>
            </button>
          </form>
        </div>
      </header>

      <MisLecturasClient readings={readings} availableCards={tarotCards} />
    </div>
  );
}
