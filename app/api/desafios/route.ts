import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { normalizeChallengeType } from "@/lib/desafios/service";
import { tarotCards } from "@/src/data/tarotCards";

export const runtime = "nodejs";

function createPRNG(seedString: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedString.length; i++) {
    h = Math.imul(h ^ seedString.charCodeAt(i), 16777619);
  }
  return function () {
    let t = (h += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getDateKey(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getLocalMidnightUTC(
  tomorrowYear: number,
  tomorrowMonth: number,
  tomorrowDay: number,
  timezone: string
): Date {
  const utcDate = new Date(Date.UTC(tomorrowYear, tomorrowMonth - 1, tomorrowDay));

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });

  const parts = formatter.formatToParts(utcDate);
  const year = Number(parts.find((p) => p.type === "year")?.value ?? tomorrowYear);
  const month = Number(parts.find((p) => p.type === "month")?.value ?? tomorrowMonth);
  const day = Number(parts.find((p) => p.type === "day")?.value ?? tomorrowDay);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const second = Number(parts.find((p) => p.type === "second")?.value ?? 0);

  const localTimeMs = Date.UTC(year, month - 1, day, hour, minute, second);
  const utcTimeMs = utcDate.getTime();
  const offsetMs = localTimeMs - utcTimeMs;

  const targetLocalTimeMs = Date.UTC(
    tomorrowYear,
    tomorrowMonth - 1,
    tomorrowDay,
    0,
    0,
    0
  );
  return new Date(targetLocalTimeMs - offsetMs);
}

function getTemplatesForCard(card: any, orientation: string, keyword: string, position: number): string[] {
  const suit = card.suit;
  const isUpright = orientation === "UPRIGHT";
  const kw = keyword ? keyword.toLowerCase().trim() : "";

  if (position === 1) {
    if (suit === "wands") {
      return isUpright
        ? [
            `Se abre una fase de gran dinamismo e iniciativa vinculada a ${kw}`,
            `Surge la energía necesaria para emprender proyectos de ${kw}`,
            `Se inicia un camino cargado de pasión y creatividad hacia ${kw}`
          ]
        : [
            `Existe un estado de apatía o dispersión que frena tu ${kw}`,
            `Se experimentan bloqueos de energía o dudas sobre cómo canalizar tu ${kw}`,
            `Surge el riesgo de actuar con desmotivación por ${kw}`
          ];
    } else if (suit === "cups") {
      return isUpright
        ? [
            `Se presenta una apertura a nivel emocional y afectivo que trae ${kw}`,
            `Existe una armonía afectiva y paz interior profunda basada en ${kw}`,
            `Se desarrollan relaciones sinceras y de gran conexión en torno a ${kw}`
          ]
        : [
            `Existe un desequilibrio emocional que rompe la armonía esperada debido a ${kw}`,
            `Se experimenta inestabilidad emocional o desilusión afectiva ligada a ${kw}`,
            `Se presentan expectativas poco realistas que complican la situación de ${kw}`
          ];
    } else if (suit === "swords") {
      return isUpright
        ? [
            `Se inicia un periodo de claridad mental y toma de decisiones sobre ${kw}`,
            `Surge la necesidad de usar la verdad y la lógica objetiva ante ${kw}`,
            `Se establece un enfoque racional para resolver problemas de ${kw}`
          ]
        : [
            `Se presenta confusión mental o un fuerte conflicto interno debido a ${kw}`,
            `Existen preocupaciones excesivas que sabotean la tranquilidad por ${kw}`,
            `Se manifiesta una falta de comunicación objetiva o entendimiento sobre ${kw}`
          ];
    } else if (suit === "pentacles") {
      return isUpright
        ? [
            `Se establece una base de estabilidad material y logros prácticos en ${kw}`,
            `Se percibe el fruto del esfuerzo constante encaminado hacia ${kw}`,
            `Surge una oportunidad concreta de consolidación práctica gracias a ${kw}`
          ]
        : [
            `Existe una situación de inestabilidad económica o práctica debido a ${kw}`,
            `Se presenta la necesidad de reorganizar recursos y prioridades por ${kw}`,
            `Se manifiesta un estancamiento material o temor a la pérdida de ${kw}`
          ];
    } else { // major
      return isUpright
        ? [
            `Se inicia un proceso de cambio profundo y lección vital sobre ${kw}`,
            `Se manifiesta un llamado interior a conectar con el sentido de ${kw}`,
            `Surge una transformación espiritual que redefine tu camino hacia ${kw}`
          ]
        : [
            `Se experimenta cierta resistencia frente a un cambio necesario ligado a ${kw}`,
            `Existe un estancamiento interno debido a actitudes de ${kw}`,
            `Se percibe la necesidad de ordenar el caos y buscar guía sobre ${kw}`
          ];
    }
  } else if (position === 2) {
    if (suit === "wands") {
      return isUpright
        ? [
            `acompañado de una gran pasión y voluntad enfocada en ${kw}`,
            `impulsado por la motivación necesaria para actuar decididamente con ${kw}`,
            `desarrollado a través de acciones valientes e iniciativas firmes de ${kw}`
          ]
        : [
            `bloqueado por desmotivación o retrasos en tus iniciativas de ${kw}`,
            `acompañado de dudas que frenan tu capacidad de acción y causan ${kw}`,
            `complicado por el desgaste de energía en esfuerzos estériles por ${kw}`
          ];
    } else if (suit === "cups") {
      return isUpright
        ? [
            `enriquecido por una apertura emocional que une en torno a ${kw}`,
            `acompañado de una conexión afectiva sincera y profunda basada en ${kw}`,
            `fortalecido por un bienestar sentimental que irradia ${kw}`
          ]
        : [
            `debilitado por tensiones afectivas que impiden disfrutar de ${kw}`,
            `acompañado de bloqueos o miedos que complican la relación de ${kw}`,
            `afectado por expectativas frustradas en el plano afectivo de ${kw}`
          ];
    } else if (suit === "swords") {
      return isUpright
        ? [
            `guiado por un análisis lógico que aporta claridad sobre ${kw}`,
            `acompañado por una comunicación clara y transparente sobre ${kw}`,
            `reforzado por un enfoque racional que desarma conflictos de ${kw}`
          ]
        : [
            `obstaculizado por preocupaciones excesivas o dudas constantes sobre ${kw}`,
            `acompañado de malentendidos o falta de comunicación objetiva por ${kw}`,
            `bloqueado por un conflicto de ideas o rigidez mental en torno a ${kw}`
          ];
    } else if (suit === "pentacles") {
      return isUpright
        ? [
            `consolidado por avances concretos y orden en tus planes de ${kw}`,
            `acompañado por un crecimiento material y orden práctico de ${kw}`,
            `respaldado por la organización de tus recursos reales para lograr ${kw}`
          ]
        : [
            `complicado por reveses materiales temporales o imprevistos de ${kw}`,
            `frenado por un apego excesivo a la seguridad material que genera ${kw}`,
            `acompañado por la falta de recursos estables o desorganización de ${kw}`
          ];
    } else { // major
      return isUpright
        ? [
            `reforzado por un aprendizaje vital de gran trascendencia sobre ${kw}`,
            `acompañado de una evolución personal que madura tu visión de ${kw}`,
            `dinamizado por un cambio de ciclo que redefine tus prioridades sobre ${kw}`
          ]
        : [
            `marcado por dificultades temporales para integrar la lección de ${kw}`,
            `acompañado de ciclos repetitivos que dificultan el avance y traen ${kw}`,
            `frenado por cierta resistencia a soltar viejos patrones de ${kw}`
          ];
    }
  } else { // position 3
    if (suit === "wands") {
      return isUpright
        ? [
            `lo que finalmente conduce al éxito y expansión de proyectos de ${kw}`,
            `lo que culmina en el liderazgo de nuevas iniciativas de ${kw}`,
            `conduciendo a un desenlace dinámico y lleno de vitalidad en ${kw}`
          ]
        : [
            `lo que termina disipando tus esfuerzos o retrasando logros de ${kw}`,
            `lo que provoca un agotamiento final por falta de dirección en ${kw}`,
            `llevando a una dispersión de iniciativas que frena el avance de ${kw}`
          ];
    } else if (suit === "cups") {
      return isUpright
        ? [
            `lo que finalmente brinda plenitud del corazón y alegría por ${kw}`,
            `conduciendo a relaciones sólidas y armónicas a largo plazo basadas en ${kw}`,
            `lo que culmina en un estado de paz interior y satisfacción de ${kw}`
          ]
        : [
            `lo que termina provocando desilusión o inestabilidad afectiva por ${kw}`,
            `conduciendo a la necesidad de sanar heridas del pasado de ${kw}`,
            `lo que dificulta el cierre emocional y la tranquilidad debido a ${kw}`
          ];
    } else if (suit === "swords") {
      return isUpright
        ? [
            `lo que permite tomar una decisión madura, justa y firme sobre ${kw}`,
            `llevando a la resolución definitiva de un conflicto mental de ${kw}`,
            `lo que culmina en un entendimiento liberador y verdad sobre ${kw}`
          ]
        : [
            `lo que te mantiene atrapado en un laberinto de dudas sobre ${kw}`,
            `conduciendo a malentendidos o una ruptura por falta de claridad en ${kw}`,
            `lo que termina saboteando tu paz mental e intelectual debido a ${kw}`
          ];
    } else if (suit === "pentacles") {
      return isUpright
        ? [
            `lo que asegura el fruto de tus esfuerzos y estabilidad de ${kw}`,
            `llevando a la manifestación de mejoras materiales concretas en ${kw}`,
            `lo que culmina en un logro práctico y bienestar tangible de ${kw}`
          ]
        : [
            `lo que termina impidiendo una oportunidad práctica o material de ${kw}`,
            `conduciendo a pérdidas materiales o inseguridad en tus planes de ${kw}`,
            `lo que posterga la consolidación de tus proyectos económicos de ${kw}`
          ];
    } else { // major
      return isUpright
        ? [
            `lo que finalmente conduce a conectar con un propósito elevado de ${kw}`,
            `lo que abre la puerta a un renacer o despertar definitivo de ${kw}`,
            `conduciendo a un desenlace de plenitud e integración vital en ${kw}`
          ]
        : [
            `lo que posterga la resolución definitiva del aprendizaje de ${kw}`,
            `terminando en una fase de incertidumbre o estancamiento de ${kw}`,
            `lo que exige mayor introspección para destrabar el camino hacia ${kw}`
          ];
    }
  }
}

function getPositionMeaning(card: any, orientation: string, keyword: string, position: number, index: number): string {
  const templates = getTemplatesForCard(card, orientation, keyword, position);
  return templates[index] || templates[0];
}

function buildCorrectInterpretation(
  cards: { card: any; orientation: string; keyword: string }[],
  prng: () => number
): { fullText: string; parts: string[] } {
  const templateIdx1 = Math.floor(prng() * 3);
  const templateIdx2 = Math.floor(prng() * 3);
  const templateIdx3 = Math.floor(prng() * 3);

  const part1 = getPositionMeaning(cards[0].card, cards[0].orientation, cards[0].keyword, 1, templateIdx1);
  const part2 = getPositionMeaning(cards[1].card, cards[1].orientation, cards[1].keyword, 2, templateIdx2);
  const part3 = getPositionMeaning(cards[2].card, cards[2].orientation, cards[2].keyword, 3, templateIdx3);

  return {
    fullText: `${part1}, ${part2}, ${part3}.`,
    parts: [part1, part2, part3]
  };
}

function buildDistractorOptions(
  correctParts: string[],
  cards: { card: any; orientation: string; keyword: string }[],
  shuffledCards: any[],
  prng: () => number
): string[] {
  const correctCardIds = new Set(cards.map(c => c.card.id));
  const pool = shuffledCards.filter(c => !correctCardIds.has(c.id));

  // Find dc1 with a suit different from cards[0].card.suit
  const dc1 = pool.find(c => c.suit !== cards[0].card.suit) || pool[0];
  const do1 = prng() < 0.5 ? "UPRIGHT" : "REVERSED";
  const poolAfter1 = pool.filter(c => c.id !== dc1.id);

  // Find dc2 with a suit different from cards[1].card.suit
  const dc2 = poolAfter1.find(c => c.suit !== cards[1].card.suit) || poolAfter1[0];
  const do2 = prng() < 0.5 ? "UPRIGHT" : "REVERSED";
  const poolAfter2 = poolAfter1.filter(c => c.id !== dc2.id);

  // Find dc3 with a suit different from cards[2].card.suit
  const dc3 = poolAfter2.find(c => c.suit !== cards[2].card.suit) || poolAfter2[0];
  const do3 = prng() < 0.5 ? "UPRIGHT" : "REVERSED";

  const getKeywords = (c: any, o: string) => {
    const kStr = o === "UPRIGHT" ? c.keywordsUpright : c.keywordsReversed;
    if (!kStr) return ["claridad", "avance", "armonía"];
    return kStr.split(",").map((k: any) => k.trim()).filter(Boolean);
  };
  const pickKw = (c: any, o: string, p: () => number) => {
    const kws = getKeywords(c, o);
    const idx = Math.floor(p() * kws.length);
    return kws[idx] || kws[0];
  };

  const dkw1 = pickKw(dc1, do1, prng);
  const dkw2 = pickKw(dc2, do2, prng);
  const dkw3 = pickKw(dc3, do3, prng);

  const part1_inc = getPositionMeaning(dc1, do1, dkw1, 1, Math.floor(prng() * 3));
  const part2_inc = getPositionMeaning(dc2, do2, dkw2, 2, Math.floor(prng() * 3));
  const part3_inc = getPositionMeaning(dc3, do3, dkw3, 3, Math.floor(prng() * 3));

  const distA = `${part1_inc}, ${correctParts[1]}, ${correctParts[2]}.`;
  const distB = `${correctParts[0]}, ${part2_inc}, ${correctParts[2]}.`;
  const distC = `${correctParts[0]}, ${correctParts[1]}, ${part3_inc}.`;

  return [distA, distB, distC];
}

function matchesPosition(
  opt: string,
  card: any,
  orientation: string,
  keyword: string,
  position: number
): boolean {
  const templates = getTemplatesForCard(card, orientation, keyword, position);
  const optLower = opt.toLowerCase();
  return templates.some(t => optLower.includes(t.toLowerCase()));
}

function validateChallengeOptions(
  options: string[],
  correctIndex: number,
  cards: { card: any; orientation: string; keyword: string }[]
): boolean {
  if (options.length !== 4) return false;
  if (correctIndex < 0 || correctIndex > 3) return false;

  const card1 = cards[0].card;
  const orient1 = cards[0].orientation;
  const kw1 = cards[0].keyword;

  const card2 = cards[1].card;
  const orient2 = cards[1].orientation;
  const kw2 = cards[1].keyword;

  const card3 = cards[2].card;
  const orient3 = cards[2].orientation;
  const kw3 = cards[2].keyword;

  for (let i = 0; i < 4; i++) {
    const opt = options[i];
    const match1 = matchesPosition(opt, card1, orient1, kw1, 1);
    const match2 = matchesPosition(opt, card2, orient2, kw2, 2);
    const match3 = matchesPosition(opt, card3, orient3, kw3, 3);
    const matchesAll = match1 && match2 && match3;

    if (i === correctIndex) {
      if (!matchesAll) return false;
    } else {
      if (matchesAll) return false;
    }
  }

  // Check unique options to avoid duplicates
  const uniqueOptions = new Set(options);
  if (uniqueOptions.size !== 4) return false;

  // Forbidden patterns: check for card/suit names or codes
  const forbiddenPatterns = [
    "copas", "bastos", "espadas", "oros",
    "cups", "wands", "swords", "pentacles",
    "sota", "caballero", "reina", "rey",
    "page", "knight", "queen", "king",
    "ace", "as de", "dos de", "tres de", "cuatro de", "cinco de", "seis de", "siete de", "ocho de", "nueve de", "diez de",
    "major-", "wands-", "cups-", "swords-", "pentacles-",
    "1 de", "2 de", "3 de", "4 de", "5 de", "6 de", "7 de", "8 de", "9 de", "10 de",
    "11 de", "12 de", "13 de", "14 de"
  ];

  for (const opt of options) {
    const optLower = opt.toLowerCase();
    for (const pattern of forbiddenPatterns) {
      if (optLower.includes(pattern)) {
        return false;
      }
    }
    for (const tc of tarotCards) {
      const nameEsLower = tc.nameEs.toLowerCase();
      const nameEnLower = tc.nameEn.toLowerCase();
      if (optLower.includes(nameEsLower) || optLower.includes(nameEnLower)) {
        return false;
      }
    }
  }

  return true;
}

function generateDailyChallengeForUser(userId: string, fechaLocal: string) {
  const baseSeed = `${userId}-${fechaLocal}-DAILY`;
  let attempt = 0;

  while (true) {
    const seed = attempt === 0 ? baseSeed : `${baseSeed}-${attempt}`;
    const prng = createPRNG(seed);

    // Shuffle a copy of the cards array deterministically
    const shuffledCards = [...tarotCards];
    for (let i = shuffledCards.length - 1; i > 0; i--) {
      const j = Math.floor(prng() * (i + 1));
      const temp = shuffledCards[i];
      shuffledCards[i] = shuffledCards[j];
      shuffledCards[j] = temp;
    }

    // Pick the first 3 cards from the shuffled array
    const selectedCards = shuffledCards.slice(0, 3);

    // Determine orientation for each card
    const cardsJson = selectedCards.map((card) => {
      const orientation = prng() < 0.5 ? "UPRIGHT" : "REVERSED";
      return {
        cardId: card.id,
        orientation,
      };
    });

    // Get active keywords for each card
    const getKeywords = (card: typeof tarotCards[0], orientation: string) => {
      const kStr = orientation === "UPRIGHT" ? card.keywordsUpright : card.keywordsReversed;
      return kStr.split(",").map((k) => k.trim());
    };

    // Helper to pick a keyword deterministically using prng
    const pickKeyword = (card: typeof tarotCards[0], orientation: string) => {
      const keywords = getKeywords(card, orientation);
      const idx = Math.floor(prng() * keywords.length);
      return keywords[idx] || keywords[0];
    };

    const card1 = selectedCards[0];
    const card2 = selectedCards[1];
    const card3 = selectedCards[2];
    const orient1 = cardsJson[0].orientation;
    const orient2 = cardsJson[1].orientation;
    const orient3 = cardsJson[2].orientation;

    const kw1 = pickKeyword(card1, orient1);
    const kw2 = pickKeyword(card2, orient2);
    const kw3 = pickKeyword(card3, orient3);

    const cardsInput = [
      { card: card1, orientation: orient1, keyword: kw1 },
      { card: card2, orientation: orient2, keyword: kw2 },
      { card: card3, orientation: orient3, keyword: kw3 }
    ];

    // Build correct interpretation
    const correctResult = buildCorrectInterpretation(cardsInput, prng);
    const correctAnswer = correctResult.fullText;

    // Build three distractor options
    const distractors = buildDistractorOptions(correctResult.parts, cardsInput, shuffledCards, prng);

    // Shuffle options deterministically
    const options = [correctAnswer, ...distractors];
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(prng() * (i + 1));
      const temp = options[i];
      options[i] = options[j];
      options[j] = temp;
    }

    const correctIndex = options.indexOf(correctAnswer);

    // Validation check: exactly one option must be correct
    if (validateChallengeOptions(options, correctIndex, cardsInput)) {
      const formatOrient = (o: string) => (o === "UPRIGHT" ? "al derecho" : "invertida");
      const description = "Analiza la combinación de cartas y elige la interpretación correcta.";
      const explanation = `La tirada combina las energías de: 1. ${card1.nameEs} (${formatOrient(
        orient1
      )}) que aporta la vibración de ${kw1}. 2. ${card2.nameEs} (${formatOrient(
        orient2
      )}) que señala el influjo de ${kw2}. 3. ${card3.nameEs} (${formatOrient(
        orient3
      )}) que guía el desenlace hacia ${kw3}.`;

      return {
        cardsJson,
        questionText: "¿Cuál es la interpretación más adecuada?",
        correctAnswer,
        optionsJson: options,
        explanation,
        description,
      };
    }

    attempt++;
  }
}

