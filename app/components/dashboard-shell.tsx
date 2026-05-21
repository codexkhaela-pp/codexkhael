"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DashboardSidebar } from "@/app/components/dashboard-sidebar";
import { DashboardTopHeader } from "@/app/components/dashboard-top-header";
import styles from "./dashboard-shell.module.css";

type DashboardShellProps = {
  children: ReactNode;
};

function resolveActiveKey(pathname: string): string {
  if (pathname.startsWith("/cartas")) return "cartas";
  if (pathname.startsWith("/tiradas")) return "tiradas";
  if (pathname.startsWith("/diario")) return "bitacora";
  if (pathname.startsWith("/aprendizaje")) return "repaso";
  if (pathname.startsWith("/desafios")) return "desafios";
  if (pathname.startsWith("/ajustes")) return "ajustes";
  return "inicio";
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname() ?? "/";
  const sidebarWidth = sidebarCollapsed ? 86 : 260;
  const activeKey = resolveActiveKey(pathname);
  const lockContentScroll = pathname.startsWith("/dashboard-preview");

  return (
    <div
      className={styles.shell}
      style={{
        display: "flex",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <DashboardSidebar activeKey={activeKey} collapsed={sidebarCollapsed} />
      <div
        className={`${styles.content} ${sidebarCollapsed ? styles.contentCollapsed : ""}`}
        style={{
          flex: 1,
          width: `calc(100% - ${sidebarWidth}px)`,
          maxWidth: `calc(100% - ${sidebarWidth}px)`,
          minWidth: 0,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          overflowX: "hidden",
          overflowY: lockContentScroll ? "hidden" : "auto",
        }}
      >
        <DashboardTopHeader
          isSidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
        />
        {children}
      </div>
    </div>
  );
}

