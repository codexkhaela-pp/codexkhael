import majorData from "@/src/data/arcanos_mayores_modal_data_PRO_FINAL_v2.json";
import cupsData from "@/src/data/arcanos_menores_copas_modal_data_PRO_FINAL_v1.json";
import pentaclesData from "@/src/data/arcanos_menores_oros_modal_data_PRO_FINAL_v1.json";
import wandsData from "@/src/data/arcanos_menores_bastos_modal_data_PRO_FINAL_v1.json";
import swordsData from "@/src/data/arcanos_menores_espadas_modal_data_PRO_FINAL_v1.json";

export type ReadingDomain =
  | "amor"
  | "trabajo"
  | "dinero"
  | "salud"
  | "espiritualidad"
  | "familia"
  | "decision"
  | "proyecto"
  | "viaje"
  | "general";

export type QuestionIntent =
  | "improve_income"
  | "financial_decision"
  | "financial_outlook"
  | "career_decision"
  | "career_growth"
  | "work_situation"
  | "relationship_status"
  | "relationship_decision"
  | "health_recovery"
  | "health_outlook"
  | "energy_leak"
  | "project_decision"
  | "project_growth"
  | "travel_decision"
  | "travel_outlook"
  | "family_outlook"
  | "decision_path"
  | "spiritual_direction"
  | "life_overview";

export type DecisionSignal = "strongly_favors_a" | "favors_a" | "balanced" | "favors_b" | "strongly_favors_b";

export type ConfidenceLevel = "high" | "medium" | "low";
export type DominantSuit = "fuego" | "tierra" | "agua" | "aire" | "mayor" | "mixto";
export type DominantArcanaSignal = "major_dominant" | "minor_dominant" | "balanced";
export type NarrativeTone = "strategic" | "emotional" | "practical" | "dynamic" | "transformational";
export type DominantTheme =
  | "material_construction"
  | "mental_conflict"
  | "emotional_bond"
  | "active_movement"
  | "structural_transformation"
  | "mixed_axis";

export type MultiDomainArea =
  | "work"
  | "money"
  | "love"
  | "health"
  | "personal_growth"
  | "family"
  | "project"
  | "travel";

export type NarrativeCardRole =
  | "origin"
  | "situation"
  | "central"
  | "blockage"
  | "challenge"
  | "advice"
  | "outcome"
  | "conscious"
  | "unconscious"
  | "past"
  | "present"
  | "future"
  | "environment"
  | "fear"
  | "opportunity"
  | "risk"
  | "relationshipA"
  | "relationshipB"
  | "bond"
  | "decisionA"
  | "decisionB"
  | "release"
  | "integration"
  | "hidden"
  | "external"
  | "resources"
  | "answer"
  | "lesson"
  | "action"
  | "support"
  | "selfView"
  | "free";

export interface NarrativeContext {
  domain: ReadingDomain;
  spreadType: string;
  question: string;
  intent: QuestionIntent;
  primaryFocus: string[];
  isMultiDomain: boolean;
  domains: MultiDomainArea[];
  pendulumMode: boolean;
  pendulumContext?: PendulumContext;
  relationshipMode: boolean;
  relationshipContext?: RelationshipContext;
  decisionContext?: DecisionContext;
  coreTheme: string;
  mainConflict: string;
  mainContradiction: string;
  mainRisk: string;
  mainOpportunity: string;
  likelyOutcome: string;
  dominantThemes: string[];
  secondaryThemes: string[];
  dominantSuit: DominantSuit;
  dominantArcanaSignal: DominantArcanaSignal;
  narrativeTone: NarrativeTone;
  dominantTheme: DominantTheme;
  dominantSubTheme: string;
  thematicKeywords: string[];
  thematicNarrativeSeed: string;
  forbiddenGenericDrift: string[];
  dominantEnergy: string;
  missingEnergy: string;
  turningPoint: string;
  primaryAxis: NarrativeAxis;
  secondaryAxis: NarrativeAxis;
  storySpine: NarrativeStorySpine;
  narrativeWarnings: string[];
  freePositionContext?: FreePositionContext;
  roleMap: NarrativeRoleMapEntry[];
  keyCards: NarrativeCard[];
  supportCards: NarrativeCard[];
}

export interface FreePositionContext {
  isFreeSpread: boolean;
  customPositions: Array<{
    positionNumber: number;
    positionName: string;
    cardName: string;
    orientation: "derecho" | "invertido";
    interpretedRole: string;
    positionNarrativeMeaning: string;
  }>;
  freeSpreadNarrativeAxis: string;
}

export interface NarrativeAxis {
  cards: string[];
  meaning: string;
  why: string;
}

export interface NarrativeStorySpine {
  currentState: string;
  whatWantsToEmerge: string;
  whatBlocksIt: string;
  whatMustBeIntegrated: string;
  likelyEvolution: string;
}

export interface NarrativeRoleMapEntry {
  positionNumber: number;
  positionName: string;
  role: NarrativeCardRole;
}

export interface NarrativeCard {
  positionNumber: number;
  positionName: string;
  cardName: string;
  orientation: "derecho" | "invertido";
  role: NarrativeCardRole;
  domainMeaning: string;
  narrativeFunction: string;
}

export interface RelationshipContext {
  selfEnergy: NarrativeCard | null;
  otherEnergy: NarrativeCard | null;
  relationshipBond: NarrativeCard | null;
  likelyOutcome: NarrativeCard | null;
  bondNarrativeCore: RelationshipBondNarrativeCore | null;
}

export interface RelationshipBondNarrativeCore {
  centralTheme: string;
  mainTension: string;
  centralLearning: string;
  bondDirection: string;
}

export interface PendulumContext {
  decisionSignal: "SI" | "NO" | "TAL_VEZ";
  confidenceLevel: ConfidenceLevel;
  answerCard: NarrativeCard | null;
  supportingRisk: NarrativeCard | null;
  supportingOpportunity: NarrativeCard | null;
  supportingAdvice: NarrativeCard | null;
  justificationSeed: string;
}

export interface DecisionOptionAnalysis {
  option: "A" | "B";
  positionName: string;
  cardName: string;
  orientation: "derecho" | "invertido";
  dominantEnergy: string;
  blockages: string[];
  opportunities: string[];
  likelyEvolution: string;
  narrativeCoherence: string;
  score: number;
}

export interface DecisionContext {
  preferredOption: "A" | "B";
  preferredOptionReason: string;
  alternativeOption: "A" | "B";
  alternativeOptionRisk: string;
  decisionSignal: DecisionSignal;
  confidenceLevel: ConfidenceLevel;
  decisionAAnalysis: DecisionOptionAnalysis;
  decisionBAnalysis: DecisionOptionAnalysis;
}

export interface CartaPosicionada {
  positionNumber: number;
  positionName: string;
  cardName: string;
  orientation: "derecho" | "invertido";
  baseMeaning?: string;
}

type NarrativeSummary = Pick<
  NarrativeContext,
  | "coreTheme"
  | "mainConflict"
  | "mainContradiction"
  | "mainRisk"
  | "mainOpportunity"
  | "likelyOutcome"
  | "dominantThemes"
  | "secondaryThemes"
  | "dominantSuit"
  | "dominantArcanaSignal"
  | "narrativeTone"
  | "dominantEnergy"
  | "missingEnergy"
  | "turningPoint"
  | "primaryAxis"
  | "secondaryAxis"
  | "storySpine"
  | "narrativeWarnings"
>;

type NarrativeAxesDetection = Pick<
  NarrativeContext,
  | "dominantThemes"
  | "secondaryThemes"
  | "dominantSuit"
  | "dominantArcanaSignal"
  | "narrativeTone"
  | "dominantEnergy"
  | "missingEnergy"
  | "turningPoint"
  | "primaryAxis"
  | "secondaryAxis"
  | "narrativeWarnings"
>;

type ThemeLockProfile = Pick<
  NarrativeContext,
  | "dominantTheme"
  | "dominantSubTheme"
  | "thematicKeywords"
  | "thematicNarrativeSeed"
  | "forbiddenGenericDrift"
>;

type FreePositionProfile = NonNullable<NarrativeContext["freePositionContext"]>;
type RelationshipProfile = NonNullable<NarrativeContext["relationshipContext"]>;
type PendulumProfile = NonNullable<NarrativeContext["pendulumContext"]>;

type JsonOrientation = "derecho" | "invertido";

type JsonInterpretationBlock = {
  titulo?: string;
  general?: string;
  detalle?: string;
  consejo?: string;
};

type JsonTarotCard = {
  id?: string;
  nombre?: string;
  resumen?: Partial<Record<JsonOrientation, string>> & {
    mensaje_clave?: string;
  };
  ambitos?: Partial<Record<string, Partial<Record<JsonOrientation, JsonInterpretationBlock>>>>;
};

type JsonTarotRoot = {
  cartas: JsonTarotCard[];
};

export type QuestionIntentProfile = {
  intent: QuestionIntent;
  domain: ReadingDomain;
  primaryFocus: string[];
  isMultiDomain: boolean;
  domains: MultiDomainArea[];
};

const OPENING_CARDS = ["justicia", "mundo", "estrella", "sol", "mago", "emperatriz", "emperador"];
const ALL_JSON_CARDS: JsonTarotCard[] = [
  ...(majorData as JsonTarotRoot).cartas,
  ...(cupsData as JsonTarotRoot).cartas,
  ...(pentaclesData as JsonTarotRoot).cartas,
  ...(wandsData as JsonTarotRoot).cartas,
  ...(swordsData as JsonTarotRoot).cartas,
];

const PRIMARY_FOCUS_BY_INTENT: Record<QuestionIntent, string[]> = {
  improve_income: ["income", "money", "resources", "productivity"],
  financial_decision: ["money", "resources", "stability", "opportunities"],
  financial_outlook: ["money", "resources", "stability", "opportunities"],
  career_decision: ["career", "employment", "performance", "opportunities"],
  career_growth: ["career", "employment", "performance", "opportunities"],
  work_situation: ["career", "employment", "performance", "opportunities"],
  relationship_status: ["relationship", "communication", "commitment"],
  relationship_decision: ["relationship", "communication", "commitment"],
  health_recovery: ["wellbeing", "habits", "recovery"],
  health_outlook: ["wellbeing", "habits", "recovery"],
  energy_leak: ["energy", "resources", "boundaries", "recovery"],
  project_decision: ["project", "execution", "resources", "opportunities"],
  project_growth: ["project", "execution", "resources", "opportunities"],
  travel_decision: ["travel", "timing", "logistics", "opportunities"],
  travel_outlook: ["travel", "timing", "logistics", "opportunities"],
  family_outlook: ["family", "communication", "stability", "support"],
  decision_path: ["overview", "life", "opportunities", "challenges"],
  spiritual_direction: ["overview", "life", "opportunities", "challenges"],
  life_overview: ["overview", "life", "opportunities", "challenges"],
};

const DEFAULT_MULTI_DOMAIN_AREAS: MultiDomainArea[] = ["work", "money", "love", "health", "personal_growth"];

const MULTI_DOMAIN_KEYWORDS: Record<MultiDomainArea, string[]> = {
  work: ["trabajo", "laboral", "empleo", "empresa", "carrera", "profesion", "profesion", "puesto", "jefe"],
  money: ["dinero", "plata", "finanzas", "ingresos", "ahorro", "deuda", "inversion", "inversion", "ventas", "ganancias"],
  love: ["amor", "pareja", "relacion", "relacion", "vinculo", "sentimental", "novio", "novia", "matrimonio"],
  health: ["salud", "cuerpo", "bienestar", "agotamiento", "cansancio", "recuperacion", "sintoma", "sintoma"],
  personal_growth: [
    "energia",
    "camino",
    "crecimiento personal",
    "proposito",
    "alma",
    "sentido",
    "aprendizaje",
    "evolucion",
    "evolucion",
  ],
  family: ["familia", "hogar", "casa", "madre", "padre", "hijo", "hija", "convivencia"],
  project: ["proyecto", "emprendimiento", "negocio", "marca", "clientes", "socios", "startup"],
  travel: ["viaje", "viajar", "mudanza", "traslado", "extranjero", "vuelo", "ciudad"],
};

const PANORAMIC_MULTI_DOMAIN_PATTERNS = [
  "como viene mi ano",
  "como viene este ano para mi",
  "como estara mi vida este ano",
  "como esta mi vida actualmente",
  "que debo saber en este momento",
  "que debo tener presente",
  "que energia atraviesa mi camino",
  "cual es el panorama general",
  "panorama general",
  "como vienen las distintas areas de mi vida",
  "como vienen las areas de mi vida",
  "que me espera en los proximos meses",
  "como viene mi vida",
];

const SUIT_THEME_BANK: Record<Exclude<DominantSuit, "mixto">, string[]> = {
  aire: ["conflicto", "verdad", "decision", "tension mental", "estrategia"],
  agua: ["vinculos", "emociones", "reconciliacion", "duelo", "afectividad"],
  tierra: ["recursos", "estabilidad", "trabajo", "resultados", "seguridad"],
  fuego: ["accion", "impulso", "expansion", "liderazgo", "iniciativa"],
  mayor: ["proceso estructural", "leccion central", "cambio profundo", "reordenamiento", "umbral de etapa"],
};

const THEME_LOCK_KEYWORDS: Record<Exclude<DominantTheme, "mixed_axis">, string[]> = {
  material_construction: ["recursos", "estabilidad", "trabajo", "dinero", "patrimonio", "resultados", "seguridad", "construccion"],
  mental_conflict: ["decision", "estrategia", "analisis", "verdad", "comunicacion", "conflicto", "tension mental", "prioridad"],
  emotional_bond: ["emociones", "vinculo", "afecto", "relacion", "sensibilidad", "duelo", "intimidad", "reconciliacion"],
  active_movement: ["accion", "impulso", "iniciativa", "liderazgo", "movimiento", "ejecucion", "avance", "deseo"],
  structural_transformation: ["ciclo", "cambio", "aprendizaje", "transformacion", "reordenamiento", "etapa", "destino", "leccion"],
};

const THEME_LOCK_SEEDS: Record<Exclude<DominantTheme, "mixed_axis">, string> = {
  material_construction: "La lectura gira alrededor de recursos, estabilidad y resultados concretos.",
  mental_conflict: "La lectura gira alrededor de decisiones, tension mental y necesidad de estrategia.",
  emotional_bond: "La lectura gira alrededor de vinculos, emociones y necesidades afectivas.",
  active_movement: "La lectura gira alrededor de accion, impulso y direccion del movimiento.",
  structural_transformation: "La lectura gira alrededor de un cambio de ciclo y una reconfiguracion profunda.",
};

const FORBIDDEN_GENERIC_DRIFT = [
  "claridad",
  "proposito",
  "evolucion",
  "crecimiento",
  "transformacion",
  "intuicion",
  "reflexion",
  "avanzar",
  "discernimiento",
];

export function detectReadingDomain(question: string): ReadingDomain {
  return detectQuestionIntent(question).domain;
}

