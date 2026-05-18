"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const CHECK_INTERVAL_MS = 15_000; // Check every 15 seconds

export function SessionGuard() {
  const router = useRouter();
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        if (res.status === 401) {
          // Session invalidated — clear cookie via logout then redirect
          if (intervalRef.current !== null) {
            window.clearInterval(intervalRef.current);
          }
          await fetch("/api/auth/logout", { method: "POST" });
          window.location.href = "/login";
        }
      } catch {
        // Network error — skip silently, retry next cycle
      }
    }

    // Check immediately on mount
    checkSession();

    // Then check periodically
    intervalRef.current = window.setInterval(checkSession, CHECK_INTERVAL_MS);

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [router]);

  return null;
}
