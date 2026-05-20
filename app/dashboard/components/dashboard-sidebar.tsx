"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/app/components/logout-button";

type SidebarItem = {
  id: string;
  label: string;
  icon: string;
  href?: string;
};

const sidebarItems: SidebarItem[] = [
  { id: "inicio", label: "Inicio", icon: "\u2302", href: "/dashboard" },
  { id: "cursos", label: "Cursos", icon: "\u25a1" },
  { id: "cartas", label: "Cartas", icon: "\u2736", href: "/cartas" },
  { id: "tiradas", label: "Tiradas", icon: "\u2609", href: "/tiradas" },
  { id: "bitacora", label: "Bitacora", icon: "\u270d", href: "/diario" },
  { id: "repaso", label: "Repaso", icon: "\u263e" },
  { id: "desafios", label: "Desafios", icon: "\u2691" },
  { id: "comunidad", label: "Comunidad", icon: "\u2637" },
  { id: "recursos", label: "Recursos", icon: "\u2726" },
  { id: "ajustes", label: "Ajustes", icon: "\u2699" },
];

function isActive(pathname: string, href?: string) {
  if (!href) return false;
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="db-sidebar" aria-label="Navegacion principal">
      <Link href="/dashboard" className="db-sidebar-brand" aria-label="Logo CodexKhael">
        <Image
          src="/logo-codexkhael.png"
          alt="Logo CodexKhael"
          width={210}
          height={86}
          className="db-sidebar-logo"
          priority
        />
      </Link>

      <nav className="db-sidebar-nav">
        {sidebarItems.map((item) => {
          const active = isActive(pathname, item.href);
          if (!item.href) {
            return (
              <span
                key={item.id}
                className="db-sidebar-link db-sidebar-link-disabled"
                aria-disabled="true"
                title="Modulo en preparacion"
              >
                <span className="db-sidebar-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="db-sidebar-label">{item.label}</span>
              </span>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`db-sidebar-link${active ? " is-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <span className="db-sidebar-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="db-sidebar-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="db-sidebar-footer">
        <article className="db-sidebar-quote" aria-hidden="true">
          <p>
            El tarot no predice
            <br />
            el futuro, ilumina
            <br />
            el camino para que
            <br />
            tomes mejores
            <br />
            decisiones hoy.
          </p>
        </article>
        <LogoutButton />
      </div>
    </aside>
  );
}
