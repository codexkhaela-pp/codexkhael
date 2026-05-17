import type { TarotCard } from "@/src/data/tarotCards";
import { tarotSpreads } from "@/src/data/tarotSpreads";

export type InterpretationTone = "mystic" | "psychological" | "direct";

export type SpreadInterpretationCard = {
  position: string | { id?: number; label: string; subtitle?: string };
  card: TarotCard;
  reversed: boolean;
};

type InterpretationRole = "context" | "challenge" | "advice";

type TonePhrase = Record<InterpretationTone, string>;

type OrientationPhrase = {
  upright: TonePhrase;
  reversed: TonePhrase;
};

type SuitMeaningProfile = {
  context: OrientationPhrase;
  challenge: OrientationPhrase;
  advice: OrientationPhrase;
};

type CardMeaningOverride = Partial<Record<InterpretationRole, OrientationPhrase>>;

const suitMeaningMap: Record<TarotCard["suit"], SuitMeaningProfile> = {
  major: {
    context: {
      upright: {
        mystic: "la lectura abre un aprendizaje de ciclo que busca alinearse con tu propÃ³sito",
        psychological: "hay un cambio profundo de perspectiva que te pide madurez interna",
        direct: "estÃ¡s frente a una decisiÃ³n de fondo que no se resuelve con evasiÃ³n",
      },
      reversed: {
        mystic: "la energÃ­a del ciclo aparece trabada y pide revisar dÃ³nde te resistes",
        psychological: "aparece un patrÃ³n interno que aÃºn no termina de integrarse",
        direct: "sigues repitiendo el mismo punto y necesitas cortar ese bucle",
      },
    },
    challenge: {
      upright: {
        mystic: "el reto es sostener la lecciÃ³n sin perder centro",
        psychological: "el bloqueo aparece cuando dudas de lo que ya sabes",
        direct: "el problema es no comprometerte con la decisiÃ³n que ya viste",
      },
      reversed: {
        mystic: "el bloqueo nace de resistir una transformaciÃ³n necesaria",
        psychological: "el obstÃ¡culo estÃ¡ en evitar una verdad que ya es evidente",
        direct: "dejas pendiente lo importante y eso te detiene",
      },
    },
    advice: {
      upright: {
        mystic: "el consejo es honrar el proceso y actuar con consciencia",
        psychological: "te conviene integrar lo aprendido y actuar desde claridad",
        direct: "toma una decisiÃ³n firme y sostenla con disciplina",
      },
      reversed: {
        mystic: "el consejo es pausar, observar y reordenar antes de avanzar",
        psychological: "primero regula tu base interna y luego decide",
        direct: "frena, ordena y retoma con foco",
      },
    },
  },
  wands: {
    context: {
      upright: {
        mystic: "hay una fuerza de expansiÃ³n que quiere abrir nuevos caminos",
        psychological: "surge impulso para avanzar y recuperar iniciativa",
        direct: "tienes energÃ­a para moverte y crecer",
      },
      reversed: {
        mystic: "la energÃ­a de avance se encuentra contenida y todavÃ­a no fluye del todo",
        psychological: "hay frustraciÃ³n por querer avanzar sin sentir direcciÃ³n firme",
        direct: "estÃ¡s empujando, pero el movimiento no termina de responder",
      },
    },
    challenge: {
      upright: {
        mystic: "el bloqueo aparece al dispersar tu fuego en demasiados frentes",
        psychological: "el obstÃ¡culo estÃ¡ en la impaciencia por resultados",
        direct: "el problema es querer todo al mismo tiempo",
      },
      reversed: {
        mystic: "el camino se frena por expectativas que aÃºn no tienen base",
        psychological: "el bloqueo surge al esperar avance sin una estructura clara",
        direct: "esperas resultados antes de ordenar lo esencial",
      },
    },
    advice: {
      upright: {
        mystic: "el consejo es canalizar tu energÃ­a en una direcciÃ³n concreta",
        psychological: "elige una prioridad y sostÃ©nla con constancia",
        direct: "enfÃ³cate en una sola lÃ­nea y ejecÃºtala",
      },
      reversed: {
        mystic: "el consejo es contener el impulso y recuperar rumbo",
        psychological: "primero regula el ritmo, luego retoma el movimiento",
        direct: "baja la velocidad y ordena antes de insistir",
      },
    },
  },
  cups: {
    context: {
      upright: {
        mystic: "la lectura muestra sensibilidad abierta y necesidad de conexiÃ³n autÃ©ntica",
        psychological: "hay una emociÃ³n disponible que quiere expresarse con honestidad",
        direct: "lo emocional es central y no conviene ignorarlo",
      },
      reversed: {
        mystic: "la energÃ­a afectiva aparece desajustada y pide contenciÃ³n",
        psychological: "hay saturaciÃ³n emocional o dificultad para nombrar lo que sientes",
        direct: "estÃ¡s cargando demasiado por dentro y eso nubla tu decisiÃ³n",
      },
    },
    challenge: {
      upright: {
        mystic: "el bloqueo estÃ¡ en confundir sensibilidad con dependencia",
        psychological: "el obstÃ¡culo aparece cuando priorizas agradar antes que cuidarte",
        direct: "te frenas por complacer y postergarte",
      },
      reversed: {
        mystic: "el bloqueo nace de un desborde emocional que pide lÃ­mite",
        psychological: "el reto es regular la emociÃ³n antes de actuar",
        direct: "si decides desde el desborde, te desordenas mÃ¡s",
      },
    },
    advice: {
      upright: {
        mystic: "el consejo es escuchar tu mundo interno sin dramatizarlo",
        psychological: "nombra lo que sientes y define lÃ­mites sanos",
        direct: "sÃ© claro con lo que sientes y cuida tu energÃ­a",
      },
      reversed: {
        mystic: "el consejo es cerrar fugas emocionales y volver al centro",
        psychological: "primero regula, luego conversa o decide",
        direct: "pon lÃ­mite, estabiliza y despuÃ©s actÃºa",
      },
    },
  },
  swords: {
    context: {
      upright: {
        mystic: "la lectura trae claridad mental y verdad que quiere salir a la luz",
        psychological: "hay lucidez para observar el patrÃ³n con objetividad",
        direct: "ya tienes informaciÃ³n suficiente para decidir",
      },
      reversed: {
        mystic: "la mente estÃ¡ cargada y la energÃ­a se fragmenta en exceso",
        psychological: "aparece ruido mental que dificulta ver con precisiÃ³n",
        direct: "estÃ¡s pensando demasiado y actuando poco",
      },
    },
    challenge: {
      upright: {
        mystic: "el bloqueo surge cuando la lÃ³gica se vuelve rigidez",
        psychological: "el obstÃ¡culo estÃ¡ en controlar todo desde la mente",
        direct: "te trabas por sobreanalizar",
      },
      reversed: {
        mystic: "el reto se intensifica por confusiÃ³n y diÃ¡logo interno agotador",
        psychological: "el bloqueo estÃ¡ en la rumiaciÃ³n y el juicio interno",
        direct: "si sigues dando vueltas, no avanzas",
      },
    },
    advice: {
      upright: {
        mystic: "el consejo es elegir verdad y actuar con precisiÃ³n",
        psychological: "ordena ideas, reduce ruido y define el siguiente paso real",
        direct: "decide una acciÃ³n concreta y ejecÃºtala hoy",
      },
      reversed: {
        mystic: "el consejo es silenciar el exceso mental antes de actuar",
        psychological: "necesitas pausa cognitiva para recuperar claridad",
        direct: "frena el ruido, simplifica y avanza por etapas",
      },
    },
  },
  pentacles: {
    context: {
      upright: {
        mystic: "la energÃ­a busca arraigo, estructura y estabilidad sostenible",
        psychological: "hay base prÃ¡ctica para construir con calma",
        direct: "tienes recursos para ordenar y sostener",
      },
      reversed: {
        mystic: "la estabilidad aparente aÃºn no termina de enraizarse",
        psychological: "por fuera hay orden, pero internamente la base se siente frÃ¡gil",
        direct: "te falta base firme y eso estÃ¡ frenando el avance",
      },
    },
    challenge: {
      upright: {
        mystic: "el bloqueo estÃ¡ en aferrarte a lo seguro por temor al cambio",
        psychological: "el obstÃ¡culo aparece cuando controlas de mÃ¡s por inseguridad",
        direct: "te trabas por querer garantizar todo antes de moverte",
      },
      reversed: {
        mystic: "el reto surge por desorden de recursos y pÃ©rdida de centro material",
        psychological: "el bloqueo estÃ¡ en la falta de estructura sostenida",
        direct: "sin orden prÃ¡ctico, el crecimiento se corta",
      },
    },
    advice: {
      upright: {
        mystic: "el consejo es proteger recursos, consolidar base y avanzar desde ahÃ­",
        psychological: "primero ordena, preserva energÃ­a y recupera estabilidad",
        direct: "ordena lo bÃ¡sico, protege lo que tienes y luego crece",
      },
      reversed: {
        mystic: "el consejo es soltar el miedo a perder y reequilibrar tu sostÃ©n",
        psychological: "necesitas flexibilizar control y reorganizar prioridades",
        direct: "deja el apego, corrige el orden y retoma control real",
      },
    },
  },
};

