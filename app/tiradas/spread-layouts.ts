export type SpreadLayoutVariant = "row" | "positioned" | "tree" | "celtic";

type SpreadLayoutConfig = {
  variant: SpreadLayoutVariant;
};

const spreadLayoutConfigById: Record<string, SpreadLayoutConfig> = {
  "situation-blockage-advice": { variant: "row" },
  "five-cards": { variant: "row" },
  "line-seven": { variant: "row" },
  "tree-of-life": { variant: "tree" },
  "celtic-cross": { variant: "celtic" },
  "horseshoe": { variant: "positioned" },
  decision: { variant: "positioned" },
  relationships: { variant: "positioned" },
  "work-finance": { variant: "positioned" },
  "full-moon": { variant: "positioned" },
  pendulum: { variant: "positioned" },
};

export function getSpreadLayoutConfig(spreadId: string): SpreadLayoutConfig {
  return spreadLayoutConfigById[spreadId] ?? { variant: "positioned" };
}

export function getDrawSizeClass(cardCount: number): string {
  if (cardCount <= 3) return "spread-size-large";
  if (cardCount <= 5) return "spread-size-medium";
  if (cardCount <= 7) return "spread-size-small";
  return "spread-size-compact";
}
