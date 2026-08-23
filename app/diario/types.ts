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

export interface JournalCustomPosition {
  index: number;
  label: string;
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
  customPositions?: JournalCustomPosition[];
  placements: JournalCardPlacement[];
}

export interface JournalTraditionalReadingSnapshot {
  summary: string;
  positionInterpretations: Array<{
    positionNumber: number;
    positionName: string;
    cardName: string;
    orientation: string;
    interpretation: string;
  }>;
  cardRelationships: string;
  finalAdvice: string;
}

export interface JournalMentorReadingSnapshot {
  directAnswer: string;
  blindSpot: string;
  deepDynamic: string;
  mainRisk: string;
  realOpportunity: string;
  mentorAdvice: string;
  sevenDayAction: string;
  reflectionQuestion: string;
  preferredOption: string;
  preferredOptionReason: string;
  alternativeOption: string;
  alternativeOptionRisk: string;
  decisionSignal: string;
  confidenceLevel: string;
  warning: string;
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
  recordType?: "REREADING" | "PERSONAL_INTERPRETATION";
}

export interface JournalEntry {
  id: string;
  metadata: JournalReadingMetadata;
  canvas: JournalCanvasSnapshot;
  reflection: JournalReadingReflection;
  traditionalReading?: JournalTraditionalReadingSnapshot | null;
  mentorReading?: JournalMentorReadingSnapshot | null;
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
