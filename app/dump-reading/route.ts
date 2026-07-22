import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const reading = await prisma.clientReading.findFirst({
      orderBy: { createdAt: 'desc' },
      include: { cards: { orderBy: { positionIndex: "asc" } } }
    });
    return NextResponse.json(reading);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
