import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { ensureChallengeIsNatural } from "../../route";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ attemptId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { attemptId } = await context.params;

  const attempt = await prisma.userChallengeAttempt.findFirst({
    where: {
      id: attemptId,
      userId: user.id,
    },
    include: {
      challenge: {
        include: {
          questions: {
            orderBy: { order: "asc" },
          },
        },
      },
      answers: true,
    },
  });

  if (!attempt) {
    return NextResponse.json({ error: "Intento no encontrado" }, { status: 404 });
  }

  if (attempt.challenge) {
    attempt.challenge = await ensureChallengeIsNatural(attempt.challenge);
  }

  return NextResponse.json({ attempt });
}