export function detectQuestionIntent(question: string): QuestionIntentProfile {
  const normalized = normalize(question);
  const detectedMultiDomains = detectMultiDomainAreas(question);
  const isPanoramicMultiDomain = isPanoramicQuestion(normalized);
  if (detectedMultiDomains.length >= 2) {
    return buildMultiDomainQuestionIntentProfile(detectedMultiDomains);
  }
  if (isPanoramicMultiDomain && detectedMultiDomains.length === 0) {
    return buildMultiDomainQuestionIntentProfile(DEFAULT_MULTI_DOMAIN_AREAS);
  }

  const domain = detectReadingDomainByKeywords(question);
  const hasDecisionSignal = containsAny(normalized, [
    "debo",
    "conviene",
    "me conviene",
    "decidir",
    "decision",
    "elegir",
    "aceptar",
    "renunciar",
    "irme",
    "quedarme",
    "cambiar",
    "dejar",
    "seguir",
  ]);

  if (
    containsAny(normalized, ["ingresos", "ingreso", "ganar mas", "aumentar ingresos", "mejorar ingresos", "mas dinero"]) ||
    (domain === "dinero" && containsAny(normalized, ["aumentar", "mejorar", "multiplicar"]) && containsAny(normalized, ["dinero", "plata", "ventas", "ganancias"]))
  ) {
    return buildQuestionIntentProfile("improve_income", "dinero");
  }

  if (domain === "trabajo" && hasDecisionSignal) {
    return buildQuestionIntentProfile("career_decision", "trabajo");
  }

  if (
    domain === "amor" &&
    (containsAny(normalized, ["como viene", "como va", "estado", "situacion", "futuro", "relacion", "pareja", "vinculo"]) || !hasDecisionSignal)
  ) {
    return buildQuestionIntentProfile(hasDecisionSignal ? "relationship_decision" : "relationship_status", "amor");
  }

  if (
    containsAny(normalized, [
      "fuga mi energia",
      "fuga de energia",
      "pierdo energia",
      "se me va la energia",
      "me drena",
      "me drenan",
      "agotando",
      "agotamiento",
    ])
  ) {
    return buildQuestionIntentProfile("energy_leak", "espiritualidad");
  }

  switch (domain) {
    case "dinero":
      return buildQuestionIntentProfile(hasDecisionSignal ? "financial_decision" : "financial_outlook", domain);
    case "trabajo":
      return buildQuestionIntentProfile(containsAny(normalized, ["ascenso", "mejorar", "crecer", "oportunidad", "carrera"]) ? "career_growth" : "work_situation", domain);
    case "amor":
      return buildQuestionIntentProfile(hasDecisionSignal ? "relationship_decision" : "relationship_status", domain);
    case "salud":
      return buildQuestionIntentProfile(containsAny(normalized, ["recuper", "sanar", "habito", "rutina", "mejorar"]) ? "health_recovery" : "health_outlook", domain);
    case "proyecto":
      return buildQuestionIntentProfile(hasDecisionSignal ? "project_decision" : "project_growth", domain);
    case "viaje":
      return buildQuestionIntentProfile(hasDecisionSignal ? "travel_decision" : "travel_outlook", domain);
    case "familia":
      return buildQuestionIntentProfile("family_outlook", domain);
    case "decision":
      return buildQuestionIntentProfile("decision_path", domain);
    case "espiritualidad":
      return buildQuestionIntentProfile("spiritual_direction", domain);
    default:
      return buildQuestionIntentProfile("life_overview", "general");
  }
}

function detectMultiDomainAreas(question: string): MultiDomainArea[] {
  const normalized = normalize(question);
  return (Object.entries(MULTI_DOMAIN_KEYWORDS) as Array<[MultiDomainArea, string[]]>)
    .filter(([, terms]) => containsAny(normalized, terms))
    .map(([area]) => area);
}

function isPanoramicQuestion(normalizedQuestion: string): boolean {
  return PANORAMIC_MULTI_DOMAIN_PATTERNS.some((pattern) => normalizedQuestion.includes(normalize(pattern)));
}

function detectReadingDomainByKeywords(question: string): ReadingDomain {
  const normalized = normalize(question);

  const matchers: Array<[ReadingDomain, string[]]> = [
    [
      "amor",
      [
        "amor",
        "pareja",
        "relacion",
        "relación",
        "esposo",
        "esposa",
        "novio",
        "novia",
        "matrimonio",
        "boda",
        "vinculo",
        "vínculo",
        "compromiso",
        "sentimientos",
      ],
    ],
    [
      "trabajo",
      [
        "ascenso",
        "jefe",
        "empresa",
        "trabajo",
        "laboral",
        "profesion",
        "profesión",
        "cargo",
        "puesto",
        "empleo",
        "carrera",
        "reconocimiento",
      ],
    ],
    [
      "dinero",
      [
        "dinero",
        "inversion",
        "inversión",
        "prestamo",
        "préstamo",
        "deuda",
        "finanzas",
        "pago",
        "ahorro",
        "comprar",
        "venta",
        "perdida",
        "pérdida",
      ],
    ],
    [
      "salud",
      [
        "salud",
        "enfermedad",
        "cuerpo",
        "dolor",
        "sintoma",
        "síntoma",
        "agotamiento",
        "cansancio",
        "estrés",
        "estres",
        "recuperacion",
        "recuperación",
      ],
    ],
    [
      "espiritualidad",
      [
        "espiritual",
        "espiritualidad",
        "proposito",
        "propósito",
        "alma",
        "karma",
        "sentido",
        "aprendizaje",
        "evolucion",
        "evolución",
      ],
    ],
    [
      "familia",
      ["familia", "madre", "padre", "hijo", "hija", "hermano", "hermana", "casa", "convivencia"],
    ],
    [
      "decision",
      [
        "decision",
        "decisión",
        "decidir",
        "elegir",
        "debo",
        "conviene",
        "opcion",
        "opción",
        "aceptar",
        "renunciar",
        "quedarme",
        "irme",
      ],
    ],
    [
      "proyecto",
      [
        "proyecto",
        "emprendimiento",
        "emprender",
        "lanzamiento",
        "producto",
        "marca",
        "negocio",
        "startup",
        "clientes",
        "socios",
      ],
    ],
    [
      "viaje",
      [
        "viaje",
        "viajar",
        "mudanza",
        "mudarme",
        "traslado",
        "extranjero",
        "ciudad",
        "vuelo",
        "retorno",
        "regresar",
      ],
    ],
  ];

  return matchers.find(([, terms]) => terms.some((term) => normalized.includes(normalize(term))))?.[0] ?? "general";
}

function buildQuestionIntentProfile(intent: QuestionIntent, domain: ReadingDomain): QuestionIntentProfile {
  return {
    intent,
    domain,
    primaryFocus: PRIMARY_FOCUS_BY_INTENT[intent],
    isMultiDomain: false,
    domains: [],
  };
}

function buildMultiDomainQuestionIntentProfile(domains: MultiDomainArea[]): QuestionIntentProfile {
  const normalizedDomains = dedupeAreas(domains);
  return {
    intent: "life_overview",
    domain: "general",
    primaryFocus: normalizedDomains,
    isMultiDomain: true,
    domains: normalizedDomains,
  };
}

function dedupeAreas(areas: MultiDomainArea[]): MultiDomainArea[] {
  return Array.from(new Set(areas));
}

export function buildNarrativeContext(params: {
  question: string;
  spreadType: string;
  cards: CartaPosicionada[];
}): NarrativeContext {
  const questionIntent = detectQuestionIntent(params.question);
  const spreadType = params.spreadType || "generic";
  const cards = params.cards.map((card) => ({
    ...card,
    orientation: card.orientation,
    positionName: sanitizeNarrativeText(card.positionName, 120) || `Posicion ${card.positionNumber}`,
    cardName: sanitizeNarrativeText(card.cardName, 120) || "Carta no especificada",
    baseMeaning: sanitizeNarrativeText(card.baseMeaning, 700),
  }));

  return buildUniversalSpreadContext(params.question, spreadType, questionIntent, cards);
}

export function buildUniversalSpreadContext(
  question: string,
  spreadType: string,
  questionIntent: QuestionIntentProfile,
  cards: CartaPosicionada[]
): NarrativeContext {
  const { domain } = questionIntent;
  const roleMap = getSpreadNarrativeRoles(spreadType, cards);
  const narrativeCards = cards.map((card) => toNarrativeCard(card, roleMap.find((entry) => entry.positionNumber === card.positionNumber)?.role ?? "free", domain));
  const keyCards = pickSpreadKeyCards(narrativeCards, spreadType);
  return composeContext(question, spreadType, questionIntent, narrativeCards, keyCards, roleMap);
}

export function getSpreadNarrativeRoles(spreadType: string, cards: CartaPosicionada[]): NarrativeRoleMapEntry[] {
  const spreadKind = getSpreadKind(spreadType, cards);
  const rolesByPosition = getRolesBySpreadKind(spreadKind);

  return cards.map((card, index) => {
    const semanticRole = inferRoleFromPositionName(card.positionName, spreadKind);
    const role =
      spreadKind === "free"
        ? semanticRole ?? "free"
        : spreadKind === "relationships"
          ? semanticRole ?? rolesByPosition[card.positionNumber] ?? rolesByPosition[index + 1] ?? inferRoleFromName(card.positionName, card.positionNumber)
          : rolesByPosition[card.positionNumber] ?? rolesByPosition[index + 1] ?? semanticRole ?? inferRoleFromName(card.positionName, card.positionNumber);

    return {
      positionNumber: card.positionNumber,
      positionName: sanitizeNarrativeText(card.positionName, 120) || `Posicion ${card.positionNumber}`,
      role,
    };
  });
}

function getSpreadKind(spreadType: string, cards: CartaPosicionada[]): string {
  const normalized = normalize(spreadType);
  const positionText = normalize(cards.map((card) => card.positionName).join(" "));

  if (normalized.includes("manual") || normalized.includes("libre") || normalized.includes("free")) return "free";
  if (normalized.includes("celtic") || normalized.includes("cruz celta")) return "celtic-cross";
  if (normalized.includes("tree-of-life") || normalized.includes("arbol") || normalized.includes("kabala") || normalized.includes("kabbalah")) return "tree-of-life";
  if (normalized.includes("horseshoe") || normalized.includes("herradura")) return "horseshoe";
  if (normalized.includes("line-seven") || normalized.includes("linea de 7") || normalized.includes("linea 7")) return "line-seven";
  if (normalized.includes("decision")) return "decision";
  if (normalized.includes("relationship") || normalized.includes("relaciones")) return "relationships";
  if (normalized.includes("work-finance") || normalized.includes("trabajo") || normalized.includes("finanzas")) return "work-finance";
  if (normalized.includes("full-moon") || normalized.includes("luna")) return "full-moon";
  if (normalized.includes("pendulum") || normalized.includes("pendulo")) return "pendulum";
  if (normalized.includes("five") || normalized.includes("5 cartas")) return "five-cards";
  if (normalized.includes("situation-blockage-advice") || normalized.includes("3 cartas")) return "three-cards";

  if (positionText.includes("opcion a") || positionText.includes("opcion b")) return "decision";
  if (
    positionText.includes("vinculo") ||
    positionText.includes("tu energia") ||
    positionText.includes("su energia") ||
    positionText.includes("consultante") ||
    positionText.includes("otra persona") ||
    positionText.includes("pareja") ||
    positionText.includes("relacion") ||
    positionText.includes("dinamica")
  ) return "relationships";
  if (cards.length === 10 && positionText.includes("situacion actual") && positionText.includes("resultado")) return "celtic-cross";
  if (cards.length === 10 && (positionText.includes("kether") || positionText.includes("malkuth"))) return "tree-of-life";
  if (cards.length === 7 && positionText.includes("pasado") && positionText.includes("resultado")) return "horseshoe";
  if (cards.length === 7) return "line-seven";
  if (cards.length === 5) return "five-cards";
  if (cards.length === 3) return "three-cards";
  return "generic";
}

function getRolesBySpreadKind(spreadKind: string): Record<number, NarrativeCardRole> {
  const maps: Record<string, Record<number, NarrativeCardRole>> = {
    "three-cards": { 1: "situation", 2: "blockage", 3: "advice" },
    "five-cards": { 1: "origin", 2: "situation", 3: "hidden", 4: "advice", 5: "outcome" },
    horseshoe: { 1: "origin", 2: "situation", 3: "hidden", 4: "challenge", 5: "environment", 6: "advice", 7: "outcome" },
    "celtic-cross": {
      1: "origin",
      2: "central",
      3: "future",
      4: "challenge",
      5: "conscious",
      6: "unconscious",
      7: "selfView",
      8: "environment",
      9: "fear",
      10: "outcome",
    },
    "line-seven": { 1: "origin", 2: "past", 3: "situation", 4: "challenge", 5: "advice", 6: "future", 7: "outcome" },
    "tree-of-life": {
      1: "conscious",
      2: "advice",
      3: "hidden",
      4: "opportunity",
      5: "blockage",
      6: "central",
      7: "release",
      8: "action",
      9: "unconscious",
      10: "outcome",
    } as Record<number, NarrativeCardRole>,
    decision: { 1: "situation", 2: "decisionA", 3: "central", 4: "decisionB", 5: "advice" },
    relationships: { 1: "relationshipA", 2: "relationshipA", 3: "bond", 4: "relationshipB", 5: "outcome" },
    "work-finance": { 1: "situation", 2: "blockage", 3: "resources", 4: "opportunity", 5: "outcome" },
    "full-moon": { 1: "integration", 2: "lesson", 3: "outcome", 4: "release", 5: "hidden" },
    pendulum: { 1: "situation", 2: "answer", 3: "risk", 4: "opportunity", 5: "advice" },
  };

  return maps[spreadKind] ?? {};
}

function inferRoleFromPositionName(positionName: string, spreadKind: string): NarrativeCardRole | null {
  const name = normalize(positionName);

  if (spreadKind === "tree-of-life") {
    if (name.includes("kether")) return "conscious";
    if (name.includes("chokmah")) return "advice";
    if (name.includes("binah")) return "hidden";
    if (name.includes("chesed")) return "opportunity";
    if (name.includes("geburah")) return "blockage";
    if (name.includes("tiphareth")) return "central";
    if (name.includes("netzach")) return "release";
    if (name.includes("hod")) return "action";
    if (name.includes("yesod")) return "unconscious";
    if (name.includes("malkuth")) return "outcome";
  }

  if (name.includes("opcion a")) return "decisionA";
  if (name.includes("opcion b")) return "decisionB";
  if (name.includes("tu energia") || name === "tu" || name.includes("consultante") || name === "yo" || name.includes("mi energia")) return "relationshipA";
  if (name.includes("su energia") || name.includes("otra persona") || name.includes("pareja") || name.includes("su actitud")) return "relationshipB";
  if (name.includes("vinculo") || name.includes("relacion") || name.includes("dinamica") || name.includes("conexion")) return "bond";
  if (name.includes("bloqueo") || name.includes("obstaculo")) return "blockage";
  if (name.includes("reto") || name.includes("desafio") || name.includes("tension")) return "challenge";
  if (name.includes("consejo") || name.includes("guia")) return "advice";
  if (name.includes("resultado") || name.includes("desenlace") || name.includes("sintesis") || name.includes("manifestacion")) return "outcome";
  if (name.includes("situacion") || name.includes("presente") || name.includes("pregunta")) return "situation";
  if (name.includes("origen") || name.includes("inicio") || name.includes("pasado") || name.includes("vengo")) return "origin";
  if (name.includes("futuro") || name.includes("direccion") || name.includes("resolucion")) return "future";
  if (name.includes("mente") || name.includes("consciente")) return "conscious";
  if (name.includes("inconsciente") || name.includes("piso") || name.includes("raiz") || name.includes("oculta")) return "unconscious";
  if (name.includes("entorno") || name.includes("extern")) return "environment";
  if (name.includes("temor") || name.includes("miedo") || name.includes("duda")) return "fear";
  if (name.includes("recurso")) return "resources";
  if (name.includes("posibilidad") || name.includes("oportunidad")) return "opportunity";
  if (name.includes("riesgo")) return "risk";
  if (name.includes("liberar") || name.includes("soltar") || name.includes("liberacion")) return "release";
  if (name.includes("integrar") || name.includes("integracion") || name.includes("aprendizaje")) return "integration";
  if (name.includes("leccion")) return "lesson";

  return null;
}

export function getDomainMeaning(card: CartaPosicionada, orientation: "derecho" | "invertido", domain: ReadingDomain): string {
  const officialMeaning = getOfficialDomainMeaning(card, orientation, domain);
  if (officialMeaning) return officialMeaning;

  const cardKey = normalize(card.cardName);
  const specific = DOMAIN_CARD_MEANINGS[cardKey]?.[domain];
  if (specific) return sanitizeNarrativeText(withOrientation(specific, orientation, domain));

  const base = sanitizeNarrativeText(card.baseMeaning, 700);
  if (base) return adaptBaseMeaningToDomain(base, domain, orientation);

  const suitMeaning = getSuitDomainMeaning(card.cardName, domain);
  return sanitizeNarrativeText(withOrientation(suitMeaning, orientation, domain));
}

