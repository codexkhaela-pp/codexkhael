import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { mapBitacoraEntryToJournalEntry } from "@/app/api/diario/_lib/bitacora-mapper";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const entry = await prisma.bitacoraEntry.findFirst({
    where: { id, userId: user.id },
    include: { reReadings: { orderBy: { createdAt: "asc" } } },
  });

  if (!entry) {
    return NextResponse.json({ error: "Entrada no encontrada" }, { status: 404 });
  }

  return NextResponse.json({ entry: mapBitacoraEntryToJournalEntry(entry) });
}

export async function DELETE(_: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const entry = await prisma.bitacoraEntry.findFirst({
    where: { id, userId: user.id },
  });

  if (!entry) {
    return NextResponse.json({ error: "Entrada no encontrada o no tienes permisos" }, { status: 404 });
  }

  await prisma.bitacoraEntry.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}