"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

export function LandingHeader() {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Cierra el sidebar cuando cambia la ruta
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // Prevenir scroll cuando el sidebar está abierto
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  return (
    <header className="landing-header">
      <button 
        className="landing-mobile-menu-btn" 
        onClick={() => setIsSidebarOpen(true)}
        aria-label="Abrir menú"
      >
        <Menu size={28} />
      </button>

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

      <nav className="landing-nav" aria-label="Navegación principal">
        <Link href="/" className={pathname === "/" ? "is-active" : ""}>Inicio</Link>
        <Link href="/lecturas" className={pathname === "/lecturas" ? "is-active" : ""}>Lecturas</Link>
        <Link href="/carta-del-dia" className={pathname === "/carta-del-dia" ? "is-active" : ""}>Carta del Día</Link>
        <Link href="/codex-khael" className={pathname === "/codex-khael" ? "is-active" : ""}>Codex Khael</Link>
        <Link href="/acerca-de-mi" className={pathname === "/acerca-de-mi" ? "is-active" : ""}>Sobre mí</Link>
      </nav>

      <div className="landing-actions">
        <Link className="landing-access" href="/mis-lecturas/login" prefetch={false} style={{ background: 'transparent', borderColor: 'rgba(215, 173, 105, 0.4)' }}>
          Mis Lecturas <span>+</span>
        </Link>
        <Link className="landing-access" href="/login" prefetch={false}>
          Acceso a Codex <span>+</span>
        </Link>
      </div>

      {/* Sidebar Overlay */}
      <div 
        className={`landing-sidebar-backdrop ${isSidebarOpen ? "is-open" : ""}`} 
        onClick={() => setIsSidebarOpen(false)} 
      />

      {/* Sidebar Menu */}
      <div className={`landing-sidebar ${isSidebarOpen ? "is-open" : ""}`}>
        <div className="landing-sidebar-header">
          <Image 
            src="/assets/brand/final-01.png" 
            alt="Khael Tarotista Logo" 
            width={55} 
            height={55}
            className="landing-brand-logo-img"
            style={{ objectFit: "contain" }}
          />
          <button 
            className="landing-sidebar-close-btn"
            onClick={() => setIsSidebarOpen(false)} 
            aria-label="Cerrar menú"
          >
            <X size={28} />
          </button>
        </div>
        
        <nav className="landing-sidebar-nav">
          <Link href="/" className={pathname === "/" ? "is-active" : ""}>Inicio</Link>
          <Link href="/lecturas" className={pathname === "/lecturas" ? "is-active" : ""}>Lecturas</Link>
          <Link href="/carta-del-dia" className={pathname === "/carta-del-dia" ? "is-active" : ""}>Carta del Día</Link>
          <Link href="/codex-khael" className={pathname === "/codex-khael" ? "is-active" : ""}>Codex Khael</Link>
          <Link href="/acerca-de-mi" className={pathname === "/acerca-de-mi" ? "is-active" : ""}>Sobre mí</Link>
        </nav>

        <div className="landing-sidebar-actions">
          <Link className="landing-access" href="/mis-lecturas/login" prefetch={false} style={{ background: 'transparent', borderColor: 'rgba(215, 173, 105, 0.4)' }}>
            Mis Lecturas <span>+</span>
          </Link>
          <Link className="landing-access" href="/login" prefetch={false}>
            Acceso a Codex <span>+</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