export function deriveNarrativeContext(
  cards: NarrativeCard[],
  domain: ReadingDomain,
  spreadType: string
): NarrativeSummary {
  const central = findFirstByRoles(cards, ["situation", "central", "present"]) ?? cards[0];
  const challenge = findFirstByRoles(cards, ["blockage", "challenge", "risk", "hidden"]) ?? findByPositionName(cards, ["reto", "obstaculo", "obstáculo", "desafio", "desafío"]);
  const outcome = findFirstByRoles(cards, ["outcome", "answer", "future"]) ?? cards[cards.length - 1];
  const unconscious = findByRole(cards, "unconscious") ?? findByPositionName(cards, ["inconsciente", "raiz", "raíz", "oculta"]);
  const fear = findByRole(cards, "fear") ?? findByPositionName(cards, ["temor", "miedo", "duda"]);
  const future = findFirstByRoles(cards, ["future", "opportunity"]);
  const conscious = findFirstByRoles(cards, ["conscious", "advice", "integration"]);
  const narrativeAxes = detectNarrativeAxes(cards, domain, spreadType);
  const storySpine = buildUniversalStorySpine(cards, narrativeAxes, domain, spreadType);

  return {
    coreTheme: buildCoreTheme(storySpine, narrativeAxes),
    mainConflict: buildMainConflict(narrativeAxes, central, challenge),
    mainContradiction: buildMainContradiction(narrativeAxes, central, challenge, conscious, unconscious),
    mainRisk: buildMainRisk(narrativeAxes, storySpine, challenge, fear, outcome),
  mainOpportunity: buildMainOpportunity(narrativeAxes, storySpine, future, conscious, unconscious),
  likelyOutcome: buildLikelyOutcome(storySpine, outcome),
  dominantThemes: narrativeAxes.dominantThemes,
  secondaryThemes: narrativeAxes.secondaryThemes,
  dominantSuit: narrativeAxes.dominantSuit,
  dominantArcanaSignal: narrativeAxes.dominantArcanaSignal,
  narrativeTone: narrativeAxes.narrativeTone,
  dominantEnergy: narrativeAxes.dominantEnergy,
    missingEnergy: narrativeAxes.missingEnergy,
    turningPoint: narrativeAxes.turningPoint,
    primaryAxis: narrativeAxes.primaryAxis,
    secondaryAxis: narrativeAxes.secondaryAxis,
    storySpine,
    narrativeWarnings: narrativeAxes.narrativeWarnings,
  };
}

function composeContext(
  question: string,
  spreadType: string,
  questionIntent: QuestionIntentProfile,
  allCards: NarrativeCard[],
  keyCards: NarrativeCard[],
  roleMap: NarrativeRoleMapEntry[] = allCards.map((card) => ({
    positionNumber: card.positionNumber,
    positionName: card.positionName,
    role: card.role,
  }))
): NarrativeContext {
  const { domain, intent, primaryFocus, isMultiDomain, domains } = questionIntent;
  const fallbackKeyCards = keyCards.length ? keyCards : pickFlexibleKeyCards(allCards);
  const summary = deriveNarrativeContext(allCards, domain, spreadType);
  const pendulumContext = buildPendulumContext(allCards, spreadType, summary);
  const relationshipContext = buildRelationshipContext(allCards, spreadType, summary);
  const decisionContext = buildDecisionContext(allCards, spreadType, domain);
  const freePositionContext = buildFreePositionContext(allCards, spreadType);
  const themeLockProfile = buildThemeLockProfile({
    cards: allCards,
    keyCards: fallbackKeyCards,
    dominantSuit: summary.dominantSuit,
    dominantArcanaSignal: summary.dominantArcanaSignal,
    dominantThemes: summary.dominantThemes,
  });
  const keySet = new Set(fallbackKeyCards.map((card) => card.positionNumber));
  return {
    domain,
    spreadType: sanitizeNarrativeText(spreadType, 120),
    question: sanitizeNarrativeText(question, 500),
    intent,
    primaryFocus: primaryFocus.map((focus) => sanitizeNarrativeText(focus, 40)).filter(Boolean),
    isMultiDomain,
    domains: domains.map((entry) => sanitizeNarrativeText(entry, 40) as MultiDomainArea).filter(Boolean),
    pendulumMode: Boolean(pendulumContext),
    pendulumContext: pendulumContext
      ? {
          decisionSignal: pendulumContext.decisionSignal,
          confidenceLevel: pendulumContext.confidenceLevel,
          answerCard: sanitizeNullableNarrativeCard(pendulumContext.answerCard),
          supportingRisk: sanitizeNullableNarrativeCard(pendulumContext.supportingRisk),
          supportingOpportunity: sanitizeNullableNarrativeCard(pendulumContext.supportingOpportunity),
          supportingAdvice: sanitizeNullableNarrativeCard(pendulumContext.supportingAdvice),
          justificationSeed: sanitizeNarrativeText(pendulumContext.justificationSeed, 220),
        }
      : undefined,
    relationshipMode: Boolean(relationshipContext),
    relationshipContext: relationshipContext
      ? {
          selfEnergy: sanitizeNullableNarrativeCard(relationshipContext.selfEnergy),
          otherEnergy: sanitizeNullableNarrativeCard(relationshipContext.otherEnergy),
          relationshipBond: sanitizeNullableNarrativeCard(relationshipContext.relationshipBond),
          likelyOutcome: sanitizeNullableNarrativeCard(relationshipContext.likelyOutcome),
          bondNarrativeCore: relationshipContext.bondNarrativeCore
            ? {
                centralTheme: sanitizeNarrativeText(relationshipContext.bondNarrativeCore.centralTheme, 220),
                mainTension: sanitizeNarrativeText(relationshipContext.bondNarrativeCore.mainTension, 220),
                centralLearning: sanitizeNarrativeText(relationshipContext.bondNarrativeCore.centralLearning, 220),
                bondDirection: sanitizeNarrativeText(relationshipContext.bondNarrativeCore.bondDirection, 220),
              }
            : null,
        }
      : undefined,
    decisionContext,
    dominantThemes: summary.dominantThemes.map((entry) => sanitizeNarrativeText(entry, 80)).filter(Boolean),
    secondaryThemes: summary.secondaryThemes.map((entry) => sanitizeNarrativeText(entry, 80)).filter(Boolean),
    dominantSuit: summary.dominantSuit,
    dominantArcanaSignal: summary.dominantArcanaSignal,
    narrativeTone: summary.narrativeTone,
    dominantTheme: themeLockProfile.dominantTheme,
    dominantSubTheme: sanitizeNarrativeText(themeLockProfile.dominantSubTheme, 180),
    thematicKeywords: themeLockProfile.thematicKeywords.map((entry) => sanitizeNarrativeText(entry, 60)).filter(Boolean),
    thematicNarrativeSeed: sanitizeNarrativeText(themeLockProfile.thematicNarrativeSeed, 220),
    forbiddenGenericDrift: themeLockProfile.forbiddenGenericDrift.map((entry) => sanitizeNarrativeText(entry, 40)).filter(Boolean),
    coreTheme: sanitizeNarrativeText(summary.coreTheme),
    mainConflict: sanitizeNarrativeText(summary.mainConflict),
    mainContradiction: sanitizeNarrativeText(summary.mainContradiction),
    mainRisk: sanitizeNarrativeText(summary.mainRisk),
    mainOpportunity: sanitizeNarrativeText(summary.mainOpportunity),
    likelyOutcome: sanitizeNarrativeText(summary.likelyOutcome),
    dominantEnergy: sanitizeNarrativeText(summary.dominantEnergy),
    missingEnergy: sanitizeNarrativeText(summary.missingEnergy),
    turningPoint: sanitizeNarrativeText(summary.turningPoint),
    primaryAxis: sanitizeNarrativeAxis(summary.primaryAxis),
    secondaryAxis: sanitizeNarrativeAxis(summary.secondaryAxis),
    storySpine: sanitizeStorySpine(summary.storySpine),
    narrativeWarnings: summary.narrativeWarnings.map((warning) => sanitizeNarrativeText(warning, 500)).filter(Boolean),
    freePositionContext: freePositionContext
      ? {
          isFreeSpread: true,
          customPositions: freePositionContext.customPositions.map((entry) => ({
            positionNumber: entry.positionNumber,
            positionName: sanitizeNarrativeText(entry.positionName, 120),
            cardName: sanitizeNarrativeText(entry.cardName, 120),
            orientation: entry.orientation,
            interpretedRole: sanitizeNarrativeText(entry.interpretedRole, 60),
            positionNarrativeMeaning: sanitizeNarrativeText(entry.positionNarrativeMeaning, 240),
          })),
          freeSpreadNarrativeAxis: sanitizeNarrativeText(freePositionContext.freeSpreadNarrativeAxis, 500),
        }
      : undefined,
    roleMap: roleMap.map(sanitizeRoleMapEntry),
    keyCards: fallbackKeyCards.map(sanitizeNarrativeCard),
    supportCards: allCards.filter((card) => !keySet.has(card.positionNumber)).map(sanitizeNarrativeCard),
  };
}

function buildDecisionContext(
  cards: NarrativeCard[],
  spreadType: string,
  domain: ReadingDomain
): DecisionContext | undefined {
  if (getSpreadKind(spreadType, cards) !== "decision") {
    return undefined;
  }

  const decisionA = findByRole(cards, "decisionA");
  const decisionB = findByRole(cards, "decisionB");
  if (!decisionA || !decisionB) {
    return undefined;
  }

  const context = {
    situation: findByRole(cards, "situation") ?? findByRole(cards, "central") ?? cards[0],
    central: findByRole(cards, "central"),
    advice: findByRole(cards, "advice"),
    domain,
  };

  const decisionAAnalysis = analyzeDecisionOption("A", decisionA, context);
  const decisionBAnalysis = analyzeDecisionOption("B", decisionB, context);
  const scoreDelta = roundDecisionScore(decisionAAnalysis.score - decisionBAnalysis.score);
  const preferredOption = scoreDelta >= 0 ? "A" : "B";
  const alternativeOption = preferredOption === "A" ? "B" : "A";
  const preferredAnalysis = preferredOption === "A" ? decisionAAnalysis : decisionBAnalysis;
  const alternativeAnalysis = alternativeOption === "A" ? decisionAAnalysis : decisionBAnalysis;

  return sanitizeDecisionContext({
    preferredOption,
    preferredOptionReason: buildPreferredDecisionReason(preferredAnalysis, alternativeAnalysis, scoreDelta),
    alternativeOption,
    alternativeOptionRisk: buildAlternativeDecisionRisk(alternativeAnalysis),
    decisionSignal: detectDecisionSignal(scoreDelta),
    confidenceLevel: detectDecisionConfidence(scoreDelta),
    decisionAAnalysis,
    decisionBAnalysis,
  });
}

function buildRelationshipContext(
  cards: NarrativeCard[],
  spreadType: string,
  summary: NarrativeSummary
): RelationshipProfile | undefined {
  const spreadKind = getSpreadKind(spreadType, cards);
  const selfEnergy =
    findFirstByRoles(cards, ["relationshipA", "selfView"]) ??
    findByPositionName(cards, ["tu energia", "tu energía", "consultante", "yo", "mi energia", "mi energía"]);
  const otherEnergy =
    findByRole(cards, "relationshipB") ??
    findByPositionName(cards, ["su energia", "su energía", "otra persona", "la otra persona", "pareja", "su actitud"]);
  const relationshipBond =
    findByRole(cards, "bond") ??
    findByPositionName(cards, ["vinculo", "vínculo", "relacion", "relación", "dinamica", "dinámica", "conexion", "conexión"]);
  const likelyOutcome =
    findByRole(cards, "outcome") ??
    findByPositionName(cards, ["resultado", "desenlace", "futuro del vinculo", "futuro de la relacion"]) ??
    null;

  const shouldActivate =
    spreadKind === "relationships" ||
    (Boolean(selfEnergy) && Boolean(otherEnergy) && Boolean(relationshipBond));

  if (!shouldActivate) {
    return undefined;
  }

  return {
    selfEnergy: selfEnergy ?? null,
    otherEnergy: otherEnergy ?? null,
    relationshipBond: relationshipBond ?? null,
    likelyOutcome,
    bondNarrativeCore: buildRelationshipBondNarrativeCore(
      relationshipBond ?? null,
      selfEnergy ?? null,
      otherEnergy ?? null,
      likelyOutcome,
      summary
    ),
  };
}

function buildPendulumContext(
  cards: NarrativeCard[],
  spreadType: string,
  summary: NarrativeSummary
): PendulumProfile | undefined {
  if (getSpreadKind(spreadType, cards) !== "pendulum") {
    return undefined;
  }

  const answerCard = findByRole(cards, "answer") ?? cards[1] ?? cards[0] ?? null;
  if (!answerCard) {
    return undefined;
  }

  const supportingRisk = findByRole(cards, "risk") ?? null;
  const supportingOpportunity = findByRole(cards, "opportunity") ?? null;
  const supportingAdvice = findByRole(cards, "advice") ?? null;
  const answerScore = scoreDecisionCard(answerCard);
  const riskScore = supportingRisk ? scoreDecisionCard(supportingRisk) * 0.6 : 0;
  const opportunityScore = supportingOpportunity ? scoreDecisionCard(supportingOpportunity) * 0.6 : 0;
  const adviceScore = supportingAdvice ? scoreDecisionSynergy(answerCard, supportingAdvice) * 0.5 : 0;
  const totalScore = roundDecisionScore(answerScore + opportunityScore - riskScore + adviceScore);
  const decisionSignal = detectPendulumDecisionSignal(totalScore);

  return {
    decisionSignal,
    confidenceLevel: detectPendulumConfidence(totalScore),
    answerCard,
    supportingRisk,
    supportingOpportunity,
    supportingAdvice,
    justificationSeed: buildPendulumJustificationSeed(
      decisionSignal,
      answerCard,
      supportingRisk,
      supportingOpportunity,
      supportingAdvice,
      summary
    ),
  };
}

function detectPendulumDecisionSignal(score: number): PendulumContext["decisionSignal"] {
  if (score >= 1.6) return "SI";
  if (score <= -1.6) return "NO";
  return "TAL_VEZ";
}

function detectPendulumConfidence(score: number): ConfidenceLevel {
  const absolute = Math.abs(score);
  if (absolute >= 3) return "high";
  if (absolute >= 1.6) return "medium";
  return "low";
}

function buildPendulumJustificationSeed(
  decisionSignal: PendulumContext["decisionSignal"],
  answerCard: NarrativeCard,
  supportingRisk: NarrativeCard | null,
  supportingOpportunity: NarrativeCard | null,
  supportingAdvice: NarrativeCard | null,
  summary: NarrativeSummary
): string {
  const base =
    decisionSignal === "SI"
      ? supportingOpportunity ?? supportingAdvice ?? answerCard
      : decisionSignal === "NO"
        ? supportingRisk ?? answerCard
        : supportingAdvice ?? supportingRisk ?? supportingOpportunity ?? answerCard;
  const connector =
    decisionSignal === "SI"
      ? "La energia dominante favorece el avance"
      : decisionSignal === "NO"
        ? "La energia dominante frena o desaconseja el avance"
        : "La energia dominante no cierra una respuesta absoluta";

  return sanitizeNarrativeText(
    `${connector} porque ${cardEssence(base)}. ${summary.turningPoint || summary.mainConflict || summary.likelyOutcome}`,
    220
  );
}