export async function ensureChallengeIsNatural(challenge: any) {
  if (!challenge || !challenge.isDaily) {
    return challenge;
  }
  const firstQuestion = challenge.questions?.[0];
  if (!firstQuestion) return challenge;

  const cards = (firstQuestion.cardsJson as any) || [];
  if (!Array.isArray(cards) || cards.length === 0) return challenge;

  const tc1 = tarotCards.find(tc => tc.id === cards[0].cardId);
  const tc2 = tarotCards.find(tc => tc.id === cards[1].cardId);
  const tc3 = tarotCards.find(tc => tc.id === cards[2].cardId);

  if (!tc1 || !tc2 || !tc3) return challenge;

  // Check if it is the old format (either contains card names or uses the old templates)
  const hasCardNames = cards.some((c: any) => {
    const cardData = tarotCards.find(tc => tc.id === c.cardId);
    return cardData && firstQuestion.correctAnswer.toLowerCase().includes(cardData.nameEs.toLowerCase());
  });
  
  const hasTwoCommas = (firstQuestion.correctAnswer.match(/,/g) || []).length >= 2;
  const isOld = hasCardNames || !hasTwoCommas || firstQuestion.correctAnswer.includes("sugiere") || firstQuestion.correctAnswer.includes("matiz");

  // Check if current options are valid using the base seed
  const baseSeed = `${challenge.userId || ""}-${challenge.fechaLocal || ""}-DAILY`;
  const tempPrng = createPRNG(baseSeed);
  const shuffledCards = [...tarotCards];
  for (let i = shuffledCards.length - 1; i > 0; i--) {
    const j = Math.floor(tempPrng() * (i + 1));
    const temp = shuffledCards[i];
    shuffledCards[i] = shuffledCards[j];
    shuffledCards[j] = temp;
  }
  tempPrng(); // orient 1
  tempPrng(); // orient 2
  tempPrng(); // orient 3

  const getKeywords = (card: typeof tarotCards[0], orientation: string) => {
    const kStr = orientation === "UPRIGHT" ? card.keywordsUpright : card.keywordsReversed;
    return kStr.split(",").map((k) => k.trim());
  };

  const pickKeyword = (card: typeof tarotCards[0], orientation: string, prngInstance: () => number) => {
    const keywords = getKeywords(card, orientation);
    const idx = Math.floor(prngInstance() * keywords.length);
    return keywords[idx] || keywords[0];
  };

  const kw1 = pickKeyword(tc1, cards[0].orientation, tempPrng);
  const kw2 = pickKeyword(tc2, cards[1].orientation, tempPrng);
  const kw3 = pickKeyword(tc3, cards[2].orientation, tempPrng);

  const cardsInput = [
    { card: tc1, orientation: cards[0].orientation, keyword: kw1 },
    { card: tc2, orientation: cards[1].orientation, keyword: kw2 },
    { card: tc3, orientation: cards[2].orientation, keyword: kw3 }
  ];

  const correctIndex = firstQuestion.optionsJson ? firstQuestion.optionsJson.indexOf(firstQuestion.correctAnswer) : -1;
  const isValid = !isOld && correctIndex !== -1 && validateChallengeOptions(
    firstQuestion.optionsJson || [],
    correctIndex,
    cardsInput
  );

  if (!isValid) {
    let attempt = 0;
    while (true) {
      const seed = attempt === 0 ? baseSeed : `${baseSeed}-${attempt}`;
      const prng = createPRNG(seed);

      const shuffled = [...tarotCards];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(prng() * (i + 1));
        const temp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
      }

      prng(); // card 1
      prng(); // card 2
      prng(); // card 3

      const kw1_new = pickKeyword(tc1, cards[0].orientation, prng);
      const kw2_new = pickKeyword(tc2, cards[1].orientation, prng);
      const kw3_new = pickKeyword(tc3, cards[2].orientation, prng);

      const cardsInputNew = [
        { card: tc1, orientation: cards[0].orientation, keyword: kw1_new },
        { card: tc2, orientation: cards[1].orientation, keyword: kw2_new },
        { card: tc3, orientation: cards[2].orientation, keyword: kw3_new }
      ];

      const correctResult = buildCorrectInterpretation(cardsInputNew, prng);
      const newCorrectAnswer = correctResult.fullText;

      const distractors = buildDistractorOptions(correctResult.parts, cardsInputNew, shuffled, prng);

      const options = [newCorrectAnswer, ...distractors];
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(prng() * (i + 1));
        const temp = options[i];
        options[i] = options[j];
        options[j] = temp;
      }

      const newCorrectIdx = options.indexOf(newCorrectAnswer);

      if (validateChallengeOptions(options, newCorrectIdx, cardsInputNew)) {
        const formatOrient = (o: string) => (o === "UPRIGHT" ? "al derecho" : "invertida");
        const explanation = `La tirada combina las energías de: 1. ${tc1.nameEs} (${formatOrient(
          cards[0].orientation
        )}) que aporta la vibración de ${kw1_new}. 2. ${tc2.nameEs} (${formatOrient(
          cards[1].orientation
        )}) que señala el influjo de ${kw2_new}. 3. ${tc3.nameEs} (${formatOrient(
          cards[2].orientation
        )}) que guía el desenlace hacia ${kw3_new}.`;

        // Update in database
        await prisma.challengeQuestion.update({
          where: { id: firstQuestion.id },
          data: {
            correctAnswer: newCorrectAnswer,
            optionsJson: options,
            explanation: explanation,
          },
        });

        // Update in memory
        firstQuestion.correctAnswer = newCorrectAnswer;
        firstQuestion.optionsJson = options;
        firstQuestion.explanation = explanation;
        break;
      }
      attempt++;
    }
  }

  return challenge;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const type = normalizeChallengeType(url.searchParams.get("type"));
  const includeInactive = url.searchParams.get("includeInactive") === "true";
  const now = new Date();

  // Fetch user profile to get default timezone
  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
    select: { timezone: true },
  });
  const userTimezone = profile?.timezone || "America/Lima";

  const timezoneParam = url.searchParams.get("timezone");
  const timezone = timezoneParam || userTimezone;

  // Calculate local today key and tomorrow midnight reset time
  const todayKey = getDateKey(now, timezone);
  const [year, month, day] = todayKey.split("-").map(Number);

  const tomorrowDate = new Date(Date.UTC(year, month - 1, day));
  tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1);
  const tomYear = tomorrowDate.getUTCFullYear();
  const tomMonth = tomorrowDate.getUTCMonth() + 1;
  const tomDay = tomorrowDate.getUTCDate();

  const nextResetAt = getLocalMidnightUTC(tomYear, tomMonth, tomDay, timezone);

  // Retrieve or generate user's daily challenge for today
  let dailyChallenge = await prisma.challenge.findFirst({
    where: {
      userId: user.id,
      fechaLocal: todayKey,
      isDaily: true,
    },
    include: {
      questions: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!dailyChallenge) {
    const data = generateDailyChallengeForUser(user.id, todayKey);
    dailyChallenge = await prisma.challenge.create({
      data: {
        type: "DAILY",
        title: "Desafío Diario",
        description: data.description,
        difficulty: "Media",
        baseXp: 50,
        isDaily: true,
        isRepeatable: true,
        maxDailyXp: 50,
        userId: user.id,
        fechaLocal: todayKey,
        isActive: true,
        questions: {
          create: {
            order: 1,
            cardsJson: data.cardsJson,
            questionText: data.questionText,
            optionsJson: data.optionsJson,
            correctAnswer: data.correctAnswer,
            explanation: data.explanation,
          },
        },
      },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
      },
    });
  } else {
    dailyChallenge = await ensureChallengeIsNatural(dailyChallenge);
  }

  // Query other active challenges
  const otherChallenges = await prisma.challenge.findMany({
    where: {
      isDaily: false,
      ...(type && type !== "DAILY" ? { type } : {}),
      ...(includeInactive
        ? {}
        : {
            isActive: true,
            OR: [{ activeFrom: null }, { activeFrom: { lte: now } }],
            AND: [{ OR: [{ activeTo: null }, { activeTo: { gte: now } }] }],
          }),
    },
    include: {
      questions: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const showDaily = !type || type === "DAILY";
  const items = [];

  if (showDaily && dailyChallenge) {
    items.push({
      ...dailyChallenge,
      nextResetAt: nextResetAt.toISOString(),
      questionCount: dailyChallenge.questions.length,
    });
  }

  if (!type || type !== "DAILY") {
    items.push(
      ...otherChallenges.map((c) => ({
        ...c,
        questionCount: c.questions.length,
      }))
    );
  }

  return NextResponse.json({
    items,
  });
}
