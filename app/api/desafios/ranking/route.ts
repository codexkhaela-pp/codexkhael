import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RankingPeriod = "weekly" | "monthly" | "global";

function getPeriodRange(period: RankingPeriod, now: Date) {
  if (period === "global") return null;

  if (period === "weekly") {
    const start = new Date(now);
    const day = start.getDay();
    const diff = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diff);
    start.setHours(0, 0, 0, 0);
    return { gte: start, lte: now };
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  return { gte: start, lte: now };
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const periodRaw = url.searchParams.get("period");
  const period: RankingPeriod =
    periodRaw === "weekly" || periodRaw === "monthly" || periodRaw === "global" ? periodRaw : "weekly";

  const range = getPeriodRange(period, new Date());

  const transactions = await prisma.userXpTransaction.findMany({
    where: {
      ...(range ? { createdAt: range } : {}),
    },
    select: {
      userId: true,
      xpAmount: true,
      user: {
        select: {
          email: true,
          profile: {
            select: {
              displayName: true,
            },
          },
        },
      },
    },
  });

  const sums = new Map<string, { xp: number; displayName: string }>();
  for (const row of transactions) {
    const current = sums.get(row.userId);
    const displayName = row.user.profile?.displayName || row.user.email.split("@")[0];
    if (!current) {
      sums.set(row.userId, { xp: row.xpAmount, displayName });
      continue;
    }
    current.xp += row.xpAmount;
  }

  const ranking = Array.from(sums.entries())
    .map(([userId, value]) => ({
      userId,
      displayName: value.displayName,
      xp: value.xp,
    }))
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 50)
    .map((item, index) => ({
      position: index + 1,
      ...item,
    }));

  return NextResponse.json({
    period,
    items: ranking,
  });
}