const cardMeaningMap: Record<string, CardMeaningOverride> = {
  "pentacles-09": {
    context: {
      upright: {
        mystic: "hay una energÃ­a de autonomÃ­a bien ganada que pide disfrutarse con presencia",
        psychological: "hay independencia y logros, junto con necesidad de sostenerlos con equilibrio interno",
        direct: "tienes logros, pero debes sostenerlos con orden y realismo",
      },
      reversed: {
        mystic: "se muestra una estabilidad aparente que todavÃ­a necesita asentarse por dentro",
        psychological: "aparece inseguridad detrÃ¡s de una imagen de control o autosuficiencia",
        direct: "parece que todo estÃ¡ bajo control, pero la base sigue inestable",
      },
    },
  },
  "wands-03": {
    challenge: {
      upright: {
        mystic: "el paso siguiente se abre cuando confÃ­as en tu expansiÃ³n sin dispersarte",
        psychological: "el reto estÃ¡ en sostener la visiÃ³n a mediano plazo sin ansiedad",
        direct: "debes mirar mÃ¡s allÃ¡ del corto plazo y sostener el plan",
      },
      reversed: {
        mystic: "la expansiÃ³n se detiene porque la energÃ­a aÃºn no estÃ¡ lista para abrir camino",
        psychological: "el bloqueo aparece al querer resultados sin una base interna suficientemente firme",
        direct: "quieres avanzar, pero todavÃ­a no ordenaste el punto de partida",
      },
    },
  },
  "pentacles-04": {
    advice: {
      upright: {
        mystic: "el consejo es contener antes de expandir: protege tu centro y fortalece tu base",
        psychological: "te conviene recuperar estructura, lÃ­mites y seguridad antes de exigir avance",
        direct: "no fuerces crecimiento ahora: ordena, protege y estabiliza",
      },
      reversed: {
        mystic: "el consejo es aflojar la rigidez para que la energÃ­a vuelva a circular",
        psychological: "soltar exceso de control te ayudarÃ¡ a recuperar equilibrio",
        direct: "deja de apretar de mÃ¡s y reorganiza con flexibilidad",
      },
    },
  },
};

