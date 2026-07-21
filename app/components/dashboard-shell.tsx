"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DashboardSidebar } from "@/app/components/dashboard-sidebar";
import { DashboardTopHeader } from "@/app/components/dashboard-top-header";
import styles from "./dashboard-shell.module.css";

type DashboardShellProps = {
  children: ReactNode;
  isAdmin?: boolean;
};

function resolveActiveKey(pathname: string): string {
  if (pathname.startsWith("/cartas")) return "cartas";
  if (pathname.startsWith("/tiradas")) return "tiradas";
  if (pathname.startsWith("/bitacora")) return "bitacora";
  if (pathname.startsWith("/diario")) return "bitacora";
  if (pathname.startsWith("/aprendizaje")) return "repaso";
  if (pathname.startsWith("/desafios")) return "desafios";
  if (pathname.startsWith("/ajustes")) return "ajustes";
  if (pathname.startsWith("/admin/lecturas")) return "consultantes";
  return "inicio";
}

export function DashboardShell({ children, isAdmin }: DashboardShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const pathname = usePathname() ?? "/";
  const activeKey = resolveActiveKey(pathname);
  const lockContentScroll = pathname.startsWith("/dashboard-preview");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1024px)");
    const syncViewport = () => {
      const nextIsMobile = mediaQuery.matches;
      setIsMobileViewport(nextIsMobile);
      if (!nextIsMobile) {
        setMobileSidebarOpen(false);
      }
    };

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);

    return () => {
      mediaQuery.removeEventListener("change", syncViewport);
    };
  }, []);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  function handleToggleSidebar() {
    if (isMobileViewport) {
      setMobileSidebarOpen((prev) => !prev);
      return;
    }

    setSidebarCollapsed((prev) => !prev);
  }

  return (
    <div className={styles.shell}>
      <DashboardSidebar
        activeKey={activeKey}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        isAdmin={isAdmin}
      />
      {mobileSidebarOpen ? (
        <button
          type="button"
          className={styles.mobileBackdrop}
          aria-label="Cerrar navegacion"
          onClick={() => setMobileSidebarOpen(false)}
        />
      ) : null}
      <div
        className={`${styles.content} ${sidebarCollapsed ? styles.contentCollapsed : ""} ${
          lockContentScroll ? styles.contentLocked : ""
        }`}
        style={{
          overflowY: lockContentScroll ? "hidden" : "auto",
        }}
      >
        <DashboardTopHeader
          isSidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={handleToggleSidebar}
        />
        {children}
      </div>
    </div>
  );
}
