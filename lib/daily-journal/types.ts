export const DAILY_JOURNAL_AREAS = [
  "amor",
  "trabajo",
  "dinero",
  "salud",
  "familia",
  "espiritualidad",
  "decisiones",
  "otro",
] as const;

export type DailyJournalArea = (typeof DAILY_JOURNAL_AREAS)[number];

export type DailyJournalStatus = "EMPTY" | "PARTIAL" | "COMPLETED";

export type DailyJournalCardSnapshot = {
  id: string;
  name: string;
  orientation: "UPRIGHT" | "REVERSED";
  imageUrl: string;
  dailyMessage: string;
};

export type DailyJournalEntryPayload = {
  id: string | null;
  date: string;
  card: DailyJournalCardSnapshot;
  morningIntention: string;
  experience: string;
  manifestedAreas: DailyJournalArea[];
  intensity: number | null;
  nightReflection: string;
  status: DailyJournalStatus;
};

export type DailyJournalSaveInput = {
  morningIntention?: string;
  experience?: string;
  manifestedAreas?: string[];
  intensity?: number | null;
  nightReflection?: string;
};
