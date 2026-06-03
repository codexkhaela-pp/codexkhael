const ALLOWED_SCOPES = [
  "amor",
  "trabajo",
  "dinero",
  "salud",
  "viajes",
  "espiritual",
  "general",
] as const;

export const ALLOWED_ORIENTATIONS = ["upright", "reversed"] as const;

export type TarotLocalScope = (typeof ALLOWED_SCOPES)[number];
export type TarotCardOrientation = (typeof ALLOWED_ORIENTATIONS)[number];

export type TarotCardScopeContent = {
  titulo?: string;
  general?: string;
  detalle?: string;
  consejo?: string;
  preguntas?: string[];
  bloques?: Array<{ titulo?: string; texto?: string }>;
};

export type TarotCardData = {
  id?: string;
  nombre?: string;
  arcano?: string;
  numero?: string;
  keywords?: {
    derecho?: string[];
    invertido?: string[];
  };
  resumen?: {
    derecho?: string;
    invertido?: string;
    mensaje_clave?: string;
    tip_practico?: string;
    afirmacion?: string;
    momento_clave?: {
      derecho?: string;
      invertido?: string;
    };
  };
  ambitos?: Partial<
    Record<
      Exclude<TarotLocalScope, "general">,
      {
        derecho?: TarotCardScopeContent;
        invertido?: TarotCardScopeContent;
      }
    >
  >;
  psicologia_profunda?: {
    derecho?: string;
    invertido?: string;
  };
  accion_concreta?: {
    derecho?: string;
    invertido?: string;
  };
  alertas?: {
    derecho?: string;
    invertido?: string;
  };
  timing?: {
    derecho?: string;
    invertido?: string;
  };
  lectura_profesional?: Record<string, string | undefined>;
  simbologia?: Array<{
    simbolo?: string;
    derecho?: string;
    invertido?: string;
    lectura_visual?: string;
  }>;
} | null;

export type TarotCardCharBreakdown = {
  cardName: string;
  sections: Array<{
    label: string;
    chars: number;
  }>;
  total: number;
};

export type CompactCardContext = {
  cardName: string;
  position: string;
  orientation: TarotCardOrientation;
  scope: TarotLocalScope;
  scopeMeaning: string;
  generalSummary: string;
  promptText: string;
  stats: {
    scopeChars: number;
    generalChars: number;
    totalChars: number;
  };
};

export type CompactCardContextOptions = {
  scopeMaxChars?: number;
  generalMaxChars?: number;
  scopeMinChars?: number;
};

const SCOPE_BREAKDOWN_ORDER: Array<Exclude<TarotLocalScope, "general">> = [
  "amor",
  "trabajo",
  "dinero",
  "salud",
  "viajes",
  "espiritual",
];

const COMPACT_SCOPE_MAX_CHARS = 750;
const COMPACT_GENERAL_MAX_CHARS = 150;
const COMPACT_SCOPE_MIN_CHARS = 450;

function pushSection(sections: string[], title: string, content: string | null | undefined) {
  if (!content) return;
  const cleaned = content.trim();
  if (!cleaned) return;
  sections.push(`${title}: ${cleaned}`);
}

function pushListSection(sections: string[], title: string, values: Array<string | null | undefined> | null | undefined) {
  const cleanValues = (values ?? [])
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);

  if (cleanValues.length === 0) return;
  sections.push(`${title}: ${cleanValues.join(" | ")}`);
}

function buildScopeSectionContent(
  orientationLabel: string,
  content: TarotCardScopeContent | undefined,
  sections: string[],
) {
  if (!content) return;

  pushSection(sections, `${orientationLabel} titulo`, content.titulo);
  pushSection(sections, `${orientationLabel} general`, content.general);
  pushSection(sections, `${orientationLabel} detalle`, content.detalle);
  pushSection(sections, `${orientationLabel} consejo`, content.consejo);
  pushListSection(sections, `${orientationLabel} preguntas`, content.preguntas);

  const blocks = (content.bloques ?? [])
    .map((block) => [block.titulo?.trim(), block.texto?.trim()].filter(Boolean).join(": "))
    .filter(Boolean);
  pushListSection(sections, `${orientationLabel} bloques`, blocks);
}

export function isTarotScope(value: unknown): value is TarotLocalScope {
  return typeof value === "string" && (ALLOWED_SCOPES as readonly string[]).includes(value);
}

export function isTarotOrientation(value: unknown): value is TarotCardOrientation {
  return (
    typeof value === "string" &&
    (ALLOWED_ORIENTATIONS as readonly string[]).includes(value)
  );
}

