import { PLAN_LIMITS, resolvePlanTier } from "@/lib/plans";
import type { UserProfile } from "@/src/generated/prisma/client";

export type LimitResult = {
  allowed: boolean;
  reason?: string;
  limit?: number;
  current?: number;
};

/**
 * Checks whether the user can make an AI interpretation request.
 * Always call resetIfNeeded() BEFORE this.
 */
export function canUseAI(profile: UserProfile): LimitResult {
  const tier = resolvePlanTier(profile.userPlan);
  const { aiPerDay: limit } = PLAN_LIMITS[tier];

  if (limit >= Number.MAX_SAFE_INTEGER) {
    return { allowed: true };
  }

  const current = profile.dailyAiCount;
  if (current >= limit) {
    return {
      allowed: false,
      reason: `Alcanzaste el límite diario de ${limit} consultas IA (plan ${tier}).`,
      limit,
      current,
    };
  }

  return { allowed: true, limit, current };
}

/**
 * Checks whether the user can create a new tarot reading.
 * Always call resetIfNeeded() BEFORE this.
 */
export function canCreateReading(profile: UserProfile): LimitResult {
  const tier = resolvePlanTier(profile.userPlan);
  const { readingsPerDay: limit } = PLAN_LIMITS[tier];

  if (limit >= Number.MAX_SAFE_INTEGER) {
    return { allowed: true };
  }

  const current = profile.dailyReadingCount;
  if (current >= limit) {
    return {
      allowed: false,
      reason: `Alcanzaste el límite diario de ${limit} tiradas (plan ${tier}).`,
      limit,
      current,
    };
  }

  return { allowed: true, limit, current };
}

/**
 * Checks whether the user can add a new bitácora entry (total cap, not daily).
 * Does NOT need resetIfNeeded() — this is a total count, not a daily counter.
 */
export function canCreateBitacoraEntry(
  profile: UserProfile,
  currentCount: number
): LimitResult {
  const tier = resolvePlanTier(profile.userPlan);
  const { bitacoraLimit: limit } = PLAN_LIMITS[tier];

  if (limit === -1) {
    return { allowed: true };
  }

  if (currentCount >= limit) {
    return {
      allowed: false,
      reason: `Alcanzaste el límite de ${limit} entradas en la bitácora (plan ${tier}).`,
      limit,
      current: currentCount,
    };
  }

  return { allowed: true, limit, current: currentCount };
}
