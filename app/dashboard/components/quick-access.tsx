import Link from "next/link";
import type { QuickAccess } from "@/lib/dashboard-mock";

interface QuickAccessProps {
  items: QuickAccess[];
}

export function QuickAccessSection({ items }: QuickAccessProps) {
  return (
    <section className="db-section" aria-label="Accesos rapidos">
      <div className="db-section-header">
        <div>
          <h2 className="db-section-title">
            <span className="db-card-icon">⬡</span> Accesos Rapidos
          </h2>
        </div>
      </div>

      <div className="db-quick-grid" role="list">
        {items.map((item) => {
          const classes = `db-quick-item${item.disabled ? " is-disabled" : ""}${!item.href ? " is-static" : ""}`;
          const content = (
            <>
              <span className="db-quick-icon" aria-hidden="true">
                {item.icon}
              </span>
              <div className="db-quick-text">
                <span className="db-quick-label">{item.label}</span>
                <span className="db-quick-sub">{item.sub}</span>
              </div>
            </>
          );

          if (!item.href || item.disabled) {
            return (
              <span key={item.id} className={classes} id={`btn-quick-${item.id}`} role="listitem" aria-disabled="true">
                {content}
              </span>
            );
          }

          return (
            <Link key={item.id} href={item.href} className={classes} id={`btn-quick-${item.id}`} role="listitem">
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
