"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./dashboard-top-header.module.css";

type DashboardTopHeaderProps = {
  avatarSrc?: string;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
};

export function DashboardTopHeader({
  avatarSrc = "/assets/avatar/mago1.png",
  isSidebarCollapsed = false,
  onToggleSidebar,
}: DashboardTopHeaderProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [plan, setPlan] = useState<string>("FREE");

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.valid && data.plan) {
          setPlan(data.plan);
        }
      })
      .catch((err) => console.error("Failed to fetch plan:", err));
  }, []);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, []);

  async function onLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setMenuOpen(false);
      router.push("/login");
      router.refresh();
      setIsLoggingOut(false);
    }
  }

  return (
    <header className={styles.topHeader}>
      <button
        className={styles.menuToggleBtn}
        type="button"
        aria-label={isSidebarCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        onClick={onToggleSidebar}
      >
        ☰
      </button>

      <div className={styles.headerRight}>
        <div className={styles.userMenu} ref={menuRef}>
          <div className={styles.avatarContainer}>
            <button
              type="button"
              className={styles.userMiniAvatar}
              aria-label="Abrir menú de usuario"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <img src={avatarSrc} alt="Avatar" />
            </button>
            <div className={`${styles.planPill} ${styles[`planPill${plan}`] || styles.planPillFREE}`}>
              {plan}
            </div>
          </div>

          {menuOpen ? (
            <div className={styles.userDropdown} role="menu" aria-label="Menú de usuario">
              <button type="button" className={styles.userDropdownItem} onClick={onLogout} disabled={isLoggingOut}>
                {isLoggingOut ? "Saliendo..." : "Cerrar sesión"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
