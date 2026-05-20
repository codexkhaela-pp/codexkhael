import Image from "next/image";
import type { AuthenticatedUser } from "@/lib/auth-server";
import type { ProgressStats } from "@/lib/dashboard-mock";

interface DashboardHeaderProps {
  user: AuthenticatedUser | null;
  stats: ProgressStats;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 18) return "Buenas tardes";
  return "Buenas noches";
}

function getDisplayName(email: string) {
  const name = email.split("@")[0] ?? "";
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function getAvatarUrl(displayName: string, level: number): string {
  const lowerName = displayName.toLowerCase();
  const firstName = lowerName.split(" ")[0] || "";
  const isFemale =
    firstName.startsWith("elara") ||
    firstName.startsWith("valeria") ||
    firstName.startsWith("camila") ||
    firstName.startsWith("sofia") ||
    firstName.endsWith("a");

  const genderPrefix = isFemale ? "maga" : "mago";

  let levelSuffix = "1";
  if (level >= 46 && level <= 85) {
    levelSuffix = "2";
  } else if (level >= 86) {
    levelSuffix = "3";
  }

  return `/assets/avatar/${genderPrefix}${levelSuffix}.png`;
}

export function DashboardHeader({ user, stats }: DashboardHeaderProps) {
  const displayName = user ? getDisplayName(user.email) : "Elara Vance";
  const greeting = getGreeting();
  const streakPct = Math.min(((stats.streakDays % 30) / 30) * 100, 100);
  const avatarSrc = getAvatarUrl(displayName, stats.levelNumber);

  return (
    <header className="db-header" aria-label="Encabezado del dashboard">
      {/* ── Identity ── */}
      <div className="db-header-identity">
        <div className="db-avatar" aria-label={`Avatar de ${displayName}`}>
          <Image
            src={avatarSrc}
            alt={displayName}
            width={140}
            height={140}
            className="db-avatar-img"
            priority
          />
          <span className="db-avatar-level" aria-label={`Nivel ${stats.levelNumber}`}>
            {stats.levelNumber}
          </span>
        </div>
        <div className="db-header-text">
          <p className="db-header-greeting">Bienvenid@ de nuevo,</p>
          <h1 className="db-header-name">{displayName}</h1>
          <p className="db-header-sub">
            {greeting}. Sigue tu camino. Cada carta es una enseñanza.
          </p>
        </div>
      </div>

      <div className="db-header-center" aria-hidden="true" />

      {/* ── Streak card ── */}
      <div className="db-header-right">
        <div
          className="db-streak-card"
          aria-label={`Racha de aprendizaje: ${stats.streakDays} días`}
        >
          {/* Title */}
          <p className="db-streak-label">RACHA DE APRENDIZAJE</p>

          {/* Main value: 🔥 + number + unit */}
          <div className="db-streak-value">
            <span className="db-streak-icon" aria-hidden="true">🔥</span>
            <span className="db-streak-days">{stats.streakDays}</span>
            <span className="db-streak-unit">días</span>
          </div>

          {/* Bottom row: message + bar + star */}
          <div className="db-streak-bottom">
            <span className="db-streak-message">¡Sigue así!</span>
            <div
              className="db-streak-bar-track"
              role="progressbar"
              aria-valuenow={streakPct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="db-streak-bar-fill"
                style={{ width: `${streakPct}%` }}
              />
            </div>
            <span className="db-streak-star" aria-hidden="true">✦</span>
          </div>
        </div>
      </div>
    </header>
  );
}
