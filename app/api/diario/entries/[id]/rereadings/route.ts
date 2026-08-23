import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import {
  decodeRereadingComment,
  encodeRereadingComment,
  mapBitacoraEntryToJournalEntry,
  normalizeRereadingFulfilledStatus,
  type ApiCreateRereadingBody,
} from "@/app/api/diario/_lib/bitacora-mapper";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id: bitacoraEntryId } = await params;

  const ownerEntry = await prisma.bitacoraEntry.findFirst({
    where: { id: bitacoraEntryId, userId: user.id },
    select: { id: true },
  });

  if (!ownerEntry) {
    return NextResponse.json({ error: "Entrada no encontrada o sin permisos" }, { status: 404 });
  }

  let body: ApiCreateRereadingBody;
  try {
    body = (await request.json()) as ApiCreateRereadingBody;
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const didComeTrue = body.didComeTrue ?? "pendiente";
  const fulfilled = normalizeRereadingFulfilledStatus(didComeTrue);
  const comment = encodeRereadingComment(body.comment, didComeTrue);

  await prisma.bitacoraReReading.create({
    data: {
      bitacoraEntryId: ownerEntry.id,
      userId: user.id,
      fulfilled,
      comment,
      reflection: body.reflection?.trim() || null,
      newInterpretation: body.newInterpretation?.trim() || null,
      lessonLearned: body.lessonLearned?.trim() || null,
      recordType: body.recordType ?? "REREADING",
    },
  });

  const updatedEntry = await prisma.bitacoraEntry.findFirst({
    where: { id: ownerEntry.id, userId: user.id },
    include: { reReadings: { orderBy: { createdAt: "asc" } } },
  });

  if (!updatedEntry) {
    return NextResponse.json({ error: "No se pudo cargar la entrada actualizada" }, { status: 500 });
  }

  const last = updatedEntry.reReadings[updatedEntry.reReadings.length - 1];
  const decoded = decodeRereadingComment(last?.comment ?? "");

  return NextResponse.json(
    {
      entry: mapBitacoraEntryToJournalEntry(updatedEntry),
      rereading: {
        id: last?.id,
        didComeTrue:
          decoded.didComeTrue ??
          (last?.fulfilled === true ? "si" : last?.fulfilled === false ? "no" : "pendiente"),
      },
    },
    { status: 201 },
  );
}