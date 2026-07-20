"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { StudentMaintenanceModal } from "@/app/components/student-maintenance-modal";

type PanelShellGateProps = {
  children: ReactNode;
  isStudent?: boolean;
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
    pathname.startsWith("/planes")
  );
}

export function PanelShellGate({ children, isStudent }: PanelShellGateProps) {
  const pathname = usePathname() ?? "/";

  if (!isPanelRoute(pathname)) {
    return <>{children}</>;
  }

  if (isStudent) {
    return <StudentMaintenanceModal />;
  }

  return <DashboardShell>{children}</DashboardShell>;
}
