import { prisma } from "@/lib/prisma";
import type { UserProfile } from "@/src/generated/prisma/client";

/**
 * Checks if the user's daily counters need to be reset (new UTC calendar day).
 * Always persists the reset to the DB when a new day is detected.
 * Returns the updated profile (either from DB or the original if no reset needed).
 *
 * MUST be called BEFORE any canUse*() check.
 */
export async function resetIfNeeded(profile: UserProfile): Promise<UserProfile> {
  const now = new Date();
  const todayKey = toDateKey(now);

  // Use lastAiReset as the single source for day comparison.
  // If it has never been set, a reset is also needed.
  const lastResetKey = profile.lastAiReset ? toDateKey(profile.lastAiReset) : null;

  if (lastResetKey === todayKey) {
    // Already reset today — return the profile as-is (no DB call needed)
    return profile;
  }

  // New day detected → reset both counters atomically in the DB
  const updated = await prisma.userProfile.update({
    where: { id: profile.id },
    data: {
      dailyAiCount: 0,
      dailyReadingCount: 0,
      lastAiReset: now,
      lastReadingReset: now,
    },
  });

  return updated;
}

/**
 * Returns a YYYY-MM-DD string in UTC.
 * Using UTC ensures consistency regardless of the server's local timezone.
 */
function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
