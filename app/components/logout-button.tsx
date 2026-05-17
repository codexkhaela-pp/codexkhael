"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function onLogout() {
    setIsLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      className="btn btn-secondary internal-nav-button"
      onClick={onLogout}
      disabled={isLoading}
    >
      {isLoading ? "Saliendo..." : "Cerrar sesión"}
    </button>
  );
}