const closingByTone: Record<InterpretationTone, string> = {
  mystic: "Cuando la base se fortalece, el camino se abre con mayor armonia.",
  psychological: "Con una base mas ordenada, tus decisiones se vuelven mas claras y sostenibles.",
  direct: "Primero ordena la base; despues, avanza con decision.",
};

export type PositionReading = {
  positionNumber: number;
  positionName: string;
  positionSubtitle: string;
  cardName: string;
  orientation: string;
  interpretation: string;
};

export type QuickInterpretationOutput = {
  summary: string;
  positionReadings: PositionReading[];
  relationships: string;
  finalAdvice: string;
};

type QuickInterpretationInput = {
  spreadId: string;
  cards: SpreadInterpretationCard[];
  tone: InterpretationTone;
};

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getPositionLabel(position: SpreadInterpretationCard["position"]): string {
  if (typeof position === "string") {
    return position;
  }
  return position.label;
}

function getPositionSubtitle(position: SpreadInterpretationCard["position"]): string {
  if (typeof position === "string") {
    return "";
  }
  return position.subtitle ?? "";
}

function detectRole(
  position: SpreadInterpretationCard["position"],
  index: number,
  total: number,
): InterpretationRole {
  const normalized = normalize(getPositionLabel(position));

  if (
    normalized.includes("bloqueo") ||
    normalized.includes("obstaculo") ||
    normalized.includes("reto") ||
    normalized.includes("desafio") ||
    normalized.includes("nudo") ||
    normalized.includes("tension")
  ) {
    return "challenge";
  }

  if (
    normalized.includes("consejo") ||
    normalized.includes("futuro") ||
    normalized.includes("direccion") ||
    normalized.includes("resultado") ||
    normalized.includes("potencial") ||
    normalized.includes("sintesis") ||
    normalized.includes("accion") ||
    normalized.includes("cierre")
  ) {
    return "advice";
  }

  if (
    normalized.includes("situacion") ||
    normalized.includes("presente") ||
    normalized.includes("pasado") ||
    normalized.includes("origen") ||
    normalized.includes("contexto")
  ) {
    return "context";
  }

  if (index === total - 1) {
    return "advice";
  }

  if (index > 0 && index < total - 1) {
    return "challenge";
  }

  return "context";
}