export function normalizeInput(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function countCharsDeep(value: unknown): number {
  if (typeof value === "string") {
    return value.trim().length;
  }

  if (Array.isArray(value)) {
    return value.reduce((total, item) => total + countCharsDeep(item), 0);
  }

  if (value && typeof value === "object") {
    return Object.values(value).reduce((total, item) => total + countCharsDeep(item), 0);
  }

  return 0;
}

export function getCardCharBreakdown(card: TarotCardData): TarotCardCharBreakdown {
  const sections: TarotCardCharBreakdown["sections"] = [];

  for (const scope of SCOPE_BREAKDOWN_ORDER) {
    const chars = countCharsDeep(card?.ambitos?.[scope]);
    if (chars > 0) {
      sections.push({
        label: scope,
        chars,
      });
    }
  }

  const generalChars = countCharsDeep({
    id: card?.id,
    nombre: card?.nombre,
    arcano: card?.arcano,
    numero: card?.numero,
    keywords: card?.keywords,
    resumen: card?.resumen,
    psicologia_profunda: card?.psicologia_profunda,
    accion_concreta: card?.accion_concreta,
    alertas: card?.alertas,
    timing: card?.timing,
    lectura_profesional: card?.lectura_profesional,
  });

  if (generalChars > 0) {
    sections.push({
      label: "general",
      chars: generalChars,
    });
  }

  const simbolismoChars = countCharsDeep(card?.simbologia);
  if (simbolismoChars > 0) {
    sections.push({
      label: "simbolismo",
      chars: simbolismoChars,
    });
  }

  return {
    cardName: card?.nombre?.trim() || card?.id?.trim() || "Carta sin nombre",
    sections,
    total: sections.reduce((sum, section) => sum + section.chars, 0),
  };
}

export function formatCardCharBreakdown(card: TarotCardData): string {
  const breakdown = getCardCharBreakdown(card);
  const lines = [`${breakdown.cardName}:`];

  for (const section of breakdown.sections) {
    lines.push(`  ${section.label}: ${section.chars}`);
  }

  lines.push(`Total: ${breakdown.total}`);
  return lines.join("\n");
}

function compactWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function truncateText(value: string, maxChars: number): string {
  const normalized = compactWhitespace(value);
  if (normalized.length <= maxChars) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
}

function joinDistinctParts(parts: Array<string | null | undefined>, maxChars: number): string {
  const uniqueParts = parts
    .map((part) => (typeof part === "string" ? compactWhitespace(part) : ""))
    .filter(Boolean)
    .filter((part, index, all) => all.indexOf(part) === index);

  const joined = uniqueParts.join(" ");
  return truncateText(joined, maxChars);
}

function buildNarrativeParts(parts: Array<string | null | undefined>, maxChars: number, minChars: number): string {
  const uniqueParts = parts
    .map((part) => (typeof part === "string" ? compactWhitespace(part) : ""))
    .filter(Boolean)
    .filter((part, index, all) => all.indexOf(part) === index);

  if (uniqueParts.length === 0) {
    return "";
  }

  const fullText = uniqueParts.join(" ");
  if (fullText.length <= maxChars) {
    return fullText;
  }

  let collected = "";
  for (const part of uniqueParts) {
    const nextValue = collected ? `${collected} ${part}` : part;
    if (nextValue.length > maxChars) {
      if (collected.length >= minChars) {
        break;
      }

      collected = truncateText(nextValue, maxChars);
      break;
    }

    collected = nextValue;
  }

  if (!collected) {
    return truncateText(fullText, maxChars);
  }

  if (collected.length < minChars && fullText.length > collected.length) {
    return truncateText(fullText, maxChars);
  }

  return collected;
}

function orientationDataKey(orientation: TarotCardOrientation): "derecho" | "invertido" {
  return orientation === "upright" ? "derecho" : "invertido";
}

function orientationLabel(orientation: TarotCardOrientation): string {
  return orientation === "upright" ? "derecha" : "invertida";
}

export function buildCompactCardContext(
  card: TarotCardData,
  scope: TarotLocalScope,
  orientation: TarotCardOrientation,
  position: string,
  options: CompactCardContextOptions = {},
): CompactCardContext | null {
  const cardName = card?.nombre?.trim() || card?.id?.trim() || "Carta sin nombre";
  const orientationKey = orientationDataKey(orientation);
  const scopeMaxChars = options.scopeMaxChars ?? COMPACT_SCOPE_MAX_CHARS;
  const generalMaxChars = options.generalMaxChars ?? COMPACT_GENERAL_MAX_CHARS;
  const scopeMinChars = options.scopeMinChars ?? COMPACT_SCOPE_MIN_CHARS;

  let scopeMeaning = "";

  if (scope === "general") {
    scopeMeaning = buildNarrativeParts(
      [
        card?.resumen?.[orientationKey],
        card?.psicologia_profunda?.[orientationKey],
        card?.accion_concreta?.[orientationKey],
        card?.alertas?.[orientationKey],
        card?.timing?.[orientationKey],
        card?.resumen?.tip_practico,
        card?.resumen?.mensaje_clave,
      ],
      scopeMaxChars,
      scopeMinChars,
    );
  } else {
    const scoped = card?.ambitos?.[scope]?.[orientationKey];
    const blockTexts = (scoped?.bloques ?? [])
      .slice(0, 3)
      .map((block) => block.texto)
      .filter(Boolean);

    const primaryNarrative = buildNarrativeParts(
      [
        scoped?.general,
        scoped?.detalle,
        scoped?.consejo,
        ...blockTexts,
        card?.accion_concreta?.[orientationKey],
        card?.alertas?.[orientationKey],
      ],
      scopeMaxChars,
      scopeMinChars,
    );

    scopeMeaning = primaryNarrative || buildNarrativeParts(
      [
        scoped?.general,
        scoped?.detalle,
        scoped?.consejo,
        scoped?.titulo,
        ...blockTexts,
        ...((scoped?.preguntas ?? []).slice(0, 2)),
        card?.accion_concreta?.[orientationKey],
        card?.alertas?.[orientationKey],
      ],
      scopeMaxChars,
      scopeMinChars,
    );
  }

  if (!scopeMeaning) {
    return null;
  }

  const generalSummary = joinDistinctParts(
    [card?.resumen?.[orientationKey], card?.resumen?.mensaje_clave],
    generalMaxChars,
  );

  const promptLines = [
    `Carta=${cardName}`,
    `Posicion=${position}`,
    `Orientacion=${orientationLabel(orientation)}`,
    `Scope=${scope}`,
    `Significado=${scopeMeaning}`,
  ];

  if (generalSummary) {
    promptLines.push(`Resumen=${generalSummary}`);
  }

  const promptText = promptLines.join("\n");

  return {
    cardName,
    position,
    orientation,
    scope,
    scopeMeaning,
    generalSummary,
    promptText,
    stats: {
      scopeChars: scopeMeaning.length,
      generalChars: generalSummary.length,
      totalChars: promptText.length,
    },
  };
}

export function formatCompactCardContextDebug(context: CompactCardContext): string {
  return [
    `${context.cardName}:`,
    `  scope enviado: ${context.scope}`,
    `  chars del scope: ${context.stats.scopeChars}`,
    `  chars del general resumido: ${context.stats.generalChars}`,
    `  total enviado por carta: ${context.stats.totalChars}`,
  ].join("\n");
}

export function formatAiCardContextAudit(context: CompactCardContext): string {
  return [
    "[AI CARD CONTEXT]",
    `Carta: ${context.cardName}`,
    `Scope: ${context.scope}`,
    `Orientation: ${context.orientation}`,
    "",
    "## Contenido enviado:",
    context.promptText,
    "",
    `Longitud real enviada: ${context.stats.totalChars}`,
  ].join("\n");
}

export function buildCardContext(card: TarotCardData, scope: TarotLocalScope): string {
  const sections: string[] = [];

  pushSection(sections, "Carta", card?.nombre);
  pushSection(sections, "ID", card?.id);
  pushSection(sections, "Arcano", [card?.arcano, card?.numero].filter(Boolean).join(" "));
  pushListSection(sections, "Keywords derecho", card?.keywords?.derecho);
  pushListSection(sections, "Keywords invertido", card?.keywords?.invertido);
  pushSection(sections, "Resumen derecho", card?.resumen?.derecho);
  pushSection(sections, "Resumen invertido", card?.resumen?.invertido);
  pushSection(sections, "Mensaje clave", card?.resumen?.mensaje_clave);
  pushSection(sections, "Tip practico", card?.resumen?.tip_practico);
  pushSection(sections, "Afirmacion", card?.resumen?.afirmacion);
  pushSection(sections, "Momento clave derecho", card?.resumen?.momento_clave?.derecho);
  pushSection(sections, "Momento clave invertido", card?.resumen?.momento_clave?.invertido);
  pushSection(sections, "Psicologia profunda derecho", card?.psicologia_profunda?.derecho);
  pushSection(sections, "Psicologia profunda invertido", card?.psicologia_profunda?.invertido);
  pushSection(sections, "Accion concreta derecho", card?.accion_concreta?.derecho);
  pushSection(sections, "Accion concreta invertido", card?.accion_concreta?.invertido);
  pushSection(sections, "Alertas derecho", card?.alertas?.derecho);
  pushSection(sections, "Alertas invertido", card?.alertas?.invertido);
  pushSection(sections, "Timing derecho", card?.timing?.derecho);
  pushSection(sections, "Timing invertido", card?.timing?.invertido);

  if (scope === "general") {
    const professionalNotes = Object.entries(card?.lectura_profesional ?? {})
      .map(([key, value]) => `${key}: ${value}`)
      .filter((value) => !value.endsWith(": undefined"));
    pushListSection(sections, "Lectura profesional", professionalNotes);

    const symbols = (card?.simbologia ?? [])
      .slice(0, 6)
      .map((item) =>
        [
          item.simbolo?.trim(),
          item.derecho?.trim(),
          item.invertido?.trim(),
          item.lectura_visual?.trim(),
        ]
          .filter(Boolean)
          .join(" | "),
      )
      .filter(Boolean);
    pushListSection(sections, "Simbologia", symbols);

    return sections.join("\n");
  }

  const scoped = card?.ambitos?.[scope];
  buildScopeSectionContent("Ambito derecho", scoped?.derecho, sections);
  buildScopeSectionContent("Ambito invertido", scoped?.invertido, sections);

  return sections.join("\n");
}
