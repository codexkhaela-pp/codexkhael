import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return false;
  }

  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      ok: true,
      message: "Supabase keepalive executed",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Keepalive execution failed", {
  message: error instanceof Error ? error.message : "Unknown error",
});

    return NextResponse.json(
      {
        ok: false,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}