function getRolePhrase(
  roleCard: SpreadInterpretationCard,
  role: InterpretationRole,
  tone: InterpretationTone,
): string {
  const orientation = roleCard.reversed ? "reversed" : "upright";
  const cardOverride = cardMeaningMap[roleCard.card.id]?.[role];

  if (cardOverride) {
    return cardOverride[orientation][tone];
  }

  return suitMeaningMap[roleCard.card.suit][role][orientation][tone];
}

function getOpeningByTone(tone: InterpretationTone): string {
  if (tone === "mystic") return "La energia general apunta a un proceso de reordenamiento interno.";
  if (tone === "psychological") return "Se percibe una dinamica emocional y mental bastante definida.";
  return "La lectura va al punto y marca una direccion concreta.";
}

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function getInterpretationSeed(
  spreadId: string,
  cards: SpreadInterpretationCard[],
  tone: InterpretationTone,
): number {
  const signature = cards
    .map((entry) => `${entry.card.id}:${entry.reversed ? "r" : "u"}:${getPositionLabel(entry.position)}`)
    .join("|");
  return hashString(`${spreadId}|${tone}|${signature}`);
}

function pickVariant(options: string[], seed: number, salt: number): string {
  const index = (seed + salt * 97) % options.length;
  return options[index];
}

function getDominantSuit(cards: SpreadInterpretationCard[]): string {
  const suits = { wands: 0, cups: 0, swords: 0, pentacles: 0, major: 0 };
  for (const c of cards) {
    if (c.card.suit in suits) {
      suits[c.card.suit as keyof typeof suits]++;
    }
  }
  let max = 0;
  let dom = "";
  for (const [s, count] of Object.entries(suits)) {
    if (s !== "major" && count > max) {
      max = count;
      dom = s;
    }
  }
  const names: Record<string, string> = { wands: "Bastos", cups: "Copas", swords: "Espadas", pentacles: "Oros" };
  return max > 0 ? names[dom] : "Mixto";
}

function buildSummary(
  spreadName: string,
  cards: SpreadInterpretationCard[],
  tone: InterpretationTone,
  seed: number,
): string {
  const total = cards.length;
  const rightCount = cards.filter((c) => !c.reversed).length;
  const reversedCount = total - rightCount;
  const majors = cards.filter((c) => c.card.arcana === "major").length;
  const dominantSuit = getDominantSuit(cards);

  const openers = [
    `La tirada de ${spreadName} refleja un momento de definicion.`,
    `Lo que destaca en esta lectura de ${spreadName} es una tension que pide orden.`,
    `Aqui se observa en ${spreadName} un proceso que ya esta pidiendo una decision consciente.`,
  ];

  const balanceVariants = [
    `Predominan ${rightCount} ${pluralize(rightCount, "carta derecha", "cartas derechas")} frente a ${reversedCount} ${pluralize(
      reversedCount,
      "invertida",
      "invertidas",
    )}.`,
    `El reparto energetico muestra ${rightCount} ${pluralize(
      rightCount,
      "derecha",
      "derechas",
    )} y ${reversedCount} ${pluralize(reversedCount, "invertida", "invertidas")} entre ${total} ${pluralize(
      total,
      "carta",
      "cartas",
    )}.`,
    `Hay ${rightCount} ${pluralize(rightCount, "carta en posicion derecha", "cartas en posicion derecha")} y ${reversedCount} ${pluralize(
      reversedCount,
      "carta invertida",
      "cartas invertidas",
    )}.`,
  ];

  const majorVariants =
    majors > 0
      ? [
          `Aparecen ${majors} ${pluralize(majors, "arcano mayor", "arcanos mayores")}, lo que eleva el peso de fondo de la lectura.`,
          `La presencia de ${majors} ${pluralize(majors, "arcano mayor", "arcanos mayores")} sugiere aprendizajes de mayor profundidad.`,
          `Con ${majors} ${pluralize(majors, "arcano mayor", "arcanos mayores")}, hay un matiz de ciclo importante en juego.`,
        ]
      : [
          "Sin arcanos mayores, el foco esta en decisiones practicas y cercanas.",
          "Al no aparecer arcanos mayores, la lectura se centra en lo cotidiano y accionable.",
          "La ausencia de arcanos mayores sugiere que el avance depende mas de decisiones concretas que de grandes giros.",
        ];

  const dominantSuitVariants =
    dominantSuit !== "Mixto"
      ? [
          `El tono dominante viene por ${dominantSuit}, reforzando ese tipo de energia en toda la tirada.`,
          `${dominantSuit} marca la cadencia principal y condiciona como se procesa el conflicto.`,
          `La familia de ${dominantSuit} pesa mas que el resto y define el clima de la lectura.`,
        ]
      : [
          "No hay un solo elemento dominante: la lectura esta repartida y pide equilibrio.",
          "El conjunto es mixto, con fuerzas diversas que se compensan entre si.",
          "La energia aparece distribuida, sin un palo imponiendose con claridad.",
        ];

  return [
    pickVariant(openers, seed, 1),
    pickVariant(balanceVariants, seed, 2),
    pickVariant(majorVariants, seed, 3),
    pickVariant(dominantSuitVariants, seed, 4),
    getOpeningByTone(tone),
  ].join(" ");
}

