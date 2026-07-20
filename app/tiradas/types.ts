import type { TarotCard } from "@/src/data/tarotCards";
import type { TarotSpreadPosition } from "@/src/data/tarotSpreads";

export type ReadingStatus = "inicial" | "barajando" | "revelando" | "completada";
export type ManualSpreadStatus = "building" | "sealed";

export type DrawnCard = {
  position: TarotSpreadPosition;
  card: TarotCard;
  reversed: boolean;
};

export type ManualBoardCard = {
  id: string; // row-col
  row: number;
  col: number;
  cardId: string;
  cardSearch: string;
  reversed: boolean;
  label: string;
};