function buildRelationshipBondNarrativeCore(
  relationshipBond: NarrativeCard | null,
  selfEnergy: NarrativeCard | null,
  otherEnergy: NarrativeCard | null,
  likelyOutcome: NarrativeCard | null,
  summary: NarrativeSummary
): RelationshipBondNarrativeCore | null {
  if (!relationshipBond) {
    return null;
  }

  const centralTheme = shortenSentence(
    relationshipBond.domainMeaning || cardEssence(relationshipBond) || summary.coreTheme,
    180
  );
  const mainTensionSource =
    summary.primaryAxis.meaning ||
    summary.mainConflict ||
    summary.mainContradiction ||
    relationshipBond.narrativeFunction ||
    cardEssence(relationshipBond);
  const centralLearningSource =
    summary.storySpine.whatMustBeIntegrated ||
    summary.mainOpportunity ||
    summary.secondaryAxis.meaning ||
    relationshipBond.narrativeFunction ||
    cardEssence(relationshipBond);
  const bondDirectionSource =
    summary.storySpine.likelyEvolution ||
    summary.likelyOutcome ||
    domainSentence(likelyOutcome ?? relationshipBond);

  return {
    centralTheme,
    mainTension: shortenSentence(mainTensionSource, 180),
    centralLearning: shortenSentence(centralLearningSource, 180),
    bondDirection: shortenSentence(bondDirectionSource, 180),
  };
}

function analyzeDecisionOption(
  option: "A" | "B",
  card: NarrativeCard,
  context: {
    situation?: NarrativeCard;
    central?: NarrativeCard;
    advice?: NarrativeCard;
    domain: ReadingDomain;
  }
): DecisionOptionAnalysis {
  const baseScore = scoreDecisionCard(card);
  const centralAdjustment = scoreDecisionSynergy(card, context.central);
  const adviceAdjustment = scoreDecisionSynergy(card, context.advice);
  const situationAdjustment = context.situation ? scoreDecisionSynergy(card, context.situation) * 0.5 : 0;
  const score = roundDecisionScore(baseScore + centralAdjustment + adviceAdjustment + situationAdjustment);
  const blockages = collectDecisionBlockages(card, context);
  const opportunities = collectDecisionOpportunities(card, context);

  return sanitizeDecisionOptionAnalysis({
    option,
    positionName: card.positionName,
    cardName: card.cardName,
    orientation: card.orientation,
    dominantEnergy: sanitizeNarrativeText(card.domainMeaning || cardEssence(card), 220),
    blockages,
    opportunities,
    likelyEvolution: buildDecisionEvolution(card, context, score),
    narrativeCoherence: describeDecisionCoherence(score, context.domain),
    score,
  });
}

function sanitizeDecisionContext(decisionContext: DecisionContext): DecisionContext {
  return {
    preferredOption: decisionContext.preferredOption,
    preferredOptionReason: sanitizeNarrativeText(decisionContext.preferredOptionReason, 350),
    alternativeOption: decisionContext.alternativeOption,
    alternativeOptionRisk: sanitizeNarrativeText(decisionContext.alternativeOptionRisk, 300),
    decisionSignal: decisionContext.decisionSignal,
    confidenceLevel: decisionContext.confidenceLevel,
    decisionAAnalysis: sanitizeDecisionOptionAnalysis(decisionContext.decisionAAnalysis),
    decisionBAnalysis: sanitizeDecisionOptionAnalysis(decisionContext.decisionBAnalysis),
  };
}

function sanitizeDecisionOptionAnalysis(analysis: DecisionOptionAnalysis): DecisionOptionAnalysis {
  return {
    ...analysis,
    positionName: sanitizeNarrativeText(analysis.positionName, 120),
    cardName: sanitizeNarrativeText(analysis.cardName, 120),
    dominantEnergy: sanitizeNarrativeText(analysis.dominantEnergy, 220),
    blockages: analysis.blockages.map((entry) => sanitizeNarrativeText(entry, 180)).filter(Boolean),
    opportunities: analysis.opportunities.map((entry) => sanitizeNarrativeText(entry, 180)).filter(Boolean),
    likelyEvolution: sanitizeNarrativeText(analysis.likelyEvolution, 260),
    narrativeCoherence: sanitizeNarrativeText(analysis.narrativeCoherence, 220),
    score: roundDecisionScore(analysis.score),
  };
}

function toNarrativeCard(card: CartaPosicionada, role: NarrativeCardRole, domain: ReadingDomain): NarrativeCard {
  const domainMeaning = sanitizeNarrativeText(getDomainMeaning(card, card.orientation, domain), 900);
  return sanitizeNarrativeCard({
    positionNumber: card.positionNumber,
    positionName: sanitizeNarrativeText(card.positionName, 120),
    cardName: sanitizeNarrativeText(card.cardName, 120),
    orientation: card.orientation,
    role,
    domainMeaning,
    narrativeFunction: buildNarrativeFunction(card, role, domain, domainMeaning),
  });
}

function sanitizeNarrativeCard(card: NarrativeCard): NarrativeCard {
  return {
    ...card,
    positionName: sanitizeNarrativeText(card.positionName, 120),
    cardName: sanitizeNarrativeText(card.cardName, 120),
    domainMeaning: sanitizeNarrativeText(card.domainMeaning, 900),
    narrativeFunction: sanitizeNarrativeText(card.narrativeFunction, 1000),
  };
}

function sanitizeNullableNarrativeCard(card: NarrativeCard | null): NarrativeCard | null {
  return card ? sanitizeNarrativeCard(card) : null;
}

function sanitizeNarrativeAxis(axis: NarrativeAxis): NarrativeAxis {
  return {
    cards: axis.cards.map((card) => sanitizeNarrativeText(card, 160)).filter(Boolean),
    meaning: sanitizeNarrativeText(axis.meaning, 900),
    why: sanitizeNarrativeText(axis.why, 700),
  };
}

function sanitizeRoleMapEntry(entry: NarrativeRoleMapEntry): NarrativeRoleMapEntry {
  return {
    positionNumber: entry.positionNumber,
    positionName: sanitizeNarrativeText(entry.positionName, 120),
    role: entry.role,
  };
}

function sanitizeStorySpine(storySpine: NarrativeStorySpine): NarrativeStorySpine {
  return {
    currentState: sanitizeNarrativeText(storySpine.currentState, 900),
    whatWantsToEmerge: sanitizeNarrativeText(storySpine.whatWantsToEmerge, 900),
    whatBlocksIt: sanitizeNarrativeText(storySpine.whatBlocksIt, 900),
    whatMustBeIntegrated: sanitizeNarrativeText(storySpine.whatMustBeIntegrated, 900),
    likelyEvolution: sanitizeNarrativeText(storySpine.likelyEvolution, 900),
  };
}

function buildNarrativeFunction(
  card: CartaPosicionada,
  role: NarrativeCardRole,
  domain: ReadingDomain,
  domainMeaning: string
): string {
  const roleLabel = roleLabels[role];
  return `${card.cardName} ${card.orientation} en ${card.positionName} funciona como ${roleLabel}: ${domainMeaning}`;
}

function scoreDecisionCard(card: NarrativeCard): number {
  const textScore = scoreDecisionText(`${card.domainMeaning} ${cardEssence(card)}`);
  const archetypeScore = DECISION_CARD_WEIGHTS[canonicalCardName(card.cardName)] ?? 0;
  const orientationScore = card.orientation === "derecho" ? 0.75 : -1.25;
  const majorScore = getCardElement(card) === "mayor" ? (card.orientation === "derecho" ? 0.35 : -0.35) : 0;
  return roundDecisionScore(textScore + archetypeScore + orientationScore + majorScore);
}

function scoreDecisionText(value: string): number {
  const normalized = normalize(value);
  let score = 0;

  for (const term of DECISION_POSITIVE_TERMS) {
    if (normalized.includes(term)) score += 0.45;
  }
  for (const term of DECISION_NEGATIVE_TERMS) {
    if (normalized.includes(term)) score -= 0.45;
  }

  return roundDecisionScore(score);
}

function scoreDecisionSynergy(primary: NarrativeCard, secondary?: NarrativeCard): number {
  if (!secondary) return 0;

  const primaryScore = scoreDecisionCard(primary);
  const secondaryScore = scoreDecisionCard(secondary);
  if (primaryScore === 0 || secondaryScore === 0) return 0;

  let score = Math.sign(primaryScore) === Math.sign(secondaryScore) ? 0.7 : -0.7;
  if (areComplementary(primary, secondary)) score += 0.35;
  if (getCardElement(primary) === getCardElement(secondary)) score += 0.2 * Math.sign(primaryScore);

  return roundDecisionScore(score);
}

function collectDecisionBlockages(
  card: NarrativeCard,
  context: { central?: NarrativeCard; advice?: NarrativeCard; situation?: NarrativeCard }
): string[] {
  const blockages: string[] = [];

  if (card.orientation === "invertido") {
    blockages.push(`La opcion ${decisionRoleLabel(card.role)} carga un bloqueo directo: ${cardEssence(card)}.`);
  }

  if (scoreDecisionCard(card) < 0) {
    blockages.push(`La narrativa de ${card.cardName} se inclina hacia ${shortenSentence(card.domainMeaning, 120)}.`);
  }

  if (context.central && scoreDecisionSynergy(card, context.central) < 0) {
    blockages.push(`Choca con el centro de la tirada: ${cardEssence(context.central)}.`);
  }

  if (context.advice && scoreDecisionSynergy(card, context.advice) < 0) {
    blockages.push(`No se alinea con el consejo de la mesa: ${cardEssence(context.advice)}.`);
  }

  return Array.from(new Set(blockages)).slice(0, 3);
}

function collectDecisionOpportunities(
  card: NarrativeCard,
  context: { central?: NarrativeCard; advice?: NarrativeCard; situation?: NarrativeCard }
): string[] {
  const opportunities: string[] = [];

  if (scoreDecisionCard(card) > 0) {
    opportunities.push(`Abre ${shortenSentence(card.domainMeaning, 120)}.`);
  }

  if (context.central && scoreDecisionSynergy(card, context.central) > 0) {
    opportunities.push(`Se sostiene bien con el nucleo actual de la tirada: ${cardEssence(context.central)}.`);
  }

  if (context.advice && scoreDecisionSynergy(card, context.advice) > 0) {
    opportunities.push(`Responde al consejo de la mesa: ${cardEssence(context.advice)}.`);
  }

  return Array.from(new Set(opportunities)).slice(0, 3);
}

function buildDecisionEvolution(
  card: NarrativeCard,
  context: { central?: NarrativeCard; advice?: NarrativeCard; situation?: NarrativeCard },
  score: number
): string {
  if (score >= 1.5) {
    return `Si eliges ${decisionRoleLabel(card.role)}, la tendencia favorece ${cardEssence(card)} con apoyo de ${cardEssence(context.advice ?? context.central ?? card)}.`;
  }
  if (score <= -1.5) {
    return `Si eliges ${decisionRoleLabel(card.role)}, la tendencia arrastra ${cardEssence(card)} y puede terminar tensionando ${cardEssence(context.central ?? context.advice ?? card)}.`;
  }
  return `Si eliges ${decisionRoleLabel(card.role)}, la evolucion depende de ordenar ${cardEssence(card)} antes de sostener ${cardEssence(context.advice ?? context.central ?? card)}.`;
}

function describeDecisionCoherence(score: number, domain: ReadingDomain): string {
  if (score >= 2.5) {
    return `La opcion muestra una narrativa coherente y favorable en el dominio ${domain}.`;
  }
  if (score >= 0.75) {
    return `La opcion tiene una base util, aunque todavia exige sostener mejor su coherencia en ${domain}.`;
  }
  if (score <= -2.5) {
    return `La opcion se desordena frente a lo que la tirada considera sostenible en ${domain}.`;
  }
  return `La opcion presenta una coherencia fragil: no cae por completo, pero tampoco muestra una ventaja clara en ${domain}.`;
}

function buildPreferredDecisionReason(
  preferred: DecisionOptionAnalysis,
  alternative: DecisionOptionAnalysis,
  scoreDelta: number
): string {
  const mainOpportunity = preferred.opportunities[0] ?? preferred.dominantEnergy;
  const mainContrast = alternative.blockages[0] ?? alternative.dominantEnergy;
  const clarity =
    Math.abs(scoreDelta) >= 4
      ? "La diferencia es clara."
      : Math.abs(scoreDelta) >= 2
        ? "La balanza se inclina con suficiente nitidez."
        : "La diferencia no es absoluta, pero si consistente.";

  return `${preferred.positionName} queda mejor sostenida porque ${mainOpportunity} En cambio, ${alternative.positionName} arrastra ${mainContrast} ${clarity}`;
}

function buildAlternativeDecisionRisk(alternative: DecisionOptionAnalysis): string {
  return (
    alternative.blockages[0] ??
    `El riesgo de ${alternative.positionName} es caer en ${shortenSentence(alternative.dominantEnergy, 120)} sin una estructura suficientemente estable.`
  );
}

function detectDecisionSignal(scoreDelta: number): DecisionSignal {
  if (scoreDelta >= 4) return "strongly_favors_a";
  if (scoreDelta >= 1.5) return "favors_a";
  if (scoreDelta <= -4) return "strongly_favors_b";
  if (scoreDelta <= -1.5) return "favors_b";
  return "balanced";
}

function detectDecisionConfidence(scoreDelta: number): ConfidenceLevel {
  const absolute = Math.abs(scoreDelta);
  if (absolute >= 4) return "high";
  if (absolute >= 2) return "medium";
  return "low";
}

function roundDecisionScore(value: number): number {
  return Math.round(value * 10) / 10;
}

function decisionRoleLabel(role: NarrativeCardRole): "A" | "B" {
  return role === "decisionB" ? "B" : "A";
}

function buildThematicProfile(cards: NarrativeCard[]): {
  dominantThemes: string[];
  secondaryThemes: string[];
  dominantSuit: DominantSuit;
  dominantArcanaSignal: DominantArcanaSignal;
  narrativeTone: NarrativeTone;
} {
  const elementCounts = new Map<DominantSuit, number>();
  let majorCount = 0;
  let minorCount = 0;

  for (const card of cards) {
    const element = getCardElement(card);
    elementCounts.set(element, (elementCounts.get(element as DominantSuit) ?? 0) + 1);
    if (element === "mayor") majorCount += 1;
    else minorCount += 1;
  }

  const topEntries = [...elementCounts.entries()].sort((a, b) => b[1] - a[1]);
  const dominantEntry = topEntries[0];
  const secondEntry = topEntries[1];
  const dominantSuit: DominantSuit =
    !dominantEntry
      ? "mixto"
      : secondEntry && dominantEntry[1] === secondEntry[1] && dominantEntry[0] !== "mayor" && secondEntry[0] !== "mayor"
        ? "mixto"
        : dominantEntry[0];

  const dominantArcanaSignal =
    majorCount >= Math.max(2, minorCount)
      ? "major_dominant"
      : minorCount >= Math.max(3, majorCount + 2)
        ? "minor_dominant"
        : "balanced";

  const dominantThemes = collectThemesForProfile(dominantSuit, dominantArcanaSignal, "dominant");
  const secondaryThemes = collectThemesForProfile(dominantSuit, dominantArcanaSignal, "secondary", secondEntry?.[0] as DominantSuit | undefined);
  const narrativeTone = buildNarrativeTone(cards, dominantSuit, dominantArcanaSignal, topEntries);

  return {
    dominantThemes,
    secondaryThemes,
    dominantSuit,
    dominantArcanaSignal,
    narrativeTone,
  };
}

function buildNarrativeTone(
  cards: NarrativeCard[],
  dominantSuit: DominantSuit,
  dominantArcanaSignal: DominantArcanaSignal,
  sortedEntries: Array<[DominantSuit, number]>
): NarrativeTone {
  if (dominantArcanaSignal === "major_dominant" || dominantSuit === "mayor") {
    return "transformational";
  }

  const resolvedSuit =
    dominantSuit === "mixto"
      ? sortedEntries.find(([suit]) => suit !== "mayor")?.[0] ?? "mayor"
      : dominantSuit;

  if (resolvedSuit === "aire") return "strategic";
  if (resolvedSuit === "agua") return "emotional";
  if (resolvedSuit === "tierra") return "practical";
  if (resolvedSuit === "fuego") return "dynamic";
  if (cards.some((card) => getCardElement(card) === "mayor")) return "transformational";
  return "practical";
}

