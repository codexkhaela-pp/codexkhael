import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import type { PlanTier } from "@/lib/plans";

export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";

function normalizePlan(plan: string | null | undefined): PlanTier | null {
  if (plan === "FREE" || plan === "BASIC" || plan === "PRO") {
    return plan;
  }
  return null;
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
    select: { userPlan: true },
  });

  return NextResponse.json({
    valid: true,
    email: user.email,
    plan: normalizePlan(profile?.userPlan),
  });
}
