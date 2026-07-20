import type { JournalEntry, JournalRereading } from "@/app/diario/types";

const STORAGE_KEY = "khael-journal-entries-v2";
const LEGACY_KEY = "khael-journal-entries-v1";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeEntry(entry: any): JournalEntry {
  if (entry.canvas?.placements) {
    return {
      ...entry,
      rereadings: Array.isArray(entry.rereadings) ? entry.rereadings : [],
      flipStats: Array.isArray(entry.flipStats) ? entry.flipStats : [],
      traditionalReading: entry.traditionalReading ?? null,
      mentorReading: entry.mentorReading ?? null,
    } as JournalEntry;
  }

  const legacyPlacements = Array.isArray(entry.placements) ? entry.placements : [];
  const normalizedPlacements = legacyPlacements.map((placement: any, index: number) => ({
    id: placement.id,
    cardId: placement.cardId,
    cardName: placement.cardName,
    image: placement.image,
    isReversed: Boolean(placement.isReversed),
    x: typeof placement.x === "number" ? placement.x : 0,
    y: typeof placement.y === "number" ? placement.y : 0,
    positionId: placement.positionId,
    positionName: placement.positionName,
    order: typeof placement.order === "number" ? placement.order : index,
  }));

  return {
    id: entry.id,
    metadata: entry.metadata,
    canvas: {
      spreadType: entry.metadata?.spreadType ?? "3 cartas",
      placements: normalizedPlacements,
    },
    reflection: {
      personalInterpretation: entry.reflection?.personalInterpretation ?? "",
      finalMessage: entry.reflection?.finalMessage ?? "",
      suggestedAction: entry.reflection?.suggestedAction ?? "",
    },
    traditionalReading: entry.traditionalReading ?? null,
    mentorReading: entry.mentorReading ?? null,
    flipStats: Array.isArray(entry.flipStats) ? entry.flipStats : [],
    rereadings: [],
    flipEvents: Array.isArray(entry.flipEvents) ? entry.flipEvents : [],
    createdAt: entry.createdAt ?? new Date().toISOString(),
    updatedAt: entry.updatedAt ?? new Date().toISOString(),
  };
}

function migrateLegacyIfNeeded() {
  if (!canUseStorage()) {
    return;
  }

  const currentRaw = window.localStorage.getItem(STORAGE_KEY);
  if (currentRaw) {
    return;
  }

  const legacyRaw = window.localStorage.getItem(LEGACY_KEY);
  if (!legacyRaw) {
    return;
  }

  try {
    const parsed = JSON.parse(legacyRaw) as any[];
    const migrated = parsed.map(normalizeEntry);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }
}

function readEntries(): JournalEntry[] {
  if (!canUseStorage()) {
    return [];
  }

  migrateLegacyIfNeeded();

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as any[];
    return parsed.map(normalizeEntry);
  } catch {
    return [];
  }
}

function writeEntries(entries: JournalEntry[]) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function getJournalEntries(): JournalEntry[] {
  return readEntries().sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function getJournalEntryById(id: string): JournalEntry | null {
  return readEntries().find((entry) => entry.id === id) ?? null;
}

export function saveJournalEntry(entry: JournalEntry): void {
  const entries = readEntries();
  const nextEntries = [entry, ...entries.filter((item) => item.id !== entry.id)];
  writeEntries(nextEntries);
}

export function updateJournalEntry(entry: JournalEntry): void {
  const entries = readEntries();
  const index = entries.findIndex((item) => item.id === entry.id);

  if (index === -1) {
    entries.unshift(entry);
    writeEntries(entries);
    return;
  }

  entries[index] = entry;
  writeEntries(entries);
}

export function addJournalRereading(entryId: string, rereading: JournalRereading): void {
  const entries = readEntries();
  const index = entries.findIndex((entry) => entry.id === entryId);

  if (index === -1) {
    return;
  }

  const target = entries[index];
  entries[index] = {
    ...target,
    rereadings: [...target.rereadings, rereading],
    updatedAt: new Date().toISOString(),
  };

  writeEntries(entries);
}