function buildFreePositionContext(cards: NarrativeCard[], spreadType: string): FreePositionProfile | undefined {
  if (getSpreadKind(spreadType, cards) !== "free" || cards.length === 0) {
    return undefined;
  }

  const customPositions = cards.map((card) => {
    const roleProfile = inferFreePositionRole(card.positionName);
    return {
      positionNumber: card.positionNumber,
      positionName: card.positionName,
      cardName: card.cardName,
      orientation: card.orientation,
      interpretedRole: roleProfile.interpretedRole,
      positionNarrativeMeaning: roleProfile.positionNarrativeMeaning,
    };
  });

  return {
    isFreeSpread: true,
    customPositions,
    freeSpreadNarrativeAxis: buildFreeSpreadNarrativeAxis(customPositions),
  };
}

function inferFreePositionRole(positionName: string): {
  interpretedRole: string;
  positionNarrativeMeaning: string;
} {
  const normalized = normalize(positionName);

  if (normalized.includes("consultante") || normalized === "yo" || normalized.includes("mi estado")) {
    return {
      interpretedRole: "consultante",
      positionNarrativeMeaning: "representa el estado interno, actitud, miedo o energia actual del consultante.",
    };
  }
  if (normalized.includes("relacion") || normalized.includes("vinculo") || normalized.includes("conexion")) {
    return {
      interpretedRole: "vinculo",
      positionNarrativeMeaning: "representa la dinamica central entre las partes.",
    };
  }
  if (normalized.includes("otra persona") || normalized.includes("la otra persona") || normalized.includes("su energia") || normalized.includes("su actitud")) {
    return {
      interpretedRole: "otra_persona",
      positionNarrativeMeaning: "representa la energia, actitud o bloqueo de la otra persona.",
    };
  }
  if (normalized.includes("trabajo") || normalized.includes("laboral") || normalized.includes("profesion")) {
    return {
      interpretedRole: "trabajo",
      positionNarrativeMeaning: "representa la situacion profesional o laboral.",
    };
  }
  if (normalized.includes("dinero") || normalized.includes("econom") || normalized.includes("finanza") || normalized.includes("ingreso")) {
    return {
      interpretedRole: "dinero",
      positionNarrativeMeaning: "representa recursos, ingresos, estabilidad o administracion material.",
    };
  }
  if (normalized.includes("bloqueo") || normalized.includes("obstac") || normalized.includes("traba") || normalized.includes("limit")) {
    return {
      interpretedRole: "bloqueo",
      positionNarrativeMeaning: "representa lo que detiene, limita o complica la situacion.",
    };
  }
  if (normalized.includes("consejo") || normalized.includes("guia") || normalized.includes("orientacion")) {
    return {
      interpretedRole: "consejo",
      positionNarrativeMeaning: "representa la orientacion practica o simbolica para avanzar.",
    };
  }
  if (normalized.includes("resultado") || normalized.includes("desenlace") || normalized.includes("final")) {
    return {
      interpretedRole: "resultado",
      positionNarrativeMeaning: "representa la direccion en la que la situacion podria resolverse si la dinamica actual se sostiene.",
    };
  }
  if (normalized.includes("miedo") || normalized.includes("temor") || normalized.includes("ansiedad")) {
    return {
      interpretedRole: "miedo",
      positionNarrativeMeaning: "representa el temor, la anticipacion negativa o la carga emocional que condiciona la lectura.",
    };
  }

  return {
    interpretedRole: "custom",
    positionNarrativeMeaning: "representa la dimension personalizada definida por el usuario.",
  };
}

function buildFreeSpreadNarrativeAxis(customPositions: FreePositionProfile["customPositions"]): string {
  const labeledPositions = customPositions.map((position) => position.positionName);
  const readableList = labeledPositions.join(", ");
  const hasAdvice = customPositions.some((position) => position.interpretedRole === "consejo");
  const roleSummary = customPositions
    .slice(0, 3)
    .map((position) => `${position.positionName} como ${position.interpretedRole}`)
    .join(", ");

  return hasAdvice
    ? `El eje de esta tirada libre conecta ${readableList}. Mentor debe explicar como interactuan estas posiciones, especialmente como ${roleSummary} conduce hacia una orientacion practica derivada de la posicion de consejo.`
    : `El eje de esta tirada libre conecta ${readableList}. Mentor debe explicar como el movimiento entre ${roleSummary} modifica la historia y que revela la interaccion entre posiciones personalizadas.`;
}

function buildThemeLockProfile(params: {
  cards: NarrativeCard[];
  keyCards: NarrativeCard[];
  dominantSuit: DominantSuit;
  dominantArcanaSignal: DominantArcanaSignal;
  dominantThemes: string[];
}): ThemeLockProfile {
  const { cards, keyCards, dominantSuit, dominantArcanaSignal, dominantThemes } = params;
  const dominantTheme = resolveDominantTheme(dominantSuit, dominantArcanaSignal);
  const mixedAxes = dominantTheme === "mixed_axis" ? resolveMixedThemeAxes(keyCards, cards, dominantThemes) : [];
  const effectiveTheme: Exclude<DominantTheme, "mixed_axis"> =
    dominantTheme === "mixed_axis"
      ? mixedAxes[0] ?? "material_construction"
      : dominantTheme;
  const thematicKeywords =
    dominantTheme === "mixed_axis"
      ? buildMixedThemeKeywords(mixedAxes)
      : [...(THEME_LOCK_KEYWORDS[dominantTheme] ?? [])];
  const thematicNarrativeSeed =
    dominantTheme === "mixed_axis"
      ? buildMixedThemeNarrativeSeed(mixedAxes)
      : THEME_LOCK_SEEDS[dominantTheme];

  return {
    dominantTheme,
    dominantSubTheme: buildDominantSubTheme(dominantTheme, effectiveTheme, keyCards, mixedAxes),
    thematicKeywords,
    thematicNarrativeSeed,
    forbiddenGenericDrift: [...FORBIDDEN_GENERIC_DRIFT],
  };
}

function resolveDominantTheme(
  dominantSuit: DominantSuit,
  dominantArcanaSignal: DominantArcanaSignal
): DominantTheme {
  if (dominantArcanaSignal === "major_dominant" || dominantSuit === "mayor") {
    return "structural_transformation";
  }
  if (dominantSuit === "tierra") return "material_construction";
  if (dominantSuit === "aire") return "mental_conflict";
  if (dominantSuit === "agua") return "emotional_bond";
  if (dominantSuit === "fuego") return "active_movement";
  return "mixed_axis";
}

function resolveMixedThemeAxes(
  keyCards: NarrativeCard[],
  allCards: NarrativeCard[],
  dominantThemes: string[]
): Array<Exclude<DominantTheme, "mixed_axis">> {
  const weightedCards = keyCards.length ? keyCards : allCards;
  const axisWeights = new Map<Exclude<DominantTheme, "mixed_axis">, number>();

  for (const card of weightedCards) {
    const axis = themeFromCard(card);
    axisWeights.set(axis, (axisWeights.get(axis) ?? 0) + themeCardWeight(card));
  }

  for (const theme of dominantThemes) {
    const axis = themeFromThemeLabel(theme);
    if (axis) {
      axisWeights.set(axis, (axisWeights.get(axis) ?? 0) + 0.35);
    }
  }

  return [...axisWeights.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([axis]) => axis)
    .slice(0, 2);
}

function buildMixedThemeKeywords(mixedAxes: Array<Exclude<DominantTheme, "mixed_axis">>): string[] {
  const [firstAxis = "material_construction", secondAxis = "mental_conflict"] = mixedAxes;
  return Array.from(
    new Set([
      ...THEME_LOCK_KEYWORDS[firstAxis].slice(0, 4),
      ...THEME_LOCK_KEYWORDS[secondAxis].slice(0, 4),
    ])
  ).slice(0, 8);
}

function buildMixedThemeNarrativeSeed(mixedAxes: Array<Exclude<DominantTheme, "mixed_axis">>): string {
  const [firstAxis = "material_construction", secondAxis = "mental_conflict"] = mixedAxes;
  const firstTheme = THEME_LOCK_KEYWORDS[firstAxis];
  const secondTheme = THEME_LOCK_KEYWORDS[secondAxis];
  return `La lectura gira alrededor de ${firstTheme[0]}, ${firstTheme[1]} y ${secondTheme[0]} junto con ${secondTheme[1]}.`;
}

function buildDominantSubTheme(
  dominantTheme: DominantTheme,
  effectiveTheme: Exclude<DominantTheme, "mixed_axis">,
  keyCards: NarrativeCard[],
  mixedAxes: Array<Exclude<DominantTheme, "mixed_axis">>
): string {
  if (dominantTheme === "mixed_axis") {
    const [firstAxis = "material_construction", secondAxis = "mental_conflict"] = mixedAxes;
    return `${describeThemePressure(firstAxis, keyCards)} combinado con ${describeThemePressure(secondAxis, keyCards)}.`;
  }

  return describeThemePressure(effectiveTheme, keyCards);
}

function describeThemePressure(
  theme: Exclude<DominantTheme, "mixed_axis">,
  keyCards: NarrativeCard[]
): string {
  const focusCard = pickThemeFocusCard(keyCards, theme);
  const role = focusCard?.role ?? "free";
  const inverted = focusCard?.orientation === "invertido";

  if (theme === "material_construction") {
    if (inverted || isPressureRole(role)) return "la estabilidad material aparece bajo presion y exige reorganizar recursos";
    return "la mesa empuja a construir recursos, trabajo y resultados sostenibles";
  }
  if (theme === "mental_conflict") {
    if (inverted || isPressureRole(role)) return "la decision central nace en tension y exige prioridad, analisis y verdad";
    return "la lectura pide estrategia, criterio y comunicacion precisa para ordenar el conflicto";
  }
  if (theme === "emotional_bond") {
    if (inverted || isPressureRole(role)) return "el vinculo dominante toca sensibilidad, duelo o necesidades afectivas no resueltas";
    return "la lectura se sostiene en afecto, intimidad e integracion emocional";
  }
  if (theme === "active_movement") {
    if (inverted || isPressureRole(role)) return "el impulso existe, pero necesita direccion para no dispersarse";
    return "la mesa abre avance, iniciativa y ejecucion concreta";
  }
  if (inverted || isPressureRole(role)) {
    return "el cambio de ciclo ya empezo y obliga a reordenar la etapa actual";
  }
  return "la lectura marca un cambio estructural con aprendizaje central";
}

function pickThemeFocusCard(
  keyCards: NarrativeCard[],
  theme: Exclude<DominantTheme, "mixed_axis">
): NarrativeCard | undefined {
  const themeCards = keyCards.filter((card) => themeFromCard(card) === theme);
  const pool = themeCards.length ? themeCards : keyCards;
  return [...pool].sort((a, b) => themeCardWeight(b) - themeCardWeight(a))[0];
}

function themeCardWeight(card: NarrativeCard): number {
  return roleNarrativeWeight(card.role) + (card.orientation === "invertido" ? 0.15 : 0);
}

function roleNarrativeWeight(role: NarrativeCardRole): number {
  if (["central", "situation", "present", "decisionA", "decisionB"].includes(role)) return 2.2;
  if (["challenge", "blockage", "risk", "outcome", "answer", "advice", "future"].includes(role)) return 1.8;
  if (["conscious", "unconscious", "resources", "opportunity", "bond", "relationshipA", "relationshipB"].includes(role)) return 1.4;
  return 1;
}

function isPressureRole(role: NarrativeCardRole): boolean {
  return ["challenge", "blockage", "risk", "fear", "hidden", "unconscious", "release"].includes(role);
}

function themeFromCard(card: NarrativeCard): Exclude<DominantTheme, "mixed_axis"> {
  const element = getCardElement(card);
  if (element === "tierra") return "material_construction";
  if (element === "aire") return "mental_conflict";
  if (element === "agua") return "emotional_bond";
  if (element === "fuego") return "active_movement";
  return "structural_transformation";
}

function themeFromThemeLabel(theme: string): Exclude<DominantTheme, "mixed_axis"> | null {
  if (["recursos", "estabilidad", "trabajo", "resultados", "seguridad"].includes(theme)) return "material_construction";
  if (["conflicto", "verdad", "decision", "tension mental", "estrategia"].includes(theme)) return "mental_conflict";
  if (["vinculos", "emociones", "reconciliacion", "duelo", "afectividad"].includes(theme)) return "emotional_bond";
  if (["accion", "impulso", "expansion", "liderazgo", "iniciativa"].includes(theme)) return "active_movement";
  if (["proceso estructural", "leccion central", "cambio profundo", "reordenamiento", "umbral de etapa"].includes(theme)) {
    return "structural_transformation";
  }
  return null;
}

function collectThemesForProfile(
  dominantSuit: DominantSuit,
  dominantArcanaSignal: DominantArcanaSignal,
  kind: "dominant" | "secondary",
  secondarySuit?: DominantSuit
): string[] {
  if (kind === "dominant") {
    if (dominantSuit === "mixto") {
      const mixedThemes = [
        ...(SUIT_THEME_BANK.aire.slice(0, 2)),
        ...(SUIT_THEME_BANK.tierra.slice(0, 2)),
      ];
      return Array.from(new Set(mixedThemes)).slice(0, 5);
    }

    const dominantThemes = [...SUIT_THEME_BANK[dominantSuit]];
    if (dominantArcanaSignal === "major_dominant" && dominantSuit !== "mayor") {
      dominantThemes.push(...SUIT_THEME_BANK.mayor.slice(0, 2));
    }
    return Array.from(new Set(dominantThemes)).slice(0, 5);
  }

  const secondaryThemePool: string[] = [];
  if (secondarySuit && secondarySuit !== "mixto" && secondarySuit !== dominantSuit) {
    secondaryThemePool.push(...SUIT_THEME_BANK[secondarySuit].slice(0, 3));
  }
  if (dominantArcanaSignal !== "minor_dominant") {
    secondaryThemePool.push(...SUIT_THEME_BANK.mayor.slice(0, 3));
  }
  if (dominantSuit !== "mixto" && dominantSuit !== "mayor") {
    secondaryThemePool.push(...SUIT_THEME_BANK[dominantSuit].slice(2, 5));
  }
  return Array.from(new Set(secondaryThemePool)).slice(0, 5);
}

export function detectNarrativeAxes(cards: NarrativeCard[], domain: ReadingDomain, spreadType: string): NarrativeAxesDetection {
  const spreadKind = getSpreadKind(spreadType, cards);
  const pairAxes = detectSpecificPairAxes(cards);
  const primaryAxis = buildSpreadAxis(cards, spreadKind, "primary", domain) ?? pairAxes[0] ?? buildFallbackAxis(cards, domain, "primary");
  const secondaryAxis =
    buildSpreadAxis(cards, spreadKind, "secondary", domain) ??
    pairAxes.find((axis) => axis.meaning !== primaryAxis.meaning) ??
    EMPTY_AXIS;
  const suits = cards.map(getCardElement);
  const dominant = getDominantValue(suits);
  const missing = (["fuego", "tierra", "agua", "aire"] as const).filter((element) => !suits.includes(element));
  const outcome = findByRole(cards, "outcome") ?? cards[cards.length - 1];
  const fear = findByRole(cards, "fear");
  const challenge = findByRole(cards, "challenge");
  const thematicProfile = buildThematicProfile(cards);

  return {
    dominantThemes: thematicProfile.dominantThemes,
    secondaryThemes: thematicProfile.secondaryThemes,
    dominantSuit: thematicProfile.dominantSuit,
    dominantArcanaSignal: thematicProfile.dominantArcanaSignal,
    narrativeTone: thematicProfile.narrativeTone,
    dominantEnergy: dominant ? dominantEnergyText(dominant, domain) : "La mesa reparte su peso entre varias energias sin un unico palo dominante.",
    missingEnergy: cards.length < 5 || missing.length === 0 ? "" : missingEnergyText(missing[0], domain),
    turningPoint: buildTurningPoint(challenge, fear, outcome),
    primaryAxis,
    secondaryAxis,
    narrativeWarnings: buildNarrativeWarnings(cards, primaryAxis, outcome, spreadType),
  };
}