function buildRelationships(spreadId: string, total: number, seed: number): string {
  if (total === 3 || spreadId === "situation-blockage-advice") {
    const variants = [
      "La primera carta marca el contexto, la segunda revela donde se traba el proceso y la tercera abre una salida concreta.",
      "Se ve una secuencia clara: punto de partida, nudo central y direccion para destrabar.",
      "El recorrido va de la situacion actual al bloqueo, y termina en una accion que ordena el avance.",
    ];
    return pickVariant(variants, seed, 10);
  }

  if (total === 5 && spreadId === "five-cards") {
    const variants = [
      "El nucleo de la tirada muestra tu estado actual; los extremos tiran en direcciones distintas y el cierre propone equilibrio.",
      "Hay un centro muy claro, rodeado por influencias que empujan y frenan al mismo tiempo; la ultima carta actua como ajuste final.",
      "La dinamica de cinco cartas pone el foco en el punto medio, mientras las laterales exponen tensiones que se resuelven al cierre.",
    ];
    return pickVariant(variants, seed, 11);
  }

  if (spreadId === "line-seven" || (total === 7 && spreadId !== "horseshoe")) {
    const variants = [
      "La lectura avanza como una historia: inicio, desarrollo, giro y desenlace.",
      "Se percibe una progresion por etapas donde cada posicion prepara la siguiente.",
      "Las siete posiciones muestran un proceso escalonado que madura carta a carta.",
    ];
    return pickVariant(variants, seed, 12);
  }

  if (spreadId === "tree-of-life") {
    const variants = [
      "La estructura combina eje superior, centro y base, mostrando como lo interno termina expresandose en lo concreto.",
      "Se cruzan niveles de conciencia y accion: lo alto inspira, lo central ordena y lo bajo materializa.",
      "El arbol distribuye la lectura en planos complementarios: vision, tension, integracion y aterrizaje.",
    ];
    return pickVariant(variants, seed, 13);
  }

  if (spreadId === "celtic-cross") {
    const variants = [
      "La cruz central muestra el conflicto vivo; luego aparecen entorno, actitud y resultado para cerrar el panorama.",
      "Primero se expone la tension principal, despues se abre el contexto externo y finalmente la proyeccion de salida.",
      "El esquema separa con claridad raiz, reto y direccion, permitiendo leer causa, freno y desenlace sin mezclar planos.",
    ];
    return pickVariant(variants, seed, 14);
  }

  if (spreadId === "decision") {
    const variants = [
      "La tirada contrapone dos caminos alrededor de un centro de decision y cierra con una recomendacion integradora.",
      "Se muestran dos alternativas con sus costos y ventajas, y una carta final que ordena la eleccion.",
      "El foco esta en comparar rutas: una te empuja a actuar, la otra a reevaluar, y el cierre define el criterio.",
    ];
    return pickVariant(variants, seed, 15);
  }

  if (spreadId === "relationships") {
    const variants = [
      "Ambas energias se espejan alrededor del vinculo central, y desde ahi se proyecta el resultado.",
      "La lectura pone frente a frente dos posturas y muestra como impactan en la relacion compartida.",
      "Primero aparecen ambas partes, luego el punto comun y por ultimo la direccion real del vinculo.",
    ];
    return pickVariant(variants, seed, 16);
  }

  if (spreadId === "horseshoe") {
    const variants = [
      "La energia recorre un arco: pasado, presente, punto de quiebre y resultado.",
      "La herradura muestra evolucion: se arranca desde antecedentes, se atraviesa el reto y se aterriza en una salida.",
      "El movimiento es gradual: contexto previo, tension central y conclusion.",
    ];
    return pickVariant(variants, seed, 17);
  }

  const fallback = [
    "La tirada avanza por etapas: inicio, tension principal, desarrollo y cierre.",
    "El orden de posiciones muestra una narrativa con causa, nudo y resolucion.",
    "Se observa una secuencia progresiva que va del contexto al desenlace.",
  ];

  return pickVariant(fallback, seed, 18);
}

