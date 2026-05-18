import type { BitacoraEntry, BitacoraReReading } from "@/src/generated/prisma/client";
import type { JournalEntry, JournalRereading } from "@/app/diario/types";

export const CURRENT_TEMP_USER_EMAIL = "codexkhael.app@gmail.com";

export type ApiCreateBitacoraBody = {
  metadata?: {
    consultantName?: string;
    date?: string;
    time?: string;
    place?: string;
    emotionalState?: string;
    spreadType?: string;
    question?: string;
  };
  reflection?: {
    personalInterpretation?: string;
    finalMessage?: string;
    suggestedAction?: string;
  };
  canvas?: {
    spreadType?: string;
    spreadId?: string;
    canvasWidth?: number;
    canvasHeight?: number;
    placements?: Array<{
      id?: string;
      cardId?: string;
      cardName?: string;
      image?: string;
      isReversed?: boolean;
      positionId?: string;
      positionName?: string;
      x?: number;
      y?: number;
      order?: number;
      meaningUsed?: string;
      orientation?: "derecha" | "invertida";
      rotation?: number;
    }>;
  };
  notes?: string;
  flipStats?: unknown;
  flipEvents?: unknown;
  createdAt?: string;
};

export type ApiCreateRereadingBody = {
  didComeTrue?: "si" | "no" | "parcial" | "pendiente";
  comment?: string;
  reflection?: string;
  newInterpretation?: string;
  lessonLearned?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function toDateOnlyDateTime(date: string | undefined): Date {
  if (!date) {
    return new Date();
  }

  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }

  return parsed;
}

export function buildCardsJsonFromBody(body: ApiCreateBitacoraBody) {
  const metadata = body.metadata ?? {};
  const reflection = body.reflection ?? {};
  const placements = Array.isArray(body.canvas?.placements) ? body.canvas?.placements : [];

  return {
    version: 1,
    metadata: {
      consultantName: metadata.consultantName ?? "",
      place: metadata.place ?? "",
      emotionalState: metadata.emotionalState ?? "",
      spreadType: metadata.spreadType ?? "",
      question: metadata.question ?? "",
      date: metadata.date ?? "",
      time: metadata.time ?? "",
    },
    reflection: {
      personalInterpretation: reflection.personalInterpretation ?? "",
      finalMessage: reflection.finalMessage ?? "",
      suggestedAction: reflection.suggestedAction ?? "",
    },
    canvas: {
      spreadType: body.canvas?.spreadType ?? metadata.spreadType ?? "",
      spreadId: body.canvas?.spreadId,
      canvasWidth: typeof body.canvas?.canvasWidth === "number" ? body.canvas.canvasWidth : undefined,
      canvasHeight: typeof body.canvas?.canvasHeight === "number" ? body.canvas.canvasHeight : undefined,
      placements: placements.map((item, index) => {
        const isReversed = Boolean(item?.isReversed);
        return {
          id: item?.id ?? `placement-${index + 1}`,
          cardId: item?.cardId ?? "",
          cardName: item?.cardName ?? "",
          image: item?.image ?? "",
          orientation: item?.orientation ?? (isReversed ? "invertida" : "derecha"),
          isReversed,
          positionId: item?.positionId,
          positionName: item?.positionName,
          x: typeof item?.x === "number" ? item.x : 0,
          y: typeof item?.y === "number" ? item.y : 0,
          rotation: typeof item?.rotation === "number" ? item.rotation : isReversed ? 180 : 0,
          order: typeof item?.order === "number" ? item.order : index,
          meaningUsed: item?.meaningUsed ?? "",
        };
      }),
    },
    flipStats: body.flipStats ?? [],
    flipEvents: body.flipEvents ?? [],
  };
}

function parseCardsJson(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }

  const metadata = isRecord(value.metadata) ? value.metadata : {};
  const reflection = isRecord(value.reflection) ? value.reflection : {};
  const canvas = isRecord(value.canvas) ? value.canvas : {};
  const placements = Array.isArray(canvas.placements) ? canvas.placements : [];

  return {
    metadata,
    reflection,
    canvas,
    placements,
    flipStats: Array.isArray(value.flipStats) ? value.flipStats : [],
    flipEvents: Array.isArray(value.flipEvents) ? value.flipEvents : [],
  };
}

