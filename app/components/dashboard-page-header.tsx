import type { ReactNode } from "react";

type DashboardPageHeaderProps = {
  kicker: string;
  title: string;
  description?: ReactNode;
};

export function DashboardPageHeader({
  kicker,
  title,
  description,
}: DashboardPageHeaderProps) {
  return (
    <section className="app-header">
      <div className="app-header-top">
      </div>
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
    </section>
  );
}
