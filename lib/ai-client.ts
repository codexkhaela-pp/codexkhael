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
  aiSummary: string;
  deepInterpretation: string;
  cardConnections: string;
  practicalAdvice: string;
  reflectionQuestions: string[];
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
    throw new Error(errorData.error || "Error al conectar con la IA");
  }

  return res.json();
}
