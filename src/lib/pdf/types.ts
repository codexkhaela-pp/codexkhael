export interface ReadingPdfCard {
  cardId: string;
  name: string;
  imagePath: string;
  orientation: "derecha" | "invertida";
  positionName?: string;
  order: number;
  x: number;
  y: number;
  rotation: number;
  relativeScale?: number;
}

export interface ReadingPdfLocalInterpretation {
  summary?: string;
  positions?: Array<{
    positionNumber: number;
    positionName: string;
    cardName: string;
    orientation: string;
    interpretation: string;
  }>;
  relationships?: string;
  finalAdvice?: string;
}

export interface ReadingPdfMentorInterpretation {
  directAnswer?: string;
  blindSpot?: string;
  deepDynamic?: string;
  mainRisk?: string;
  realOpportunity?: string;
  mentorAdvice?: string;
  sevenDayAction?: string;
  reflectionQuestion?: string;
  preferredOption?: string;
  preferredOptionReason?: string;
  alternativeOptionRisk?: string;
  warning?: string;
}

export interface ReadingPdfData {
  readingId: string;
  spreadName: string;
  question?: string;
  consultantName?: string;
  deckName?: string;
  date: string; // pre-formatted date
  time?: string;
  durationMinutes?: number;
  cardCount?: number;
  
  coverTitle?: string;
  coverSubtitle?: string;
  coverMessage?: string;

  canvasWidth?: number;
  canvasHeight?: number;
  cards: ReadingPdfCard[];
  localInterpretation?: ReadingPdfLocalInterpretation;
  mentorInterpretation?: ReadingPdfMentorInterpretation;
}
