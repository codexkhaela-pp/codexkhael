import Link from "next/link";
import type { ProgressStats } from "@/lib/dashboard-mock";

interface ProgressCardProps {
  stats: ProgressStats;
}

export function ProgressCard({ stats }: ProgressCardProps) {
  // SVG circular progress
  const r = 42;
  const circ = 2 * Math.PI * r;
  const offset = circ - (stats.progressPercent / 100) * circ;

  return (
    <article className="db-card db-card-full" aria-label="Mi Progreso">
      <div className="db-card-header">
        <span className="db-card-icon">◈</span>
        <h2 className="db-card-title">Mi Progreso</h2>
        <span className="db-card-badge">Nv. {stats.levelNumber}</span>
      </div>

      <div className="db-progress-body">
        {/* Circular progress — gradient ring */}
        <div className="db-progress-ring-wrap" aria-label={`${stats.progressPercent}% completado`}>
          <svg width="108" height="108" viewBox="0 0 108 108" aria-hidden="true">
            <defs>
              {/* Gold gradient for the arc */}
              <linearGradient id="ring-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e8c47d" />
                <stop offset="55%" stopColor="#C9A66B" />
                <stop offset="100%" stopColor="#a07d40" />
              </linearGradient>
              {/* Glow filter */}
              <filter id="ring-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* Track */}
            <circle
              cx="54" cy="54" r={r}
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth="7"
            />
            {/* Progress arc — gradient + glow */}
            <circle
              cx="54" cy="54" r={r}
              fill="none"
              stroke="url(#ring-gold)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              transform="rotate(-90 54 54)"
              filter="url(#ring-glow)"
              style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1)" }}
            />
          </svg>
          <div className="db-progress-ring-center">
            <span className="db-progress-pct">{stats.progressPercent}%</span>
            <span className="db-progress-pct-label">completado</span>
          </div>
        </div>

        {/* Level info */}
        <div className="db-progress-info">
          <p className="db-progress-level-label">Nivel actual</p>
          <p className="db-progress-level">{stats.level}</p>
          <div className="db-progress-next">
            <span className="db-progress-next-label">Siguiente nivel: {stats.nextLevel}</span>
            <div className="db-progress-bar-track" role="progressbar" aria-valuenow={100 - stats.progressPercent} aria-valuemin={0} aria-valuemax={100}>
              <div
                className="db-progress-bar-fill"
                style={{ width: `${100 - stats.progressPercent}%` }}
              />
            </div>
            <span className="db-progress-next-pct">{100 - stats.progressPercent}%</span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="db-stats-grid">
        <div className="db-stat">
          <span className="db-stat-value">{stats.modulesCompleted} <span className="db-stat-total">/ {stats.modulesTotal}</span></span>
          <span className="db-stat-label">Módulos completados</span>
        </div>
        <div className="db-stat">
          <span className="db-stat-value">{stats.lessonsCompleted} <span className="db-stat-total">/ {stats.lessonsTotal}</span></span>
          <span className="db-stat-label">Lecciones completadas</span>
        </div>
        <div className="db-stat">
          <span className="db-stat-value">{stats.cardsStudied} <span className="db-stat-total">/ {stats.cardsTotal}</span></span>
          <span className="db-stat-label">Cartas estudiadas</span>
        </div>
      </div>

      <Link href="/progreso" className="db-card-btn" id="btn-ver-progreso">
        Ver mi progreso
      </Link>
    </article>
  );
}