function buildFinalAdvice(cards: SpreadInterpretationCard[], tone: InterpretationTone, seed: number): string {
  const total = cards.length;
  const adviceCards = cards.filter((c) => {
    const norm = normalize(getPositionLabel(c.position));
    return norm.includes("consejo") || norm.includes("cierre") || norm.includes("resultado");
  });

  const targetCard = adviceCards.length > 0 ? adviceCards[adviceCards.length - 1] : cards[total - 1];
  const rolePhrase = getRolePhrase(targetCard, "advice", tone);
  const positionName = getPositionLabel(targetCard.position);
  const cardName = `${targetCard.card.nameEs}${targetCard.reversed ? " invertida" : ""}`;

  const openers = [
    "Lo importante aqui es tomar una accion sostenida.",
    "La decision pasa por ordenar primero lo esencial.",
    "El siguiente paso es claro y no requiere forzarlo.",
    "La clave esta en simplificar y avanzar con consistencia.",
  ];

  const bridge = [
    `La carta que marca direccion es ${cardName}, en la posicion ${positionName}, y apunta a que ${rolePhrase}.`,
    `En ${positionName}, ${cardName} pone el foco en que ${rolePhrase}.`,
    `El foco principal aparece en ${positionName} con ${cardName}: ${rolePhrase}.`,
  ];

  return `${pickVariant(openers, seed, 20)} ${pickVariant(bridge, seed, 21)} ${closingByTone[tone]}`;
}

export function getQuickInterpretation({
  spreadId,
  cards,
  tone,
}: QuickInterpretationInput): QuickInterpretationOutput {
  if (cards.length === 0) {
    return {
      summary: "",
      positionReadings: [],
      relationships: "",
      finalAdvice: "",
    };
  }

  const selectedSpread = tarotSpreads.find((s) => s.id === spreadId);
  const spreadName = selectedSpread ? selectedSpread.name : "Tirada";
  const seed = getInterpretationSeed(spreadId, cards, tone);

  const summary = buildSummary(spreadName, cards, tone, seed);
  const relationships = buildRelationships(spreadId, cards.length, seed);
  const finalAdvice = buildFinalAdvice(cards, tone, seed);

  const positionReadings: PositionReading[] = cards.map((card, index) => {
    const role = detectRole(card.position, index, cards.length);
    const phrase = getRolePhrase(card, role, tone);

    const roleIntroMap: Record<InterpretationRole, string[]> = {
      context: ["Esta posicion refleja que", "Aqui se ve que", "El trasfondo muestra que"],
      challenge: [
        "El punto de friccion aparece cuando",
        "La tension principal surge porque",
        "Aqui el bloqueo se activa cuando",
      ],
      advice: ["La salida mas util es que", "Conviene ahora que", "La recomendacion practica es que"],
    };

    const intro = pickVariant(roleIntroMap[role], seed, 40 + index);

    return {
      positionNumber: index + 1,
      positionName: getPositionLabel(card.position) || `Posicion ${index + 1}`,
      positionSubtitle: getPositionSubtitle(card.position),
      cardName: card.card.nameEs,
      orientation: card.reversed ? "Invertida" : "Derecha",
      interpretation: `${intro} ${phrase}.`,
    };
  });

  return {
    summary,
    positionReadings,
    relationships,
    finalAdvice,
  };
}
