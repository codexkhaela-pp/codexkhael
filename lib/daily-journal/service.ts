import { CardOrientation, DailyJournalStatus as PrismaDailyJournalStatus } from "@/src/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getOrGenerateDailyCard } from "@/lib/carta-del-dia/service";
import { tarotCards } from "@/src/data/tarotCards";
import {
  DAILY_JOURNAL_AREAS,
  type DailyJournalArea,
  type DailyJournalEntryPayload,
  type DailyJournalSaveInput,
} from "@/lib/daily-journal/types";

function normalizeText(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeAreas(value: string[] | null | undefined): DailyJournalArea[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const allowedAreas = new Set<string>(DAILY_JOURNAL_AREAS);
  const uniqueAreas = new Set<DailyJournalArea>();

  for (const item of value) {
    const normalized = typeof item === "string" ? item.trim().toLowerCase() : "";
    if (allowedAreas.has(normalized)) {
      uniqueAreas.add(normalized as DailyJournalArea);
    }
  }

  return Array.from(uniqueAreas);
}

function normalizeIntensity(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  const rounded = Math.round(value);
  if (rounded < 1 || rounded > 5) {
    return null;
  }

  return rounded;
}

function resolveStatus(input: {
  morningIntention: string;
  experience: string;
  manifestedAreas: DailyJournalArea[];
  intensity: number | null;
  nightReflection: string;
}): PrismaDailyJournalStatus {
  const hasAnyValue =
    input.morningIntention.length > 0 ||
    input.experience.length > 0 ||
    input.manifestedAreas.length > 0 ||
    input.intensity !== null ||
    input.nightReflection.length > 0;

  if (!hasAnyValue) {
    return PrismaDailyJournalStatus.EMPTY;
  }

  const isCompleted =
    input.morningIntention.length > 0 &&
    input.experience.length > 0 &&
    input.manifestedAreas.length > 0 &&
    input.intensity !== null &&
    input.nightReflection.length > 0;

  return isCompleted ? PrismaDailyJournalStatus.COMPLETED : PrismaDailyJournalStatus.PARTIAL;
}

function mapStatus(status: PrismaDailyJournalStatus): DailyJournalEntryPayload["status"] {
  return status;
}

function buildPayload(args: {
  id: string | null;
  date: string;
  cardId: string;
  cardName: string;
  orientation: CardOrientation;
  cardImageUrl: string;
  dailyMessage: string;
  morningIntention?: string | null;
  experience?: string | null;
  manifestedAreas?: string[] | null;
  intensity?: number | null;
  nightReflection?: string | null;
  status: PrismaDailyJournalStatus;
}): DailyJournalEntryPayload {
  return {
    id: args.id,
    date: args.date,
    card: {
      id: args.cardId,
      name: args.cardName,
      orientation: args.orientation,
      imageUrl: args.cardImageUrl,
      dailyMessage: args.dailyMessage,
    },
    morningIntention: args.morningIntention ?? "",
    experience: args.experience ?? "",
    manifestedAreas: normalizeAreas(args.manifestedAreas ?? []),
    intensity: normalizeIntensity(args.intensity),
    nightReflection: args.nightReflection ?? "",
    status: mapStatus(args.status),
  };
}

async function resolveDailyCardSnapshot(userId: string) {
  const dailyCard = await getOrGenerateDailyCard(userId);
  const tarotCard = tarotCards.find((card) => card.id === dailyCard.cardId);

  if (!tarotCard) {
    throw new Error(`Card ${dailyCard.cardId} not found in tarotCards`);
  }

  return {
    date: dailyCard.fechaLocal,
    cardId: dailyCard.cardId,
    cardName: tarotCard.nameEs,
    orientation: dailyCard.orientation,
    cardImageUrl: tarotCard.image,
    dailyMessage: dailyCard.mensajeDia,
  };
}

export async function getTodayDailyJournalEntry(userId: string): Promise<DailyJournalEntryPayload> {
  const snapshot = await resolveDailyCardSnapshot(userId);

  const existingEntry = await prisma.dailyJournalEntry.findUnique({
    where: {
      userId_date: {
        userId,
        date: snapshot.date,
      },
    },
  });

  if (!existingEntry) {
    return buildPayload({
      id: null,
      date: snapshot.date,
      cardId: snapshot.cardId,
      cardName: snapshot.cardName,
      orientation: snapshot.orientation,
      cardImageUrl: snapshot.cardImageUrl,
      dailyMessage: snapshot.dailyMessage,
      manifestedAreas: [],
      intensity: null,
      status: PrismaDailyJournalStatus.EMPTY,
    });
  }

  return buildPayload({
    id: existingEntry.id,
    date: existingEntry.date,
    cardId: existingEntry.cardId,
    cardName: existingEntry.cardName,
    orientation: existingEntry.orientation,
    cardImageUrl: existingEntry.cardImageUrl,
    dailyMessage: existingEntry.dailyMessage,
    morningIntention: existingEntry.morningIntention,
    experience: existingEntry.experience,
    manifestedAreas: existingEntry.manifestedAreas,
    intensity: existingEntry.intensity,
    nightReflection: existingEntry.nightReflection,
    status: existingEntry.status,
  });
}

export async function saveTodayDailyJournalEntry(
  userId: string,
  input: DailyJournalSaveInput,
): Promise<DailyJournalEntryPayload> {
  const snapshot = await resolveDailyCardSnapshot(userId);

  const normalized = {
    morningIntention: normalizeText(input.morningIntention),
    experience: normalizeText(input.experience),
    manifestedAreas: normalizeAreas(input.manifestedAreas),
    intensity: normalizeIntensity(input.intensity),
    nightReflection: normalizeText(input.nightReflection),
  };

  const status = resolveStatus(normalized);

  const savedEntry = await prisma.dailyJournalEntry.upsert({
    where: {
      userId_date: {
        userId,
        date: snapshot.date,
      },
    },
    create: {
      userId,
      date: snapshot.date,
      cardId: snapshot.cardId,
      cardName: snapshot.cardName,
      orientation: snapshot.orientation,
      cardImageUrl: snapshot.cardImageUrl,
      dailyMessage: snapshot.dailyMessage,
      morningIntention: normalized.morningIntention || null,
      experience: normalized.experience || null,
      manifestedAreas: normalized.manifestedAreas,
      intensity: normalized.intensity,
      nightReflection: normalized.nightReflection || null,
      status,
    },
    update: {
      cardId: snapshot.cardId,
      cardName: snapshot.cardName,
      orientation: snapshot.orientation,
      cardImageUrl: snapshot.cardImageUrl,
      dailyMessage: snapshot.dailyMessage,
      morningIntention: normalized.morningIntention || null,
      experience: normalized.experience || null,
      manifestedAreas: normalized.manifestedAreas,
      intensity: normalized.intensity,
      nightReflection: normalized.nightReflection || null,
      status,
    },
  });

  return buildPayload({
    id: savedEntry.id,
    date: savedEntry.date,
    cardId: savedEntry.cardId,
    cardName: savedEntry.cardName,
    orientation: savedEntry.orientation,
    cardImageUrl: savedEntry.cardImageUrl,
    dailyMessage: savedEntry.dailyMessage,
    morningIntention: savedEntry.morningIntention,
    experience: savedEntry.experience,
    manifestedAreas: savedEntry.manifestedAreas,
    intensity: savedEntry.intensity,
    nightReflection: savedEntry.nightReflection,
    status: savedEntry.status,
  });
}
