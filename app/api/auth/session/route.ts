import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";

export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";

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
    plan: profile?.userPlan || "FREE"
  });
}
