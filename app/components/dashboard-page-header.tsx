import type { ReactNode } from "react";

type DashboardPageHeaderProps = {
  kicker?: string;
  title: string;
  description?: ReactNode;
};

export function DashboardPageHeader({
  kicker,
  title,
  description,
}: DashboardPageHeaderProps) {
  return (
    <section className="app-header" style={{ maxWidth: "800px" }}>
      {kicker && <p className="landing-kicker">{kicker}</p>}
      <h1 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "clamp(38px, 4.5vw, 64px)", lineHeight: 0.98, letterSpacing: "-0.04em", margin: "0 0 16px", color: "var(--landing-ink)" }}>
        {title}
      </h1>
      {description ? <p className="landing-hero__lead">{description}</p> : null}
    </section>
  );
}
