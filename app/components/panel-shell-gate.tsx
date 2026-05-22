"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DashboardShell } from "@/app/components/dashboard-shell";

type PanelShellGateProps = {
  children: ReactNode;
};

function isPanelRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/dashboard-preview") ||
    pathname.startsWith("/cartas") ||
    pathname.startsWith("/tiradas") ||
    pathname.startsWith("/diario") ||
    pathname.startsWith("/desafios") ||
    pathname.startsWith("/aprendizaje") ||
    pathname.startsWith("/ajustes") ||
    pathname.startsWith("/planes")
  );
}

export function PanelShellGate({ children }: PanelShellGateProps) {
  const pathname = usePathname() ?? "/";

  if (!isPanelRoute(pathname)) {
    return <>{children}</>;
  }

  return <DashboardShell>{children}</DashboardShell>;
}

