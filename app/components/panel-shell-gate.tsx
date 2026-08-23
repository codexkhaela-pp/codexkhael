"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { DashboardShell } from "@/app/components/dashboard-shell";


type PanelShellGateProps = {
  children: ReactNode;
  isStudent?: boolean;
  isAdmin?: boolean;
  isOnlyClient?: boolean;
};

function isPanelRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/dashboard-preview") ||
    pathname.startsWith("/cartas") ||
    pathname.startsWith("/tiradas") ||
    pathname.startsWith("/diario") ||
    pathname.startsWith("/bitacora") ||
    pathname.startsWith("/desafios") ||
    pathname.startsWith("/aprendizaje") ||
    pathname.startsWith("/ajustes") ||
    pathname.startsWith("/planes") ||
    pathname.startsWith("/admin")
  );
}

export function PanelShellGate({ children, isStudent, isAdmin, isOnlyClient }: PanelShellGateProps) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();

  useEffect(() => {
    if (isPanelRoute(pathname) && isOnlyClient) {
      router.replace("/mis-lecturas");
    }
  }, [pathname, isOnlyClient, router]);

  if (!isPanelRoute(pathname)) {
    return <>{children}</>;
  }

  if (isOnlyClient) {
    return null; // Evitar renderizar el layout mientras redirige
  }

  return <DashboardShell isAdmin={isAdmin}>{children}</DashboardShell>;
}
