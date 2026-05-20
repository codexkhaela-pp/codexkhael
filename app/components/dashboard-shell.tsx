import type { ReactNode } from "react";
import { DashboardSidebar } from "@/app/components/dashboard-sidebar";
import { DashboardTopHeader } from "@/app/components/dashboard-top-header";
import styles from "./dashboard-shell.module.css";

type DashboardShellProps = {
  activeKey?: string;
  children: ReactNode;
};

export function DashboardShell({ activeKey, children }: DashboardShellProps) {
  return (
    <div className={styles.shell}>
      <DashboardSidebar activeKey={activeKey} />
      <div className={styles.content}>
        <DashboardTopHeader />
        {children}
      </div>
    </div>
  );
}