function buildSpreadAxis(cards: NarrativeCard[], spreadKind: string, kind: "primary" | "secondary", domain: ReadingDomain): NarrativeAxis | null {
  const roleSequences: Record<string, { primary: NarrativeCardRole[]; secondary: NarrativeCardRole[] }> = {
    "three-cards": { primary: ["situation", "blockage", "advice"], secondary: [] },
    "five-cards": { primary: ["situation", "challenge", "outcome"], secondary: ["hidden", "advice"] },
    horseshoe: { primary: ["origin", "situation", "challenge", "outcome"], secondary: ["hidden", "environment", "advice"] },
    "celtic-cross": { primary: ["central", "challenge", "outcome"], secondary: ["conscious", "unconscious", "fear"] },
    "line-seven": { primary: ["origin", "situation", "challenge", "future", "outcome"], secondary: ["advice"] },
    "tree-of-life": { primary: ["central", "blockage", "outcome"], secondary: ["conscious", "hidden", "unconscious"] },
    decision: { primary: ["decisionA", "decisionB"], secondary: ["risk", "opportunity", "advice"] },
    relationships: { primary: ["relationshipA", "bond", "relationshipB"], secondary: ["hidden", "challenge", "outcome"] },
    "work-finance": { primary: ["situation", "resources", "opportunity"], secondary: ["blockage", "risk", "outcome"] },
    "full-moon": { primary: ["release", "hidden", "integration"], secondary: ["lesson", "advice", "outcome"] },
    pendulum: { primary: ["situation", "answer"], secondary: ["advice", "outcome"] },
    free: { primary: ["free"], secondary: [] },
  };
  const sequence = roleSequences[spreadKind]?.[kind] ?? [];
  const selected =
    spreadKind === "free" && kind === "primary"
      ? cards
      : sequence.flatMap((role) => cards.filter((card) => card.role === role));

  if (selected.length === 0) return null;

  return {
    cards: selected.map(cardLabel),
    meaning: buildAxisMeaning(selected, spreadKind, kind),
    why: `Eje ${kind === "primary" ? "principal" : "secundario"} de ${spreadLabel(spreadKind)} construido desde roles narrativos reales.`,
  };
}

function buildAxisMeaning(cards: NarrativeCard[], spreadKind: string, kind: "primary" | "secondary"): string {
  if (spreadKind === "free") {
    return `La tirada libre avanza en este orden: ${cards.map((card) => `${card.positionName}: ${cardEssence(card)}`).join("; ")}.`;
  }
  if (spreadKind === "three-cards") {
    return cards.map((card) => `${card.positionName}: ${cardEssence(card)}`).join(" -> ");
  }
  if (spreadKind === "decision" && kind === "primary" && cards.length >= 2) {
    return `La decision compara ${cards[0].positionName}: ${cardEssence(cards[0])} frente a ${cards[1].positionName}: ${cardEssence(cards[1])}.`;
  }
  if (spreadKind === "relationships" && kind === "primary") {
    return `El vinculo se lee entre ${cards.map((card) => `${card.positionName}: ${cardEssence(card)}`).join("; ")}.`;
  }
  return `El eje ${kind === "primary" ? "principal" : "secundario"} conecta ${cards.map((card) => `${card.positionName}: ${cardEssence(card)}`).join("; ")}.`;
}

function spreadLabel(spreadKind: string): string {
  const labels: Record<string, string> = {
    "three-cards": "3 cartas",
    "five-cards": "5 cartas",
    horseshoe: "Herradura",
    "celtic-cross": "Cruz Celta",
    "line-seven": "Linea de 7 cartas",
    "tree-of-life": "Arbol de la Vida",
    decision: "Decision",
    relationships: "Relaciones",
    "work-finance": "Trabajo y Finanzas",
    "full-moon": "Luna Llena",
    pendulum: "Pendulo",
    free: "tirada libre",
  };
  return labels[spreadKind] ?? "tirada";
}

export function detectStorySpine(
  cards: NarrativeCard[],
  axes: NarrativeAxesDetection,
  domain: ReadingDomain,
  spreadType = "generic"
): NarrativeStorySpine {
  return buildUniversalStorySpine(cards, axes, domain, spreadType);
}

export function buildUniversalStorySpine(
  cards: NarrativeCard[],
  axes: NarrativeAxesDetection,
  domain: ReadingDomain,
  spreadType = "generic"
): NarrativeStorySpine {
  const spreadKind = getSpreadKind(spreadType, cards);
  const origin = findFirstByRoles(cards, ["origin", "past"]);
  const situation = findFirstByRoles(cards, ["situation", "central", "present"]) ?? cards[0];
  const future = findFirstByRoles(cards, ["future", "opportunity"]);
  const blockage = findFirstByRoles(cards, ["blockage", "challenge", "risk", "hidden"]);
  const advice = findFirstByRoles(cards, ["advice", "integration", "lesson", "action"]);
  const conscious = findByRole(cards, "conscious");
  const unconscious = findByRole(cards, "unconscious");
  const selfView = findByRole(cards, "selfView");
  const environment = findFirstByRoles(cards, ["environment", "external"]);
  const fear = findByRole(cards, "fear");
  const outcome = findFirstByRoles(cards, ["outcome", "answer", "future"]) ?? cards[cards.length - 1];
  const integrationCards = (spreadKind === "three-cards" ? [advice] : [advice, conscious, unconscious, blockage]).filter(
    (card): card is NarrativeCard => Boolean(card)
  );

  return {
    currentState: buildCurrentState(origin, situation, domain),
    whatWantsToEmerge: buildEmergingState(future, environment, axes.primaryAxis),
    whatBlocksIt: buildBlockage(blockage, fear, outcome, axes.primaryAxis, spreadKind),
    whatMustBeIntegrated: buildIntegration(integrationCards, selfView, axes.secondaryAxis),
    likelyEvolution: buildEvolution(outcome, axes.primaryAxis, axes.secondaryAxis),
  };
}

function buildCoreTheme(storySpine: NarrativeStorySpine, axes: NarrativeAxesDetection): string {
  return `${storySpine.currentState} ${axes.primaryAxis.meaning}`;
}

function buildMainConflict(axes: NarrativeAxesDetection, central?: NarrativeCard, challenge?: NarrativeCard): string {
  if (axes.primaryAxis.meaning) return axes.primaryAxis.meaning;
  if (central && challenge && areComplementary(central, challenge)) {
    return `El reto no contradice la situacion actual; la vuelve mas exigente: ${shortFunction(central)} necesita sostenerse junto a ${shortFunction(challenge)}.`;
  }
  if (!central || !challenge) return axes.primaryAxis.meaning;
  return cleanFallbackSentence(
    `El conflicto se concentra entre ${shortFunction(central)} y ${shortFunction(challenge)}: ${domainSentence(central)} frente a ${domainSentence(challenge)}.`
  );
}

function buildMainContradiction(
  axes: NarrativeAxesDetection,
  central?: NarrativeCard,
  challenge?: NarrativeCard,
  conscious?: NarrativeCard,
  unconscious?: NarrativeCard
): string {
  if (axes.secondaryAxis.meaning) return axes.secondaryAxis.meaning;
  if (conscious && unconscious) {
    return `La contradiccion interna aparece entre ${shortFunction(conscious)} y ${shortFunction(unconscious)}: una parte intenta dirigir la lectura desde arriba y otra sostiene el pulso de fondo.`;
  }
  if (central && challenge && areComplementary(central, challenge)) {
    return `No hay choque duro entre centro y reto; hay una exigencia de combinar ${domainSentence(central)} con ${domainSentence(challenge)}.`;
  }
  if (!central || !challenge) return axes.primaryAxis.meaning || axes.secondaryAxis.meaning;
  return cleanFallbackSentence(`${shortFunction(challenge)} cambia la forma en que ${shortFunction(central)} puede expresarse.`);
}

function buildMainRisk(
  axes: NarrativeAxesDetection,
  storySpine: NarrativeStorySpine,
  challenge?: NarrativeCard,
  fear?: NarrativeCard,
  outcome?: NarrativeCard
): string {
  if (axes.narrativeWarnings[0]) return axes.narrativeWarnings[0];
  return cleanFallbackSentence(`${storySpine.whatBlocksIt} ${riskFromCards(challenge, fear, outcome)}`);
}

function buildMainOpportunity(
  axes: NarrativeAxesDetection,
  storySpine: NarrativeStorySpine,
  future?: NarrativeCard,
  conscious?: NarrativeCard,
  unconscious?: NarrativeCard
): string {
  if (axes.primaryAxis.why.includes("constructivo") || axes.secondaryAxis.why.includes("constructivo")) {
    return cleanFallbackSentence(`${storySpine.whatWantsToEmerge} ${storySpine.whatMustBeIntegrated}`);
  }
  const opportunityCard = future ?? conscious ?? unconscious;
  return cleanFallbackSentence(`${storySpine.whatWantsToEmerge} ${opportunityFromCard(opportunityCard)}`);
}

function buildLikelyOutcome(storySpine: NarrativeStorySpine, outcome?: NarrativeCard): string {
  if (!outcome) return storySpine.likelyEvolution;
  return cleanFallbackSentence(storySpine.likelyEvolution);
}

type PairAxisRule = {
  cards: Array<{ name: string; orientation?: "derecho" | "invertido" }>;
  meaning: string;
  why: string;
  warning?: string;
};

const EMPTY_AXIS: NarrativeAxis = {
  cards: [],
  meaning: "",
  why: "",
};

const DECISION_POSITIVE_TERMS = [
  "avance",
  "apertura",
  "claridad",
  "construccion",
  "crecimiento",
  "estabilidad",
  "expansion",
  "integracion",
  "madurez",
  "metodo",
  "oportunidad",
  "orden",
  "reconocimiento",
  "recurso",
  "recuperacion",
  "solucion",
  "sostenible",
];

const DECISION_NEGATIVE_TERMS = [
  "apego",
  "bloque",
  "carencia",
  "confusion",
  "control",
  "decepcion",
  "demora",
  "dependencia",
  "desgaste",
  "desorden",
  "dificultad",
  "dolor",
  "error",
  "perdida",
  "rechazo",
  "rigidez",
  "riesgo",
  "sabot",
  "tension",
];

const DECISION_CARD_WEIGHTS: Record<string, number> = {
  sol: 2.2,
  mundo: 2.1,
  estrella: 1.8,
  mago: 1.5,
  emperatriz: 1.6,
  emperador: 1.6,
  fuerza: 1.5,
  templanza: 1.6,
  carro: 1.4,
  justicia: 1.2,
  juicio: 1.4,
  "as de oros": 1.7,
  "diez de oros": 1.9,
  "nueve de oros": 1.7,
  "ocho de oros": 1.3,
  "tres de oros": 1.4,
  "seis de bastos": 1.5,
  "dos de copas": 1.4,
  "diez de copas": 1.7,
  "el diablo": -2.1,
  diablo: -2.1,
  torre: -2,
  "la torre": -2,
  luna: -1.2,
  "la luna": -1.2,
  "cinco de oros": -2,
  "siete de espadas": -1.8,
  "diez de espadas": -2.1,
  "tres de espadas": -1.8,
  "ocho de espadas": -1.6,
  "cinco de copas": -1.5,
  "cinco de bastos": -1.2,
};

const PAIR_AXIS_RULES: PairAxisRule[] = [
  {
    cards: [{ name: "Tres de Oros" }, { name: "As de Bastos" }],
    meaning:
      "La mesa une construccion colaborativa con un nuevo fuego de proposito: algo quiere pasar de habilidad compartida a accion viva.",
    why: "Eje constructivo detectado entre metodo, colaboracion y nacimiento de impulso.",
  },
  {
    cards: [{ name: "Reina de Copas" }, { name: "Emperatriz" }],
    meaning:
      "La intuicion madura y el crecimiento fertil se refuerzan; la expansion necesita receptividad, cuidado interno y lectura emocional fina.",
    why: "Eje constructivo detectado entre nutricion emocional y fertilidad creativa.",
  },
  {
    cards: [{ name: "Fuerza" }, { name: "El Diablo", orientation: "invertido" }],
    meaning:
      "El autodominio compasivo aparece frente a la liberacion de apegos, impulsos o dependencias que ya no deben dirigir la lectura.",
    why: "Eje de tension real entre dominio interno y salida de cadenas.",
  },
  {
    cards: [{ name: "Emperatriz" }, { name: "Rey de Oros", orientation: "invertido" }],
    meaning:
      "El crecimiento organico choca con el riesgo de controlar demasiado el resultado, rigidizar lo material o medir la fertilidad solo por logros visibles.",
    why: "Eje de tension real entre expansion fertil y control material.",
    warning:
      "El riesgo es que una energia fertil termine encerrada en control, apariencia o necesidad de asegurar resultados antes de que el proceso madure.",
  },
  {
    cards: [{ name: "El Diablo", orientation: "invertido" }, { name: "Rey de Oros", orientation: "invertido" }],
    meaning:
      "Hay liberacion de cadenas, pero tambien riesgo de reemplazar una dependencia por control, rigidez o apego al resultado.",
    why: "Eje de riesgo detectado entre liberacion de apegos y control material invertido.",
    warning:
      "El riesgo es liberarte de una cadena y sustituirla por otra forma de control: exigencia, rigidez material o necesidad de validacion externa.",
  },
  {
    cards: [{ name: "Siete de Bastos" }, { name: "Sota de Espadas", orientation: "invertido" }],
    meaning:
      "La defensa de una posicion ganada puede perder fuerza si la mente se dispersa o responde de forma reactiva.",
    why: "Eje de tension real entre postura firme y reaccion verbal o mental.",
    warning: "El riesgo es defender algo valido con una respuesta dispersa, impulsiva o mal enfocada.",
  },
  {
    cards: [{ name: "El Mago" }, { name: "As de Bastos", orientation: "invertido" }],
    meaning:
      "Hay voluntad consciente, pero el fuego inicial no termina de encenderse; la capacidad existe, el impulso todavia necesita direccion.",
    why: "Eje de tension real entre voluntad disponible y energia creativa bloqueada.",
  },
  {
    cards: [{ name: "As de Oros", orientation: "invertido" }, { name: "Diez de Oros" }],
    meaning:
      "Una oportunidad mal aterrizada se mide contra el deseo de estabilidad; la mesa pide concretar antes de prometer permanencia.",
    why: "Eje de tension real entre semilla material bloqueada y estabilidad de largo plazo.",
  },
  {
    cards: [{ name: "Tres de Oros" }, { name: "Reina de Copas" }],
    meaning:
      "El reto no contradice la situacion actual; la vuelve mas exigente: construir con metodo sin desconectarse de la intuicion emocional.",
    why: "Eje complementario detectado entre trabajo metodico y sensibilidad madura.",
  },
];

