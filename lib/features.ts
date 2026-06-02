import { PlanTier } from "./plans";

export const SPREAD_ACCESS_BY_PLAN: Record<PlanTier, string[]> = {
  FREE: [
    "situation-blockage-advice", // 3 cartas (Tiradas)
    "three-cards"                // 3 cartas (Diario)
  ],
  BASIC: [
    "situation-blockage-advice", // 3 cartas (Tiradas)
    "three-cards",               // 3 cartas (Diario)
    "five-cards",                // 5 cartas (Tiradas & Diario)
    "horseshoe",                 // Herradura (Tiradas & Diario)
    "celtic-cross",              // Cruz Celta (Tiradas & Diario)
    "line-seven"                 // Línea de 7 cartas (Tiradas)
  ],
  PRO: ["*"], // Todas las tiradas permitidas
};

export const MANUAL_SPREAD_ID = "manual-free";

export const MANUAL_SPREAD_MAX_CARDS_BY_PLAN: Record<PlanTier, number> = {
  FREE: 3,
  BASIC: 10,
  PRO: 10,
};

export function canUseSpread(plan: string | null | undefined, spreadId: string): boolean {
  const planTier = plan === "BASIC" || plan === "PRO" ? plan : "FREE";
  const allowedSpreads = SPREAD_ACCESS_BY_PLAN[planTier as PlanTier] || [];
  
  if (allowedSpreads.includes("*")) {
    return true;
  }
  
  return allowedSpreads.includes(spreadId);
}

export function getManualSpreadMaxCards(plan: string | null | undefined): number {
  const planTier = plan === "BASIC" || plan === "PRO" ? plan : "FREE";
  return MANUAL_SPREAD_MAX_CARDS_BY_PLAN[planTier as PlanTier];
}

export function canUseManualSpreadCardCount(plan: string | null | undefined, count: number): boolean {
  if (!Number.isInteger(count) || count < 1) {
    return false;
  }

  return count <= getManualSpreadMaxCards(plan);
}
