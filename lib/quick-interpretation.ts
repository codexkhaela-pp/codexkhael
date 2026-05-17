import type { TarotCard } from "@/src/data/tarotCards";

export type InterpretationTone = "mystic" | "psychological" | "direct";

export type SpreadInterpretationCard = {
  position: string | { id?: number; label: string };
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
        mystic: "la lectura abre un aprendizaje de ciclo que busca alinearse con tu propósito",
        psychological: "hay un cambio profundo de perspectiva que te pide madurez interna",
        direct: "estás frente a una decisión de fondo que no se resuelve con evasión",
      },
      reversed: {
        mystic: "la energía del ciclo aparece trabada y pide revisar dónde te resistes",
        psychological: "aparece un patrón interno que aún no termina de integrarse",
        direct: "sigues repitiendo el mismo punto y necesitas cortar ese bucle",
      },
    },
    challenge: {
      upright: {
        mystic: "el reto es sostener la lección sin perder centro",
        psychological: "el bloqueo aparece cuando dudas de lo que ya sabes",
        direct: "el problema es no comprometerte con la decisión que ya viste",
      },
      reversed: {
        mystic: "el bloqueo nace de resistir una transformación necesaria",
        psychological: "el obstáculo está en evitar una verdad que ya es evidente",
        direct: "dejas pendiente lo importante y eso te detiene",
      },
    },
    advice: {
      upright: {
        mystic: "el consejo es honrar el proceso y actuar con consciencia",
        psychological: "te conviene integrar lo aprendido y actuar desde claridad",
        direct: "toma una decisión firme y sostenla con disciplina",
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
        mystic: "hay una fuerza de expansión que quiere abrir nuevos caminos",
        psychological: "surge impulso para avanzar y recuperar iniciativa",
        direct: "tienes energía para moverte y crecer",
      },
      reversed: {
        mystic: "la energía de avance se encuentra contenida y todavía no fluye del todo",
        psychological: "hay frustración por querer avanzar sin sentir dirección firme",
        direct: "estás empujando, pero el movimiento no termina de responder",
      },
    },
    challenge: {
      upright: {
        mystic: "el bloqueo aparece al dispersar tu fuego en demasiados frentes",
        psychological: "el obstáculo está en la impaciencia por resultados",
        direct: "el problema es querer todo al mismo tiempo",
      },
      reversed: {
        mystic: "el camino se frena por expectativas que aún no tienen base",
        psychological: "el bloqueo surge al esperar avance sin una estructura clara",
        direct: "esperas resultados antes de ordenar lo esencial",
      },
    },
    advice: {
      upright: {
        mystic: "el consejo es canalizar tu energía en una dirección concreta",
        psychological: "elige una prioridad y sosténla con constancia",
        direct: "enfócate en una sola línea y ejecútala",
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
        mystic: "la lectura muestra sensibilidad abierta y necesidad de conexión auténtica",
        psychological: "hay una emoción disponible que quiere expresarse con honestidad",
        direct: "lo emocional es central y no conviene ignorarlo",
      },
      reversed: {
        mystic: "la energía afectiva aparece desajustada y pide contención",
        psychological: "hay saturación emocional o dificultad para nombrar lo que sientes",
        direct: "estás cargando demasiado por dentro y eso nubla tu decisión",
      },
    },
    challenge: {
      upright: {
        mystic: "el bloqueo está en confundir sensibilidad con dependencia",
        psychological: "el obstáculo aparece cuando priorizas agradar antes que cuidarte",
        direct: "te frenas por complacer y postergarte",
      },
      reversed: {
        mystic: "el bloqueo nace de un desborde emocional que pide límite",
        psychological: "el reto es regular la emoción antes de actuar",
        direct: "si decides desde el desborde, te desordenas más",
      },
    },
    advice: {
      upright: {
        mystic: "el consejo es escuchar tu mundo interno sin dramatizarlo",
        psychological: "nombra lo que sientes y define límites sanos",
        direct: "sé claro con lo que sientes y cuida tu energía",
      },
      reversed: {
        mystic: "el consejo es cerrar fugas emocionales y volver al centro",
        psychological: "primero regula, luego conversa o decide",
        direct: "pon límite, estabiliza y después actúa",
      },
    },
  },
  swords: {
    context: {
      upright: {
        mystic: "la lectura trae claridad mental y verdad que quiere salir a la luz",
        psychological: "hay lucidez para observar el patrón con objetividad",
        direct: "ya tienes información suficiente para decidir",
      },
      reversed: {
        mystic: "la mente está cargada y la energía se fragmenta en exceso",
        psychological: "aparece ruido mental que dificulta ver con precisión",
        direct: "estás pensando demasiado y actuando poco",
      },
    },
    challenge: {
      upright: {
        mystic: "el bloqueo surge cuando la lógica se vuelve rigidez",
        psychological: "el obstáculo está en controlar todo desde la mente",
        direct: "te trabas por sobreanalizar",
      },
      reversed: {
        mystic: "el reto se intensifica por confusión y diálogo interno agotador",
        psychological: "el bloqueo está en la rumiación y el juicio interno",
        direct: "si sigues dando vueltas, no avanzas",
      },
    },
    advice: {
      upright: {
        mystic: "el consejo es elegir verdad y actuar con precisión",
        psychological: "ordena ideas, reduce ruido y define el siguiente paso real",
        direct: "decide una acción concreta y ejecútala hoy",
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
        mystic: "la energía busca arraigo, estructura y estabilidad sostenible",
        psychological: "hay base práctica para construir con calma",
        direct: "tienes recursos para ordenar y sostener",
      },
      reversed: {
        mystic: "la estabilidad aparente aún no termina de enraizarse",
        psychological: "por fuera hay orden, pero internamente la base se siente frágil",
        direct: "te falta base firme y eso está frenando el avance",
      },
    },
    challenge: {
      upright: {
        mystic: "el bloqueo está en aferrarte a lo seguro por temor al cambio",
        psychological: "el obstáculo aparece cuando controlas de más por inseguridad",
        direct: "te trabas por querer garantizar todo antes de moverte",
      },
      reversed: {
        mystic: "el reto surge por desorden de recursos y pérdida de centro material",
        psychological: "el bloqueo está en la falta de estructura sostenida",
        direct: "sin orden práctico, el crecimiento se corta",
      },
    },
    advice: {
      upright: {
        mystic: "el consejo es proteger recursos, consolidar base y avanzar desde ahí",
        psychological: "primero ordena, preserva energía y recupera estabilidad",
        direct: "ordena lo básico, protege lo que tienes y luego crece",
      },
      reversed: {
        mystic: "el consejo es soltar el miedo a perder y reequilibrar tu sostén",
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
        mystic: "hay una energía de autonomía bien ganada que pide disfrutarse con presencia",
        psychological: "hay independencia y logros, junto con necesidad de sostenerlos con equilibrio interno",
        direct: "tienes logros, pero debes sostenerlos con orden y realismo",
      },
      reversed: {
        mystic: "se muestra una estabilidad aparente que todavía necesita asentarse por dentro",
        psychological: "aparece inseguridad detrás de una imagen de control o autosuficiencia",
        direct: "parece que todo está bajo control, pero la base sigue inestable",
      },
    },
  },
  "wands-03": {
    challenge: {
      upright: {
        mystic: "el paso siguiente se abre cuando confías en tu expansión sin dispersarte",
        psychological: "el reto está en sostener la visión a mediano plazo sin ansiedad",
        direct: "debes mirar más allá del corto plazo y sostener el plan",
      },
      reversed: {
        mystic: "la expansión se detiene porque la energía aún no está lista para abrir camino",
        psychological: "el bloqueo aparece al querer resultados sin una base interna suficientemente firme",
        direct: "quieres avanzar, pero todavía no ordenaste el punto de partida",
      },
    },
  },
  "pentacles-04": {
    advice: {
      upright: {
        mystic: "el consejo es contener antes de expandir: protege tu centro y fortalece tu base",
        psychological: "te conviene recuperar estructura, límites y seguridad antes de exigir avance",
        direct: "no fuerces crecimiento ahora: ordena, protege y estabiliza",
      },
      reversed: {
        mystic: "el consejo es aflojar la rigidez para que la energía vuelva a circular",
        psychological: "soltar exceso de control te ayudará a recuperar equilibrio",
        direct: "deja de apretar de más y reorganiza con flexibilidad",
      },
    },
  },
};

