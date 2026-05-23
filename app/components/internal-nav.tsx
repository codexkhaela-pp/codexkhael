import Link from "next/link";
import { LogoutButton } from "@/app/components/logout-button";
import { SessionGuard } from "@/app/components/session-guard";
import { getCurrentUser } from "@/lib/auth-server";

export async function InternalNav() {
  const user = await getCurrentUser();

  return (
    <header className="internal-nav">
      <SessionGuard />
      <Link href="/dashboard-preview" className="brand">
        <span className="brand-mark">✦</span>
        <span>CodexKhael</span>
      </Link>
      <nav className="internal-links">
        <Link href="/dashboard-preview">Panel</Link>
        <Link href="/cartas">Cartas</Link>
        <Link href="/tiradas">Tiradas</Link>
        <Link href="/diario">Diario / Bitácora</Link>
      </nav>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {user ? (
          <span style={{ fontSize: "0.72rem", color: "var(--muted)", opacity: 0.7 }}>
            Demo privada para {user.email}
          </span>
        ) : null}
        <LogoutButton />
      </div>
    </header>
  );
}
