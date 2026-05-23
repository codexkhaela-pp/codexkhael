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

export function canUseSpread(plan: string | null | undefined, spreadId: string): boolean {
  const planTier = plan === "BASIC" || plan === "PRO" ? plan : "FREE";
  const allowedSpreads = SPREAD_ACCESS_BY_PLAN[planTier as PlanTier] || [];
  
  if (allowedSpreads.includes("*")) {
    return true;
  }
  
  return allowedSpreads.includes(spreadId);
}