const CARD_NARRATIVE_ESSENCES: Record<string, Partial<Record<"derecho" | "invertido", string>>> = {
  "as de oros": {
    derecho: "oportunidad tangible, semilla concreta y recurso que puede crecer si se aterriza con metodo",
    invertido: "oportunidad mal aterrizada, recurso desaprovechado o semilla material sin estructura",
  },
  "sota de oros": {
    derecho: "aprendizaje practico, estudio paciente y una base que se construye con hechos",
    invertido: "aprendizaje disperso, falta de constancia o dificultad para aterrizar lo aprendido",
  },
  "tres de oros": {
    derecho: "construccion colaborativa, metodo y reconocimiento de habilidades",
    invertido: "desorden de equipo, falta de metodo o talento que no encuentra coordinacion",
  },
  "as de bastos": {
    derecho: "nuevo fuego de proposito, impulso vivo y energia que quiere convertirse en accion",
    invertido: "fuego interno bloqueado, impulso inmaduro o deseo sin direccion",
  },
  "reina de copas": {
    derecho: "intuicion madura, sensibilidad receptiva y lectura emocional fina",
    invertido: "sensibilidad saturada, confusion emocional o cuidado que pierde centro",
  },
  emperatriz: {
    derecho: "crecimiento fertil, nutricion interna y expansion organica",
    invertido: "fertilidad bloqueada, dependencia o crecimiento que se vuelve exceso",
  },
  fuerza: {
    derecho: "dominio compasivo, autocontrol sereno y fuerza interior bien dirigida",
    invertido: "fuerza dispersa, reaccion instintiva o dificultad para sostener autocontrol",
  },
  "nueve de copas": {
    derecho: "satisfaccion personal, deseo cumplido y confianza en lo que se quiere",
    invertido: "satisfaccion incompleta, deseo inflado o busqueda de validacion",
  },
  "ocho de copas": {
    derecho: "retiro de algo insuficiente para buscar un sentido mas honesto",
    invertido: "dificultad para irse de una situacion que ya no alimenta el proceso",
  },
  "seis de bastos": {
    derecho: "reconocimiento visible, avance publico y senales externas de logro",
    invertido: "reconocimiento inestable, exposicion incomoda o victoria que no se sostiene",
  },
  "el diablo": {
    derecho: "apego, dependencia, deseo que ata o patron que domina",
    invertido: "liberacion de apegos, ruptura de dependencias y salida de cadenas",
  },
  "rey de oros": {
    derecho: "estabilidad material, dominio de recursos y autoridad concreta",
    invertido: "control, rigidez material, apego al resultado o autoridad desconectada del proposito",
  },
  mundo: {
    derecho: "cierre de ciclo, integracion de aprendizaje y ordenamiento del proceso completo",
    invertido: "ciclo inconcluso, integracion pendiente o resultado que aun no termina de cerrarse",
  },
};

function detectSpecificPairAxes(cards: NarrativeCard[]): NarrativeAxis[] {
  return PAIR_AXIS_RULES.filter((rule) => rule.cards.every((cardRule) => hasMatchingCard(cards, cardRule))).map((rule) => ({
    cards: rule.cards.map((cardRule) => formatRuleCard(cards, cardRule)),
    meaning: rule.meaning,
    why: rule.why,
  }));
}

function detectStructuralAxes(cards: NarrativeCard[], domain: ReadingDomain): NarrativeAxis[] {
  const central = findByRole(cards, "central") ?? cards[0];
  const challenge = findByRole(cards, "challenge");
  const conscious = findByRole(cards, "conscious");
  const unconscious = findByRole(cards, "unconscious");
  const fear = findByRole(cards, "fear");
  const outcome = findByRole(cards, "outcome") ?? cards[cards.length - 1];
  const axes: NarrativeAxis[] = [];

  if (central && challenge) {
    axes.push(buildRoleAxis(central, challenge, domain, "central-challenge"));
  }
  if (conscious && unconscious) {
    axes.push(buildRoleAxis(conscious, unconscious, domain, "conscious-unconscious"));
  }
  if (fear && outcome) {
    axes.push(buildRoleAxis(fear, outcome, domain, "fear-outcome"));
  }

  return axes.filter((axis) => axis.meaning);
}

function buildRoleAxis(
  first: NarrativeCard,
  second: NarrativeCard,
  domain: ReadingDomain,
  axisType: "central-challenge" | "conscious-unconscious" | "fear-outcome"
): NarrativeAxis {
  const complementary = areComplementary(first, second);
  const firstEssence = cardEssence(first);
  const secondEssence = cardEssence(second);
  const cards = [cardLabel(first), cardLabel(second)];

  if (axisType === "central-challenge" && complementary) {
    return {
      cards,
      meaning: `El reto no contradice la situacion actual; la vuelve mas exigente: ${firstEssence} necesita sostenerse junto a ${secondEssence}.`,
      why: `Eje complementario ${domain}: centro y reto apuntan a combinar fuerzas, no a cancelar una de ellas.`,
    };
  }

  if (axisType === "conscious-unconscious") {
    return {
      cards,
      meaning: `La mente declarada se mueve desde ${firstEssence}, mientras el fondo de la tirada sostiene ${secondEssence}.`,
      why: `Eje interno ${domain}: muestra como se reparte la lectura entre intencion consciente y base profunda.`,
    };
  }

  if (axisType === "fear-outcome") {
    return {
      cards,
      meaning: `${first.cardName} en dudas y temores condiciona el resultado de ${second.cardName}: ${firstEssence} puede deformar o retrasar ${secondEssence}.`,
      why: `Eje de desenlace ${domain}: temor y resultado deben leerse juntos.`,
    };
  }

  return {
    cards,
    meaning: `La tension principal aparece entre ${firstEssence} y ${secondEssence}.`,
    why: `Eje estructural ${domain} detectado por roles de la tirada.`,
  };
}

function buildFallbackAxis(cards: NarrativeCard[], domain: ReadingDomain, kind: "primary" | "secondary"): NarrativeAxis {
  const central = findFirstByRoles(cards, ["situation", "central", "present"]) ?? cards[0];
  const outcome = findFirstByRoles(cards, ["outcome", "answer", "future"]) ?? cards[cards.length - 1];
  const challenge = findFirstByRoles(cards, ["blockage", "challenge", "risk", "hidden"]);
  const selected =
    kind === "primary"
      ? [central, challenge ?? outcome]
      : [findFirstByRoles(cards, ["advice", "integration", "conscious"]), findFirstByRoles(cards, ["unconscious", "hidden"])];
  const axisCards = selected.filter((card): card is NarrativeCard => Boolean(card));
  const [first, second] = axisCards;

  if (axisCards.length === 0 || (kind === "secondary" && axisCards.length < 2)) return EMPTY_AXIS;

  return {
    cards: axisCards.map(cardLabel),
    meaning: second
      ? `El eje ${kind === "primary" ? "principal" : "secundario"} conecta ${first.positionName}: ${cardEssence(first)} con ${second.positionName}: ${cardEssence(second)}.`
      : `${first.positionName}: ${cardEssence(first)}.`,
    why: `Eje de apoyo ${domain} construido desde roles disponibles.`,
  };
}

function buildCurrentState(past: NarrativeCard | undefined, central: NarrativeCard | undefined, domain: ReadingDomain): string {
  if (past && central) {
    return `Vienes de ${cardEssence(past)} y ahora la situacion se concentra en ${cardEssence(central)}.`;
  }
  if (central) {
    return `El estado actual se concentra en ${cardEssence(central)}.`;
  }
  return `La tirada plantea una lectura de ${domain} desde las posiciones definidas.`;
}

function buildEmergingState(future: NarrativeCard | undefined, environment: NarrativeCard | undefined, primaryAxis: NarrativeAxis): string {
  if (future && environment) {
    return `${future.cardName} muestra ${cardEssence(future)}; desde el entorno, ${environment.cardName} agrega ${cardEssence(environment)}.`;
  }
  if (future) {
    return `${future.cardName} muestra ${cardEssence(future)}.`;
  }
  return primaryAxis.meaning || "La evolucion se lee desde el orden de las posiciones disponibles.";
}

function buildBlockage(
  challenge: NarrativeCard | undefined,
  fear: NarrativeCard | undefined,
  outcome: NarrativeCard | undefined,
  primaryAxis: NarrativeAxis,
  spreadKind: string
): string {
  if (spreadKind === "three-cards" && challenge?.role === "blockage" && challenge.orientation === "derecho") {
    return `El bloqueo aparece cuando ${cardEssence(challenge)} no se permite, no se integra o queda sin estructura concreta.`;
  }
  const devilKingAxis = primaryAxis.meaning.includes("reemplazar una dependencia por control");
  if (devilKingAxis) return primaryAxis.meaning;
  if (fear && outcome) {
    return `El bloqueo no esta solo en ${cardEssence(fear)}; se agrava si el desenlace cae en ${cardEssence(outcome)}.`;
  }
  if (challenge) {
    return `El bloqueo aparece cuando ${cardEssence(challenge)} se vuelve una exigencia dificil de integrar.`;
  }
  return outcome ? `El punto delicado se concentra en ${cardEssence(outcome)}.` : "";
}

function buildIntegration(cards: NarrativeCard[], selfView: NarrativeCard | undefined, secondaryAxis: NarrativeAxis): string {
  const essences = cards.map(cardEssence).filter(Boolean);
  if (essences.length >= 2) {
    return `La tirada pide integrar ${joinNatural(essences)}.`;
  }
  if (essences.length === 1) {
    return `La tirada pide integrar ${essences[0]}.`;
  }
  if (selfView) {
    return `La forma en que te colocas ante el tema muestra ${cardEssence(selfView)}.`;
  }
  return secondaryAxis.meaning || "";
}

function buildEvolution(outcome: NarrativeCard | undefined, primaryAxis: NarrativeAxis, secondaryAxis: NarrativeAxis): string {
  if (!outcome) {
    return `${primaryAxis.meaning} ${secondaryAxis.meaning}`;
  }
  const outcomeEssence = cardEssence(outcome);
  if (outcome.orientation === "invertido") {
    return `${outcome.cardName} invertido no niega el avance, pero advierte que el desenlace pierde fuerza si deriva en ${outcomeEssence}.`;
  }
  return `${outcome.cardName} como resultado abre una posibilidad condicionada: ${outcomeEssence}.`;
}

function buildTurningPoint(challenge?: NarrativeCard, fear?: NarrativeCard, outcome?: NarrativeCard): string {
  if (fear && outcome) {
    return `El giro de la lectura ocurre al pasar de ${cardEssence(fear)} hacia ${cardEssence(outcome)} sin repetir el mismo patron.`;
  }
  if (challenge && outcome) {
    return `El punto de giro esta entre ${cardEssence(challenge)} y ${cardEssence(outcome)}.`;
  }
  return outcome ? `El punto de giro se concentra en ${cardEssence(outcome)}.` : "El punto de giro queda repartido entre las cartas dominantes.";
}

function buildNarrativeWarnings(cards: NarrativeCard[], primaryAxis: NarrativeAxis, outcome?: NarrativeCard, spreadType?: string): string[] {
  const pairWarnings = PAIR_AXIS_RULES.filter((rule) => rule.warning && rule.cards.every((cardRule) => hasMatchingCard(cards, cardRule))).map((rule) => rule.warning as string);
  const warnings = [...pairWarnings];

  if (outcome?.orientation === "invertido") {
    warnings.push(`${outcome.cardName} invertido como resultado advierte que la evolucion puede perder fuerza si se expresa como ${cardEssence(outcome)}.`);
  }
  if (primaryAxis.why.includes("riesgo") && primaryAxis.meaning) {
    warnings.push(primaryAxis.meaning);
  }

  return Array.from(new Set(warnings)).map((warning) => sanitizeNarrativeText(`${warning}${spreadType ? ` (${spreadType})` : ""}`, 500));
}

function riskFromCards(challenge?: NarrativeCard, fear?: NarrativeCard, outcome?: NarrativeCard): string {
  const source = fear ?? challenge ?? outcome;
  return source ? `El punto delicado nace de ${cardEssence(source)}.` : "";
}

function opportunityFromCard(card?: NarrativeCard): string {
  return card ? `La oportunidad aparece al encarnar ${cardEssence(card)}.` : "";
}

function hasMatchingCard(cards: NarrativeCard[], cardRule: PairAxisRule["cards"][number]): boolean {
  return cards.some((card) => canonicalCardName(card.cardName) === canonicalCardName(cardRule.name) && (!cardRule.orientation || card.orientation === cardRule.orientation));
}

function formatRuleCard(cards: NarrativeCard[], cardRule: PairAxisRule["cards"][number]): string {
  const match = cards.find((card) => canonicalCardName(card.cardName) === canonicalCardName(cardRule.name) && (!cardRule.orientation || card.orientation === cardRule.orientation));
  return match ? cardLabel(match) : `${cardRule.name}${cardRule.orientation ? ` ${cardRule.orientation}` : ""}`;
}

function areComplementary(first?: NarrativeCard, second?: NarrativeCard): boolean {
  if (!first || !second) return false;
  const pair = [canonicalCardName(first.cardName), canonicalCardName(second.cardName)].sort().join("|");
  const complementaryPairs = new Set(["reina de copas|tres de oros", "emperatriz|reina de copas", "as de bastos|tres de oros"]);
  if (complementaryPairs.has(pair)) return true;
  return first.orientation === "derecho" && second.orientation === "derecho" && getCardElement(first) !== getCardElement(second);
}

function cardEssence(card?: NarrativeCard): string {
  if (!card) return "";
  const specific = CARD_NARRATIVE_ESSENCES[normalize(card.cardName)]?.[card.orientation] ?? CARD_NARRATIVE_ESSENCES[canonicalCardName(card.cardName)]?.[card.orientation];
  if (specific) return specific;
  return shortenSentence(card.domainMeaning, 155);
}

function domainSentence(card?: NarrativeCard): string {
  return card ? shortenSentence(card.domainMeaning, 140) : "una energia no disponible";
}

function cardLabel(card: NarrativeCard): string {
  return `${card.positionNumber}. ${card.cardName} ${card.orientation}`;
}

function getCardElement(card: NarrativeCard): "fuego" | "tierra" | "agua" | "aire" | "mayor" {
  const normalized = normalize(card.cardName);
  if (normalized.includes("bastos")) return "fuego";
  if (normalized.includes("oros") || normalized.includes("pentac")) return "tierra";
  if (normalized.includes("copas")) return "agua";
  if (normalized.includes("espadas")) return "aire";
  return "mayor";
}

