"use client";

import { useState } from "react";
import { DashboardSidebar } from "@/app/components/dashboard-sidebar";
import { DashboardTopHeader } from "@/app/components/dashboard-top-header";
import { PreviewShadowContent } from "@/app/dashboard-preview/preview-shadow-content";

type DashboardPreviewShellProps = {
  logoSrc: string;
  avatarSrc: string;
  footerMessage: string;
  previewCss: string;
  mainInner: string;
};

export function DashboardPreviewShell({
  logoSrc,
  avatarSrc,
  footerMessage,
  previewCss,
  mainInner,
}: DashboardPreviewShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div
      className={`dashboardShell ${sidebarCollapsed ? "is-collapsed" : ""}`}
      style={{ display: "flex", height: "100vh", width: "100%", overflow: "hidden" }}
    >
      <DashboardSidebar logoSrc={logoSrc} activeKey="inicio" footerMessage={footerMessage} collapsed={sidebarCollapsed} />
      <div
        className="content-container mainContent"
        style={{
          flex: 1,
          height: "100vh",
          minWidth: 0,
          width: "auto",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <DashboardTopHeader
          avatarSrc={avatarSrc}
          isSidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
        />
        <PreviewShadowContent css={previewCss} html={mainInner} />
      </div>
    </div>
  );
}
