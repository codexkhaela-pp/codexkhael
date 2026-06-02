"use client";

import { useEffect, useState } from "react";
import type { PlanTier } from "@/lib/plans";

export type AuthSessionStatus = "loading" | "authenticated" | "unauthenticated";

export type AuthSessionState = {
  status: AuthSessionStatus;
  email: string | null;
  plan: PlanTier | null;
};

type SessionResponse = {
  valid?: boolean;
  email?: string;
  plan?: string | null;
};

function normalizePlan(plan: string | null | undefined): PlanTier | null {
  if (plan === "FREE" || plan === "BASIC" || plan === "PRO") {
    return plan;
  }
  return null;
}

export function useAuthSession(): AuthSessionState {
  const [state, setState] = useState<AuthSessionState>({
    status: "loading",
    email: null,
    plan: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
          credentials: "same-origin",
        });

        const data = (await response.json().catch(() => null)) as SessionResponse | null;
        if (cancelled) {
          return;
        }

        if (!response.ok || !data?.valid) {
          setState({
            status: "unauthenticated",
            email: null,
            plan: null,
          });
          return;
        }

        setState({
          status: "authenticated",
          email: typeof data.email === "string" ? data.email : null,
          plan: normalizePlan(data.plan),
        });
      } catch {
        if (!cancelled) {
          setState({
            status: "unauthenticated",
            email: null,
            plan: null,
          });
        }
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
