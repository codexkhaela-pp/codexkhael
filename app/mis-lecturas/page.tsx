import Image from "next/image";
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
          <Image 
            src="/assets/brand/final-01.png" 
            alt="Khael Tarotista Logo" 
            width={65} 
            height={65}
            priority
            className="landing-brand-logo-img"
            style={{ objectFit: "contain" }}
          />
        </Link>
        <div className="header-actions">
          
          <div className="header-user">
            <div className="header-avatar">
              {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
            </div>
            <div className="header-user-info">
              <span className="header-user-name">
                {user.name || user.email.split('@')[0]}
              </span>
              <span className="header-user-email">
                {user.email}
              </span>
            </div>
          </div>

          <div className="header-divider"></div>

          <ChangePasswordModal />

          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="header-logout-btn">
              Cerrar Sesión <span>→</span>
            </button>
          </form>
        </div>
      </header>

      <MisLecturasClient readings={readings} availableCards={tarotCards} />
    </div>
  );
}