function mapRereadings(items: BitacoraReReading[]): JournalRereading[] {
  return items.map((item) => {
    const decoded = decodeRereadingComment(item.comment ?? "");
    return {
      id: item.id,
      createdAt: item.createdAt.toISOString(),
      rereadingDate: item.createdAt.toISOString().slice(0, 10),
      rereadingTime: item.createdAt.toISOString().slice(11, 16),
      didComeTrue: decoded.didComeTrue ?? (item.fulfilled === true ? "si" : item.fulfilled === false ? "no" : "pendiente"),
      reflection: item.reflection ?? decoded.comment ?? "",
      newPersonalInterpretation: item.newInterpretation ?? "",
      lessonLearned: item.lessonLearned ?? "",
    };
  });
}

export function normalizeRereadingFulfilledStatus(
  didComeTrue: ApiCreateRereadingBody["didComeTrue"],
): boolean | null {
  if (didComeTrue === "si") {
    return true;
  }
  if (didComeTrue === "no") {
    return false;
  }
  return null;
}

export function encodeRereadingComment(comment: string | undefined, didComeTrue: ApiCreateRereadingBody["didComeTrue"]): string {
  const cleanComment = (comment ?? "").trim();
  const status = didComeTrue ?? "pendiente";
  return `[status:${status}]${cleanComment ? ` ${cleanComment}` : ""}`;
}

export function decodeRereadingComment(comment: string): {
  didComeTrue?: "si" | "no" | "parcial" | "pendiente";
  comment: string;
} {
  const match = comment.match(/^\[status:(si|no|parcial|pendiente)\]\s*(.*)$/i);
  if (!match) {
    return { comment };
  }

  const rawStatus = match[1]?.toLowerCase() as "si" | "no" | "parcial" | "pendiente" | undefined;
  const cleanComment = match[2] ?? "";
  return {
    didComeTrue: rawStatus,
    comment: cleanComment,
  };
}

export function mapBitacoraEntryToJournalEntry(
  entry: BitacoraEntry & { reReadings?: BitacoraReReading[] },
): JournalEntry {
  const parsed = parseCardsJson(entry.cardsJson);

  const metadataFromJson = parsed?.metadata ?? {};
  const reflectionFromJson = parsed?.reflection ?? {};
  const canvasFromJson = parsed?.canvas ?? {};
  const placementsFromJson = parsed?.placements ?? [];

  const readingDate = entry.readingDate.toISOString().slice(0, 10);

  return {
    id: entry.id,
    metadata: {
      consultantName: String(metadataFromJson.consultantName ?? ""),
      date: String(metadataFromJson.date ?? readingDate),
      time: String(metadataFromJson.time ?? entry.readingTime ?? ""),
      place: String(metadataFromJson.place ?? ""),
      emotionalState: String(metadataFromJson.emotionalState ?? ""),
      spreadType: String(metadataFromJson.spreadType ?? entry.spreadType),
      question: String(metadataFromJson.question ?? entry.question ?? ""),
    },
    canvas: {
      spreadType: String(canvasFromJson.spreadType ?? entry.spreadType),
      spreadId: typeof canvasFromJson.spreadId === "string" ? canvasFromJson.spreadId : undefined,
      canvasWidth: typeof canvasFromJson.canvasWidth === "number" ? canvasFromJson.canvasWidth : undefined,
      canvasHeight: typeof canvasFromJson.canvasHeight === "number" ? canvasFromJson.canvasHeight : undefined,
      placements: placementsFromJson.map((placement, index) => {
        const record = isRecord(placement) ? placement : {};
        return {
          id: String(record.id ?? `placement-${index + 1}`),
          cardId: String(record.cardId ?? ""),
          cardName: String(record.cardName ?? ""),
          image: String(record.image ?? ""),
          isReversed: Boolean(record.isReversed),
          x: typeof record.x === "number" ? record.x : 0,
          y: typeof record.y === "number" ? record.y : 0,
          positionId: typeof record.positionId === "string" ? record.positionId : undefined,
          positionName: typeof record.positionName === "string" ? record.positionName : undefined,
          order: typeof record.order === "number" ? record.order : index,
        };
      }),
    },
    reflection: {
      personalInterpretation: String(reflectionFromJson.personalInterpretation ?? entry.notes ?? ""),
      finalMessage: String(reflectionFromJson.finalMessage ?? ""),
      suggestedAction: String(reflectionFromJson.suggestedAction ?? ""),
    },
    flipStats: parsed?.flipStats as JournalEntry["flipStats"],
    rereadings: mapRereadings(entry.reReadings ?? []),
    flipEvents: parsed?.flipEvents as JournalEntry["flipEvents"],
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}
