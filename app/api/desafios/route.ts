import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { normalizeChallengeType } from "@/lib/desafios/service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const type = normalizeChallengeType(url.searchParams.get("type"));
  const includeInactive = url.searchParams.get("includeInactive") === "true";
  const now = new Date();

  const challenges = await prisma.challenge.findMany({
    where: {
      ...(type ? { type } : {}),
      ...(includeInactive
        ? {}
        : {
            isActive: true,
            OR: [{ activeFrom: null }, { activeFrom: { lte: now } }],
            AND: [{ OR: [{ activeTo: null }, { activeTo: { gte: now } }] }],
          }),
    },
    include: {
      questions: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: [{ isDaily: "desc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({
    items: challenges.map((challenge) => ({
      ...challenge,
      questionCount: challenge.questions.length,
    })),
  });
}
