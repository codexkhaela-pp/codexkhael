export type AiTarotReadingRequest = {
  source: "SPREAD" | "JOURNAL";
  question: string | null;
  spreadType: string | null;
  baseInterpretation: {
    summary: string;
    cards: Array<{
      name: string;
      orientation: "UPRIGHT" | "REVERSED";
      positionName: string | null;
      interpretation: string;
    }>;
    connections: string;
    dominantTone: string;
    blockages: string;
    advice: string;
  };
  cards: Array<{
    cardId: string;
    name: string;
    orientation: "UPRIGHT" | "REVERSED";
    positionName: string | null;
    order: number;
  }>;
  journalContext: {
    notes: string | null;
    futureRereading: string | null;
    learnedLesson: string | null;
  } | null;
};

export type AiTarotReadingResponse = {
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
};

export async function requestAiTarotReading(payload: AiTarotReadingRequest): Promise<AiTarotReadingResponse> {
  const res = await fetch("/api/ai/tarot-reading", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    if (errorData.error === "FEATURE_NOT_ALLOWED") {
      const required = errorData.requiredPlan === "PRO" ? "Pro" : "Básico";
      throw new Error(`Esta función está disponible desde el plan ${required}.`);
    }
    if (errorData.error === "LIMIT_REACHED") {
      throw new Error("LIMIT_REACHED");
    }
    throw new Error(errorData.error || "Error al conectar con la IA");
  }

  return res.json();
}