const closingByTone: Record<InterpretationTone, string> = {
  mystic: "Cuando la base se fortalece, el camino se abre con mayor armonía.",
  psychological: "Con una base más ordenada, tus decisiones se vuelven más claras y sostenibles.",
  direct: "Primero ordena la base; después, avanza con decisión.",
};

type QuickInterpretationInput = {
  spreadId: string;
  cards: SpreadInterpretationCard[];
  tone: InterpretationTone;
};

type QuickInterpretationOutput = {
  sections: Array<{
    title: string;
    icon?: string;
    content: string;
  }>;
  finalMessage: string;
  paragraphs?: string[];
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
    normalized.includes("nudo")
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
    normalized.includes("accion")
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

  if (index > 0) {
    return "challenge";
  }

  return "context";
}

function getRoleCard(cards: SpreadInterpretationCard[], role: InterpretationRole): SpreadInterpretationCard {
  const entries = cards.map((entry, index) => ({
    entry,
    role: detectRole(entry.position, index, cards.length),
  }));

  const exact = entries.find((item) => item.role === role)?.entry;
  if (exact) {
    return exact;
  }

  if (role === "context") {
    return cards[0];
  }
  if (role === "advice") {
    return cards[cards.length - 1];
  }
  return cards[Math.min(1, cards.length - 1)];
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
  if (tone === "mystic") {
    return "La lectura abre una secuencia energética clara:";
  }
  if (tone === "psychological") {
    return "La lectura muestra un patrón interno reconocible:";
  }
  return "La lectura es directa:";
}

