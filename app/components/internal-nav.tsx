import Link from "next/link";
import { LogoutButton } from "@/app/components/logout-button";

export function InternalNav() {
  return (
    <header className="internal-nav">
      <Link href="/dashboard" className="brand">
        <span className="brand-mark">✦</span>
        <span>CodexKhael</span>
      </Link>
      <nav className="internal-links">
        <Link href="/dashboard">Panel</Link>
        <Link href="/cartas">Cartas</Link>
        <Link href="/tiradas">Tiradas</Link>
        <Link href="/diario">Diario / Bitácora</Link>
      </nav>
      <LogoutButton />
    </header>
  );
}
