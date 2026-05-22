/**
 * Central plan limits configuration — SINGLE SOURCE OF TRUTH.
 * ALL limit checks MUST read from this file. Never hardcode limits elsewhere.
 *
 * PlanTier  = commercial tier (what the user can DO)
 * BillingType = how the user pays (MONTHLY / YEARLY / ONE_TIME) — stored separately
 */

export type PlanTier = "FREE" | "BASIC" | "PRO";

export type PlanLimits = {
  /** Max AI interpretations per day. Use Number.MAX_SAFE_INTEGER for unlimited. */
  aiPerDay: number;
  /** Max tarot readings per day. Use Number.MAX_SAFE_INTEGER for unlimited. */
  readingsPerDay: number;
  /** Max bitácora entries in total. -1 = unlimited. */
  bitacoraLimit: number;
};

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  FREE: {
    aiPerDay: 5,
    readingsPerDay: 3,
    bitacoraLimit: 20,
  },
  BASIC: {
    aiPerDay: 20,
    readingsPerDay: 10,
    bitacoraLimit: -1,
  },
  PRO: {
    aiPerDay: 200,
    readingsPerDay: 200,
    bitacoraLimit: -1,
  },
};

/**
 * Normalise any value coming from Prisma's PlanTier enum to a valid PlanTier key.
 * If the value is unrecognised or null, defaults to FREE (most restrictive).
 */
export function resolvePlanTier(plan: string | null | undefined): PlanTier {
  if (plan === "BASIC" || plan === "PRO") return plan;
  return "FREE";
}