function getCardReference(card: SpreadInterpretationCard): string {
  return `${card.card.nameEs}${card.reversed ? " invertida" : ""}`;
}

function getCardByPositionId(
  cards: SpreadInterpretationCard[],
  positionId: number,
): SpreadInterpretationCard | null {
  const found = cards.find((entry) => {
    if (typeof entry.position === "string") return false;
    return entry.position.id === positionId;
  });

  return found ?? null;
}

function buildCelticCrossInterpretation(
  cards: SpreadInterpretationCard[],
  tone: InterpretationTone,
): QuickInterpretationOutput {
  const situation = getCardByPositionId(cards, 1) ?? cards[0];
  const cross = getCardByPositionId(cards, 2) ?? cards[1] ?? cards[0];
  const root = getCardByPositionId(cards, 3) ?? cards[2] ?? cards[0];
  const conscious = getCardByPositionId(cards, 5) ?? cards[3] ?? cards[0];
  const nearFuture = getCardByPositionId(cards, 6) ?? cards[4] ?? cards[cards.length - 1];
  const result = getCardByPositionId(cards, 10) ?? cards[cards.length - 1];

  const general = [
    `${getOpeningByTone(tone)} en Situación actual aparece ${getCardReference(situation)}, que señala que ${getRolePhrase(
      situation,
      "context",
      tone,
    )}.`,
    `En la raíz, ${getCardReference(root)} muestra que ${getRolePhrase(root, "challenge", tone)}.`,
    `Tu meta consciente con ${getCardReference(conscious)} indica que ${getRolePhrase(
      conscious,
      "advice",
      tone,
    )}.`,
  ].join(" ");

  const blockage = `El cruce principal lo marca ${getCardReference(cross)}: ${getRolePhrase(
    cross,
    "challenge",
    tone,
  )}.`;

  const advice = `Para avanzar, el Futuro próximo con ${getCardReference(
    nearFuture,
  )} sugiere que ${getRolePhrase(
    nearFuture,
    "advice",
    tone,
  )}. El resultado con ${getCardReference(result)} confirma que ${getRolePhrase(
    result,
    "advice",
    tone,
  )}.`;

  return {
    sections: [
      {
        title: "Lectura general",
        icon: "✨",
        content: general,
      },
      {
        title: "Dónde está el bloqueo",
        icon: "🔒",
        content: blockage,
      },
      {
        title: "Consejo para avanzar",
        icon: "🔥",
        content: advice,
      },
    ],
    finalMessage: closingByTone[tone],
    paragraphs: [general, blockage, advice],
  };
}

export function getQuickInterpretation({
  spreadId,
  cards,
  tone,
}: QuickInterpretationInput): QuickInterpretationOutput {
  if (cards.length === 0) {
    return { sections: [], finalMessage: "", paragraphs: [] };
  }

  if (spreadId === "celtic-cross") {
    return buildCelticCrossInterpretation(cards, tone);
  }

  const contextCard = getRoleCard(cards, "context");
  const challengeCard = getRoleCard(cards, "challenge");
  const adviceCard = getRoleCard(cards, "advice");

  const contextPhrase = getRolePhrase(contextCard, "context", tone);
  const challengePhrase = getRolePhrase(challengeCard, "challenge", tone);
  const advicePhrase = getRolePhrase(adviceCard, "advice", tone);

  const introParagraph = `${getOpeningByTone(tone)} con ${getCardReference(contextCard)}: ${contextPhrase}.`;
  
  const challengeTitle = getPositionLabel(challengeCard.position);
  const challengeText = `${getCardReference(challengeCard)} indica que ${
    challengePhrase.charAt(0).toUpperCase() + challengePhrase.slice(1)
  }.`;
  
  const adviceTitle = getPositionLabel(adviceCard.position);
  const adviceText = `${getCardReference(adviceCard)} sugiere que ${
    advicePhrase.charAt(0).toUpperCase() + advicePhrase.slice(1)
  }.`;

  return {
    sections: [
      {
        title: "Lectura general",
        icon: "✨",
        content: introParagraph,
      },
      {
        title: `Dónde está el bloqueo / tensión principal`,
        icon: "⚡",
        content: `En la posición de ${challengeTitle}, ${challengeText.toLowerCase()}`,
      },
      {
        title: `Consejo para avanzar`,
        icon: "🧭",
        content: `Considerando tu posición de ${adviceTitle}, ${adviceText.toLowerCase()}`,
      }
    ],
    finalMessage: closingByTone[tone],
    paragraphs: [introParagraph, challengeText, adviceText],
  };
}