function getDominantValue<T extends string>(values: T[]): T | null {
  const counts = new Map<T, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function dominantEnergyText(energy: string, domain: ReadingDomain): string {
  const meanings: Record<string, string> = {
    fuego: "Predomina el fuego: hay voluntad, impulso y necesidad de convertir la lectura en movimiento visible.",
    tierra: "Predomina la tierra: el proceso pide hechos, metodo, recursos y resultados verificables.",
    agua: "Predomina el agua: la lectura pasa por sensibilidad, vinculo, percepcion interna y madurez emocional.",
    aire: "Predomina el aire: el centro esta en decisiones, palabras, analisis y claridad mental.",
    mayor: "Predominan Arcanos Mayores: esta etapa toca una estructura profunda del proceso, no solo un ajuste menor.",
  };
  return meanings[energy] ?? meanings.mayor;
}

function missingEnergyText(energy: string, domain: ReadingDomain): string {
  const meanings: Record<string, string> = {
    fuego: "Hace falta una energia mas activa y definida para convertir la lectura en movimiento visible.",
    tierra: "Hace falta mas aterrizaje concreto: metodo, cuerpo, recursos y pasos verificables.",
    agua: "Hace falta mas escucha emocional y receptividad para que la lectura no se vuelva solo ejecucion.",
    aire: "Hace falta mas claridad mental: nombrar, ordenar y decidir con distancia antes de actuar.",
  };
  return meanings[energy] ?? `Hace falta una energia complementaria para equilibrar la lectura de ${domain}.`;
}

function joinNatural(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} y ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

function shortenSentence(value: string, maxLength: number): string {
  const cleanValue = sanitizeNarrativeText(value, maxLength);
  return cleanValue.endsWith(".") ? cleanValue.slice(0, -1) : cleanValue;
}

function cleanFallbackSentence(value: string): string {
  return sanitizeNarrativeText(value, 900);
}

function getOfficialDomainMeaning(
  card: CartaPosicionada,
  orientation: "derecho" | "invertido",
  domain: ReadingDomain
): string {
  const officialCard = findOfficialCard(card.cardName);
  if (!officialCard) {
    return "";
  }

  const jsonDomain = getJsonDomain(domain);
  const scoped = officialCard.ambitos?.[jsonDomain]?.[orientation] ?? officialCard.ambitos?.[jsonDomain]?.derecho;
  const parts = [scoped?.titulo, scoped?.general, scoped?.detalle].filter(Boolean);
  const scopedMeaning = sanitizeNarrativeText(parts.join(". "), 900);
  if (scopedMeaning) {
    return scopedMeaning;
  }

  return sanitizeNarrativeText(officialCard.resumen?.[orientation] ?? officialCard.resumen?.mensaje_clave, 700);
}

function findOfficialCard(cardName: string): JsonTarotCard | null {
  const normalizedName = normalize(cardName);
  const normalizedSlug = slugify(cardName);

  return (
    ALL_JSON_CARDS.find((card) => {
      const id = normalize(card.id ?? "");
      const idSlug = slugify(card.id ?? "");
      const name = normalize(card.nombre ?? "");
      const nameSlug = slugify(card.nombre ?? "");

      return id === normalizedName || idSlug === normalizedSlug || name === normalizedName || nameSlug === normalizedSlug;
    }) ?? null
  );
}

function getJsonDomain(domain: ReadingDomain): string {
  const domainMap: Record<ReadingDomain, string> = {
    amor: "amor",
    trabajo: "trabajo",
    dinero: "dinero",
    salud: "salud",
    espiritualidad: "espiritual",
    familia: "amor",
    decision: "espiritual",
    proyecto: "trabajo",
    viaje: "viajes",
    general: "espiritual",
  };
  return domainMap[domain];
}

const DOMAIN_CARD_MEANINGS: Record<string, Partial<Record<ReadingDomain, string>>> = {
  "tres de espadas": {
    amor: "dolor afectivo, distancia o ruptura que obliga a mirar una verdad del vinculo",
    trabajo: "decepcion profesional, rechazo o verdad incomoda dentro de la empresa",
    dinero: "perdida financiera, error de calculo o negocio que no cumple lo esperado",
    espiritualidad: "caida de una ilusion o verdad que rompe una fantasia",
  },
  "3 de espadas": {
    amor: "dolor afectivo, distancia o ruptura que obliga a mirar una verdad del vinculo",
    trabajo: "decepcion profesional, rechazo o verdad incomoda dentro de la empresa",
    dinero: "perdida financiera, error de calculo o negocio que no cumple lo esperado",
    espiritualidad: "caida de una ilusion o verdad que rompe una fantasia",
  },
  "siete de bastos": {
    trabajo: "defensa de una posicion profesional frente a presion o competencia",
    amor: "defensa emocional dentro de una tension que ya cansa",
    dinero: "proteccion de recursos o estrategia ante presion externa",
  },
};

const roleLabels: Record<NarrativeCardRole, string> = {
  origin: "origen de la dinamica",
  situation: "situacion actual",
  central: "centro de la situacion",
  blockage: "bloqueo principal",
  challenge: "reto que presiona la lectura",
  advice: "consejo o guia de avance",
  outcome: "resultado probable",
  conscious: "mente declarada",
  unconscious: "base interna no del todo visible",
  past: "origen de la dinamica",
  present: "presente de la lectura",
  future: "direccion emergente",
  environment: "presion del entorno",
  fear: "temor o duda principal",
  opportunity: "oportunidad disponible",
  risk: "riesgo principal",
  relationshipA: "energia de la primera parte del vinculo",
  relationshipB: "energia de la segunda parte del vinculo",
  bond: "estado del vinculo",
  decisionA: "opcion A",
  decisionB: "opcion B",
  release: "lo que debe soltarse",
  integration: "lo que debe integrarse",
  hidden: "factor oculto",
  external: "factor externo",
  resources: "recursos disponibles",
  answer: "respuesta directa",
  lesson: "aprendizaje de la lectura",
  action: "accion a encarnar",
  support: "apoyo de contexto",
  selfView: "forma en que el consultante se coloca ante el tema",
  free: "posicion definida por el usuario",
};

function adaptBaseMeaningToDomain(base: string, domain: ReadingDomain, orientation: "derecho" | "invertido"): string {
  const trimmed = sanitizeNarrativeText(base, 700);
  return sanitizeNarrativeText(withOrientation(`${domainLead(domain)}: ${trimmed}`, orientation, domain), 900);
}

function getSuitDomainMeaning(cardName: string, domain: ReadingDomain): string {
  const normalized = normalize(cardName);
  if (normalized.includes("espadas")) return suitTranslations.espadas[domain];
  if (normalized.includes("copas")) return suitTranslations.copas[domain];
  if (normalized.includes("oros") || normalized.includes("pentac")) return suitTranslations.oros[domain];
  if (normalized.includes("bastos")) return suitTranslations.bastos[domain];
  return domainFallbacks[domain];
}

const suitTranslations: Record<string, Record<ReadingDomain, string>> = {
  espadas: {
    amor: "decision dificil, distancia mental o verdad que afecta el vinculo",
    trabajo: "criterio, tension mental, estrategia o decision dentro del entorno profesional",
    dinero: "calculo, riesgo por decision apresurada o lectura fria de recursos",
    salud: "sobrecarga mental que impacta el cuerpo",
    espiritualidad: "verdad incomoda que corta una ilusion",
    familia: "palabras, decisiones o tensiones no resueltas en la dinamica familiar",
    decision: "necesidad de elegir con lucidez y asumir consecuencia",
    proyecto: "analisis, estrategia y riesgo de bloqueo mental",
    viaje: "planificacion, papeles, demora o decision logistica",
    general: "tension mental, decision o verdad que exige claridad",
  },
  copas: {
    amor: "movimiento afectivo, deseo, distancia o reciprocidad emocional",
    trabajo: "clima emocional que influye en reconocimiento y trato profesional",
    dinero: "decision financiera influida por apego, deseo o expectativa",
    salud: "estado emocional que impacta cuidado y recuperacion",
    espiritualidad: "aprendizaje emocional y sensibilidad interna",
    familia: "afecto, lealtad o necesidad de contencion",
    decision: "eleccion atravesada por apego o necesidad afectiva",
    proyecto: "motivacion, relacion con publico o conexion con socios",
    viaje: "deseo de movimiento, nostalgia o busqueda emocional",
    general: "movimiento emocional que colorea la situacion",
  },
  oros: {
    amor: "estabilidad, convivencia, compromiso concreto o valor compartido",
    trabajo: "resultado tangible, recursos, merito visible o estabilidad profesional",
    dinero: "recursos, inversion, perdida, estabilidad o gestion material",
    salud: "cuerpo, habito, rutina y recuperacion concreta",
    espiritualidad: "integracion practica del aprendizaje",
    familia: "responsabilidades materiales o sostén cotidiano",
    decision: "costo concreto, seguridad y consecuencia material",
    proyecto: "recursos, viabilidad y ejecucion sostenible",
    viaje: "presupuesto, logistica y condiciones materiales del traslado",
    general: "base material, estabilidad o resultado concreto",
  },
  bastos: {
    amor: "deseo, impulso, friccion o energia que mueve el vinculo",
    trabajo: "iniciativa, competencia, presion y liderazgo profesional",
    dinero: "impulso de negocio, riesgo operativo o accion material",
    salud: "energia fisica, desgaste o necesidad de regular impulso",
    espiritualidad: "voluntad, busqueda y direccion vital",
    familia: "choque de voluntades o necesidad de accion",
    decision: "impulso de avanzar y riesgo de precipitarse",
    proyecto: "ejecucion, lanzamiento, competencia y expansion",
    viaje: "movimiento, aventura, impulso y posible demora por precipitacion",
    general: "accion, deseo, presion o impulso de cambio",
  },
};

const domainFallbacks: Record<ReadingDomain, string> = {
  amor: "dinamica afectiva traducida a vinculo, deseo y compromiso",
  trabajo: "dinamica profesional traducida a poder, merito y visibilidad",
  dinero: "dinamica material traducida a recursos, riesgo y estabilidad",
  salud: "dinamica corporal traducida a desgaste, limites y recuperacion",
  espiritualidad: "dinamica interna traducida a sentido, aprendizaje e integracion",
  familia: "dinamica familiar traducida a roles, limites y responsabilidades",
  decision: "dinamica de eleccion traducida a costo, renuncia y consecuencia",
  proyecto: "dinamica de proyecto traducida a viabilidad, ejecucion y sostenibilidad",
  viaje: "dinamica de movimiento traducida a logistica, distancia y adaptacion",
  general: "dinamica concreta de la situacion consultada",
};

function withOrientation(value: string, orientation: "derecho" | "invertido", domain: ReadingDomain): string {
  if (orientation === "derecho") return value;
  return `${value}, pero bloqueado, demorado o expresado de forma desordenada en el dominio ${domain}`;
}

function domainLead(domain: ReadingDomain): string {
  return domainFallbacks[domain];
}

function findOpeningCard(cards: NarrativeCard[]): NarrativeCard | undefined {
  return cards.find((card) => OPENING_CARDS.some((name) => normalize(card.cardName).includes(name)));
}

function pickFlexibleKeyCards(cards: NarrativeCard[]): NarrativeCard[] {
  const byRole = orderedByRole(cards, ["central", "challenge", "outcome", "conscious", "unconscious"]);
  if (byRole.length >= 3) return byRole;
  return [...byRole, ...cards.filter((card) => !byRole.includes(card))].slice(0, Math.min(cards.length, 5));
}

function pickSpreadKeyCards(cards: NarrativeCard[], spreadType: string): NarrativeCard[] {
  const spreadKind = getSpreadKind(spreadType, cards);
  const priorityByKind: Record<string, NarrativeCardRole[]> = {
    "three-cards": ["situation", "blockage", "advice", "outcome"],
    "five-cards": ["situation", "challenge", "hidden", "advice", "outcome"],
    horseshoe: ["situation", "challenge", "hidden", "advice", "outcome"],
    "celtic-cross": ["central", "challenge", "outcome", "conscious", "unconscious", "fear"],
    "line-seven": ["situation", "challenge", "advice", "future", "outcome"],
    "tree-of-life": ["central", "blockage", "outcome", "conscious", "unconscious"],
    decision: ["decisionA", "decisionB", "risk", "opportunity", "advice", "outcome"],
    relationships: ["relationshipA", "bond", "relationshipB", "hidden", "challenge", "outcome"],
    "work-finance": ["situation", "resources", "blockage", "opportunity", "risk", "outcome"],
    "full-moon": ["release", "hidden", "integration", "lesson", "advice", "outcome"],
    pendulum: ["situation", "answer", "advice", "outcome"],
    free: ["free", "release", "blockage", "advice", "outcome"],
  };
  const priority = priorityByKind[spreadKind] ?? ["situation", "central", "challenge", "advice", "outcome"];
  const selected = orderedByRole(cards, priority);
  return (selected.length ? selected : cards).slice(0, Math.min(cards.length, 6));
}

function orderedByPosition(cards: NarrativeCard[], positions: number[]): NarrativeCard[] {
  return positions.flatMap((position) => cards.filter((card) => card.positionNumber === position));
}

function orderedByRole(cards: NarrativeCard[], roles: NarrativeCardRole[]): NarrativeCard[] {
  return roles.flatMap((role) => cards.filter((card) => card.role === role));
}

function findByRole(cards: NarrativeCard[], role: NarrativeCardRole): NarrativeCard | undefined {
  return cards.find((card) => card.role === role);
}

function findFirstByRoles(cards: NarrativeCard[], roles: NarrativeCardRole[]): NarrativeCard | undefined {
  for (const role of roles) {
    const match = findByRole(cards, role);
    if (match) return match;
  }
  return undefined;
}

function findByPositionName(cards: NarrativeCard[], names: string[]): NarrativeCard | undefined {
  return cards.find((card) => names.some((name) => normalize(card.positionName).includes(normalize(name))));
}

function inferRoleFromName(positionName: string, positionNumber: number): NarrativeCardRole {
  const normalized = normalize(positionName);
  if (normalized.includes("pasado") || normalized.includes("origen") || positionNumber === 1) return "past";
  if (normalized.includes("situacion") || normalized.includes("presente") || normalized.includes("centro")) return "central";
  if (normalized.includes("reto") || normalized.includes("obstac") || normalized.includes("desafio")) return "challenge";
  if (normalized.includes("resultado") || normalized.includes("desenlace") || normalized.includes("final")) return "outcome";
  if (normalized.includes("inconsciente") || normalized.includes("raiz") || normalized.includes("oculta")) return "unconscious";
  if (normalized.includes("mente") || normalized.includes("consciente")) return "conscious";
  if (normalized.includes("futuro") || normalized.includes("direccion")) return "future";
  if (normalized.includes("entorno") || normalized.includes("demas") || normalized.includes("demás")) return "environment";
  if (normalized.includes("temor") || normalized.includes("miedo") || normalized.includes("duda")) return "fear";
  return "support";
}

function isCelticCross(spreadType: string, cards: CartaPosicionada[]): boolean {
  const normalizedSpreadType = normalize(spreadType);
  if (normalizedSpreadType.includes("celtic") || normalizedSpreadType.includes("cruz celta")) {
    return true;
  }

  const positionNames = cards.map((card) => normalize(card.positionName));
  return (
    cards.length === 10 &&
    positionNames.some((name) => name.includes("situacion actual")) &&
    positionNames.some((name) => name.includes("resultado"))
  );
}

function isThreeCard(spreadType: string, cards: CartaPosicionada[]): boolean {
  return cards.length === 3 || normalize(spreadType).includes("three") || normalize(spreadType).includes("3 cartas");
}

function isFiveCard(spreadType: string, cards: CartaPosicionada[]): boolean {
  return cards.length === 5 || normalize(spreadType).includes("five") || normalize(spreadType).includes("5 cartas");
}

function isHorseshoe(spreadType: string, cards: CartaPosicionada[]): boolean {
  return normalize(spreadType).includes("horseshoe") || normalize(spreadType).includes("herradura") || cards.length === 7;
}

function isKabbalah(spreadType: string, cards: CartaPosicionada[]): boolean {
  return normalize(spreadType).includes("kabbalah") || normalize(spreadType).includes("kabala") || normalize(spreadType).includes("arbol de la vida") || normalize(spreadType).includes("tree-of-life");
}

function shortCard(card?: NarrativeCard): string {
  if (!card) return "una carta de apoyo";
  return `${card.cardName} ${card.orientation} en ${card.positionName}`;
}

function shortFunction(card?: NarrativeCard): string {
  if (!card) return "una posicion de apoyo";
  return `${card.cardName} en ${card.positionName}`;
}

function shorten(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  const sliced = value.slice(0, maxLength);
  return `${sliced.slice(0, Math.max(0, sliced.lastIndexOf(" ")))}...`;
}

function clean(value?: string): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

export function sanitizeNarrativeText(value: unknown, maxLength = 900): string {
  if (typeof value !== "string") {
    return "";
  }

  const withoutScripts = value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ");
  const withoutTags = withoutScripts.replace(/<[^>]*>/g, " ");
  const decoded = decodeBasicHtmlEntities(withoutTags);
  const normalized = decoded.replace(/\s+/g, " ").trim();

  if (!normalized || normalized.length <= maxLength) {
    return normalized;
  }

  const clipped = normalized.slice(0, maxLength);
  const sentenceEnd = Math.max(clipped.lastIndexOf("."), clipped.lastIndexOf(";"), clipped.lastIndexOf(","));
  const wordEnd = clipped.lastIndexOf(" ");
  const cutAt = sentenceEnd > maxLength * 0.65 ? sentenceEnd + 1 : wordEnd;
  return clipped.slice(0, cutAt > 0 ? cutAt : maxLength).trim();
}

function decodeBasicHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&aacute;/gi, "á")
    .replace(/&eacute;/gi, "é")
    .replace(/&iacute;/gi, "í")
    .replace(/&oacute;/gi, "ó")
    .replace(/&uacute;/gi, "ú")
    .replace(/&ntilde;/gi, "ñ")
    .replace(/&Aacute;/g, "Á")
    .replace(/&Eacute;/g, "É")
    .replace(/&Iacute;/g, "Í")
    .replace(/&Oacute;/g, "Ó")
    .replace(/&Uacute;/g, "Ú")
    .replace(/&Ntilde;/g, "Ñ");
}

function slugify(value: string): string {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function canonicalCardName(value: string): string {
  return normalize(value).replace(/^(el|la|los|las)\s+/, "");
}

function containsAny(source: string, terms: string[]): boolean {
  return terms.some((term) => source.includes(normalize(term)));
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
