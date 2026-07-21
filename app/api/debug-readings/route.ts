import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const readings = await prisma.clientReading.findMany();
  const users = await prisma.user.findMany({ select: { id: true, email: true }});
  return NextResponse.json({ readings, users });
}
