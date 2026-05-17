export interface JournalReadingMetadata {
  consultantName: string;
  date: string;
  time: string;
  place: string;
  emotionalState: string;
  spreadType: string;
  question?: string;
}

export interface JournalReadingReflection {
  personalInterpretation: string;
  finalMessage: string;
  suggestedAction: string;
}

export interface JournalSpreadPosition {
  id: string;
  name: string;
  subtitle?: string;
  x?: number;
  y?: number;
  row?: number;
  column?: number;
}

export interface JournalCardPlacement {
  id: string;
  cardId: string;
  cardName: string;
  image: string;
  isReversed: boolean;
  x: number;
  y: number;
  positionId?: string;
  positionName?: string;
  order: number;
}

export interface JournalCanvasSnapshot {
  spreadType: string;
  spreadId?: string;
  canvasWidth?: number;
  canvasHeight?: number;
  placements: JournalCardPlacement[];
}

export interface JournalFlipEvent {
  journalEntryId?: string;
  cardId: string;
  cardName: string;
  positionId?: string;
  positionName?: string;
  spreadType: string;
  flippedAt: Date | string;
}

export interface JournalFlipStat {
  cardId: string;
  cardName: string;
  totalFlips: number;
  positions: Record<string, number>;
}

export interface JournalRereading {
  id: string;
  createdAt: string;
  rereadingDate: string;
  rereadingTime: string;
  didComeTrue?: "si" | "no" | "parcial" | "pendiente";
  reflection: string;
  newPersonalInterpretation: string;
  lessonLearned: string;
}

export interface JournalEntry {
  id: string;
  metadata: JournalReadingMetadata;
  canvas: JournalCanvasSnapshot;
  reflection: JournalReadingReflection;
  flipStats: JournalFlipStat[];
  rereadings: JournalRereading[];
  flipEvents?: JournalFlipEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface JournalSpreadDefinition {
  id: string;
  name: string;
  description: string;
  cardCount: number;
  mode: "fixed" | "free";
  positions: JournalSpreadPosition[];
}
