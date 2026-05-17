import type { TarotCard } from "@/src/data/tarotCards";
import type { TarotSpreadPosition } from "@/src/data/tarotSpreads";

export type ReadingStatus = "inicial" | "barajando" | "revelando" | "completada";

export type DrawnCard = {
  position: TarotSpreadPosition;
  card: TarotCard;
  reversed: boolean;
};
