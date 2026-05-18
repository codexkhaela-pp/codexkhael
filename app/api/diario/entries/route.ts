import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import {
  buildCardsJsonFromBody,
  mapBitacoraEntryToJournalEntry,
  toDateOnlyDateTime,
  type ApiCreateBitacoraBody,
} from "@/app/api/diario/_lib/bitacora-mapper";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const entries = await prisma.bitacoraEntry.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { reReadings: { orderBy: { createdAt: "asc" } } },
  });

  return NextResponse.json({ entries: entries.map(mapBitacoraEntryToJournalEntry) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body: ApiCreateBitacoraBody;
  try {
    body = (await request.json()) as ApiCreateBitacoraBody;
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const spreadType = body.metadata?.spreadType?.trim() ?? "";
  if (!spreadType) {
    return NextResponse.json({ error: "spreadType es obligatorio" }, { status: 400 });
  }

  const question = body.metadata?.question?.trim() ?? "";
  const readingDate = toDateOnlyDateTime(body.metadata?.date);
  const readingTime = body.metadata?.time?.trim() || null;
  const notes = body.notes?.trim() || body.reflection?.personalInterpretation?.trim() || null;
  const cardsJson = buildCardsJsonFromBody(body);

  const created = await prisma.bitacoraEntry.create({
    data: {
      userId: user.id,
      spreadType,
      question,
      readingDate,
      readingTime,
      notes,
      cardsJson,
    },
    include: { reReadings: { orderBy: { createdAt: "asc" } } },
  });

  return NextResponse.json({ entry: mapBitacoraEntryToJournalEntry(created) }, { status: 201 });
}
