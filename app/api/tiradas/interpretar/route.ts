import { NextResponse } from "next/server";
import { tarotCards } from "@/src/data/tarotCards";

export const runtime = "nodejs";

const numberMeanings: Record<number, string> = {
  1: "el inicio, las semillas de oportunidad y el potencial puro para sembrar algo nuevo",
  2: "la dualidad, el equilibrio, la cooperación y la necesidad de tomar una decisión meditada",
  3: "la autoexpresión, la expansión, el crecimiento creativo y el apoyo de otros",
  4: "la estructura, la consolidación, la estabilidad y la necesidad de bases sólidas",
  5: "los desafíos, el conflicto, la inestabilidad y la necesidad de adaptación al cambio",
  6: "el progreso, la armonía, la superación de crisis y el apoyo mutuo",
  7: "la paciencia, la evaluación estratégica, la reflexión antes de actuar y las opciones",
  8: "el movimiento acelerado, la disciplina constructiva, la maestría y la constancia",
  9: "la plenitud individual, el balance interno, la autosuficiencia y la madurez",
  10: "la culminación del ciclo, el legado, la realización o la sobrecarga de responsabilidades"
};

const suitKeywords: Record<string, { name: string; element: string; domain: string }> = {
  wands: { name: "Bastos", element: "Fuego", domain: "la acción, la pasión, la energía creativa y los proyectos" },
  cups: { name: "Copas", element: "Agua", domain: "las emociones, las relaciones afectivas, el sentir y la intuición" },
  swords: { name: "Espadas", element: "Aire", domain: "los procesos mentales, la comunicación, el conflicto racional y la toma de decisiones" },
  pentacles: { name: "Oros", element: "Tierra", domain: "los recursos materiales, el trabajo físico, el dinero y la estabilidad concreta" }
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question, cards } = body as {
      question: string | null;
      cards: Array<{
        cardId: string;
        name: string;
        orientation: "UPRIGHT" | "REVERSED";
        positionName: string | null;
        order: number;
      }>;
    };

    if (!cards || cards.length === 0) {
      return NextResponse.json(
        { error: "Coloca al menos una carta para interpretar." },
        { status: 400 }
      );
    }

    // Sort cards by their order of placement
    const sortedInputCards = [...cards].sort((a, b) => a.order - b.order);

    // Map and enrich cards with database details
    const enrichedCards = sortedInputCards.map((inputCard) => {
      const dbCard = tarotCards.find((c) => c.id === inputCard.cardId) || 
                     tarotCards.find((c) => c.nameEs.toLowerCase() === inputCard.name.toLowerCase());
      
      return {
        inputCard,
        dbCard
      };
    });

    // 1. Generate interpretations card-by-card
    const cardsInterps = enrichedCards.map(({ inputCard, dbCard }, index) => {
      if (!dbCard) {
        return {
          name: inputCard.name,
          orientation: inputCard.orientation === "UPRIGHT" ? "Derecha" : "Invertida",
          interpretation: `Carta no identificada en el mazo. Se interpreta en su posición con energía neutra.`
        };
      }

      const orientationLabel = inputCard.orientation === "UPRIGHT" ? "derecha" : "invertida";
      const keywords = inputCard.orientation === "UPRIGHT" ? dbCard.keywordsUpright : dbCard.keywordsReversed;
      
      let paragraph = "";
      
      if (dbCard.arcana === "major") {
        if (inputCard.orientation === "UPRIGHT") {
          paragraph = `La carta ${dbCard.nameEs} se presenta al derecho en el orden ${index + 1}. Como Arcano Mayor, ejerce un impacto de gran trascendencia, indicando que te encuentras ante fuerzas arquetípicas esenciales. Se vincula con: ${keywords}. Sugiere que tienes a tu favor la claridad y la energía vital para avanzar en esta área de forma consciente y empoderada.`;
        } else {
          paragraph = `La carta ${dbCard.nameEs} se manifiesta invertida en el orden ${index + 1}. Al ser un Arcano Mayor, advierte que la lección espiritual o el cambio asociado a este arquetipo está sufriendo una resistencia o bloqueo interno. Se asocia con: ${keywords}. Te invita a hacer una pausa, reflexionar sobre miedos o dependencias inconscientes, y asimilar este aprendizaje antes de dar el siguiente paso.`;
        }
      } else {
        const suitInfo = suitKeywords[dbCard.suit];
        const suitName = suitInfo ? suitInfo.name : "desconocido";
        const element = suitInfo ? suitInfo.element : "";
        
        let detailType = "";
        if (dbCard.rank) {
          const rankLabel = {
            page: "Sota (mensajero/aprendizaje)",
            knight: "Caballero (acción/ímpetu)",
            queen: "Reina (maestría emocional/receptividad)",
            king: "Rey (autoridad/liderazgo)"
          }[dbCard.rank];
          detailType = `la figura de corte ${rankLabel}`;
        } else if (typeof dbCard.number === "number") {
          detailType = `el número ${dbCard.number} (${numberMeanings[dbCard.number] || ""})`;
        }

        if (inputCard.orientation === "UPRIGHT") {
          paragraph = `El ${dbCard.nameEs} se muestra al derecho en el orden ${index + 1}. Pertenece a los Arcanos Menores, en el palo de ${suitName} (${element}), representando situaciones y dinámicas del día a día asociadas a ${suitInfo?.domain}. Conecta con ${detailType}. Su energía al derecho fluye de manera armónica, manifestándose a través de: ${keywords}.`;
        } else {
          paragraph = `El ${dbCard.nameEs} aparece en posición invertida en el orden ${index + 1}. Pertenece a los Arcanos Menores, en el palo de ${suitName} (${element}), apuntando a tensiones en ${suitInfo?.domain}. Conecta con ${detailType}. La inversión de esta carta resalta bloqueos cotidianos o un uso ineficiente de su potencial, reflejándose en: ${keywords}.`;
        }
      }

      // If structuredMeaning is available, append some flavor text
      if (dbCard.structuredMeaning) {
        const extraText = inputCard.orientation === "UPRIGHT" 
          ? dbCard.structuredMeaning.upright 
          : dbCard.structuredMeaning.reversed;
        if (extraText) {
          paragraph += ` En un plano más profundo: ${extraText}`;
        }
      }

      return {
        name: dbCard.nameEs,
        orientation: inputCard.orientation === "UPRIGHT" ? "Derecha" : "Invertida",
        interpretation: paragraph
      };
    });

    // 2. Count statistics for connections and summary
    let majorCount = 0;
    const suitCounts: Record<string, number> = { wands: 0, cups: 0, swords: 0, pentacles: 0 };
    let uprightCount = 0;
    let reversedCount = 0;

    enrichedCards.forEach(({ dbCard, inputCard }) => {
      if (inputCard.orientation === "UPRIGHT") {
        uprightCount++;
      } else {
        reversedCount++;
      }

      if (dbCard) {
        if (dbCard.arcana === "major") {
          majorCount++;
        } else {
          suitCounts[dbCard.suit] = (suitCounts[dbCard.suit] || 0) + 1;
        }
      }
    });

    const totalCards = cards.length;

    // Determine dominant elements
    let maxSuitVal = 0;
    let dominantSuits: string[] = [];
    Object.entries(suitCounts).forEach(([suit, count]) => {
      if (count > maxSuitVal) {
        maxSuitVal = count;
        dominantSuits = [suit];
      } else if (count === maxSuitVal && count > 0) {
        dominantSuits.push(suit);
      }
    });

    const isMajorDominant = majorCount > maxSuitVal && majorCount >= Math.ceil(totalCards / 2);

    // 3. Construct Connections Section
    let connectionsText = "";
    if (isMajorDominant) {
      connectionsText = `Se observa una fuerte presencia de Arcanos Mayores (${majorCount} de ${totalCards}). Esto revela que la consulta está ligada a un cambio evolutivo mayor, lecciones kármicas o un momento de transición profunda, donde los detalles prácticos son secundarios frente al aprendizaje de vida.`;
    } else if (dominantSuits.length > 0 && maxSuitVal > 1) {
      const dominantsStr = dominantSuits.map(s => {
        const info = suitKeywords[s];
        return `${info?.name} (elemento ${info?.element}, asociado a ${info?.domain})`;
      }).join(" y ");
      connectionsText = `Se detecta una resonancia en el palo de ${dominantsStr}, mostrando que los aspectos emocionales, mentales o de acción representados por estos elementos son las fuerzas conductoras de tu situación actual.`;
    } else {
      connectionsText = `La tirada muestra una distribución diversa de palos y arcanos. La mezcla equilibrada de elementos (Fuego, Agua, Aire, Tierra) sugiere que la consulta involucra múltiples dimensiones de tu vida: proyectos, emociones, intelecto y estabilidad material. Ningún elemento se impone, requiriendo un balance consciente entre todos ellos.`;
    }

    // Check for matching numbers or court ranks
    const numberCounts: Record<number, number> = {};
    const rankCounts: Record<string, number> = {};
    enrichedCards.forEach(({ dbCard }) => {
      if (dbCard) {
        if (dbCard.number !== undefined) {
          numberCounts[dbCard.number] = (numberCounts[dbCard.number] || 0) + 1;
        }
        if (dbCard.rank) {
          rankCounts[dbCard.rank] = (rankCounts[dbCard.rank] || 0) + 1;
        }
      }
    });

    const repeatedNumbers = Object.entries(numberCounts).filter(([_, count]) => count > 1);
    const repeatedRanks = Object.entries(rankCounts).filter(([_, count]) => count > 1);

    if (repeatedNumbers.length > 0) {
      connectionsText += ` Adicionalmente, la repetición del número ${repeatedNumbers[0][0]} subraya un foco especial en ${numberMeanings[Number(repeatedNumbers[0][0])] || "este aspecto numérico"}.`;
    }
    if (repeatedRanks.length > 0) {
      const rankEs = { page: "Sotas", knight: "Caballeros", queen: "Reinas", king: "Reyes" }[repeatedRanks[0][0]] || repeatedRanks[0][0];
      connectionsText += ` La confluencia de múltiples ${rankEs} indica la presencia de fuertes rasgos de personalidad o influencias externas interactuando en tu entorno.`;
    }

    // 4. Construct Dominant Tone
    let dominantTone = "";
    if (isMajorDominant) {
      dominantTone = "Trascendencia y Evolución Espiritual";
    } else if (dominantSuits.length > 0) {
      const toneMap: Record<string, string> = {
        wands: "Iniciativa y Acción Vital",
        cups: "Flujo Emocional e Intuición",
        swords: "Claridad y Conflicto Mental",
        pentacles: "Estabilidad y Logro Material"
      };
      dominantTone = toneMap[dominantSuits[0]] || "Reflexión Integral";
    } else {
      dominantTone = "Búsqueda de Equilibrio y Enfoque Integral";
    }

    if (reversedCount > uprightCount) {
      dominantTone += " (Con Bloqueos e Introspección)";
    } else if (uprightCount > reversedCount) {
      dominantTone += " (Flujo Activo y Manifestación)";
    } else {
      dominantTone += " (Dinámica Neutra o en Reevaluación)";
    }

    // 5. Construct Summary
    const firstCardName = enrichedCards[0]?.dbCard?.nameEs || cards[0]?.name;
    const lastCardName = enrichedCards[totalCards - 1]?.dbCard?.nameEs || cards[totalCards - 1]?.name;
    const firstCardOrient = cards[0]?.orientation === "UPRIGHT" ? "derecha" : "invertida";
    const lastCardOrient = cards[totalCards - 1]?.orientation === "UPRIGHT" ? "derecha" : "invertida";

    let summary = `Para tu consulta ${question ? `sobre "${question}"` : "general"}, la tirada libre consta de ${totalCards} cartas colocadas en el canvas. La lectura plantea un recorrido energético que inicia con ${firstCardName} (${firstCardOrient}) y evoluciona hacia ${lastCardName} (${lastCardOrient}). `;

    if (reversedCount === totalCards) {
      summary += `La totalidad de las cartas están invertidas, lo que indica un fuerte llamado del Tarot a detener el movimiento externo. Tu respuesta no se encuentra afuera; estás en una fase donde los bloqueos, temores o retrasos son lecciones necesarias para reestructurar tus bases.`;
    } else if (uprightCount === totalCards) {
      summary += `Todas las cartas se muestran al derecho, lo que augura un flujo sumamente libre, expansivo y activo. Tienes vía libre para avanzar, y las circunstancias externas cooperan de manera directa con tu voluntad.`;
    } else {
      summary += `La tirada combina ${uprightCount} cartas al derecho y ${reversedCount} invertidas. Esto señala un escenario dinámico: hay áreas listas para manifestarse externamente, mientras que otras exigen una revisión interna, saneamiento de miedos o superación de obstáculos antes de consolidarse.`;
    }

    // 6. Construct Blockages
    let blockages = "";
    const reversedEnriched = enrichedCards.filter(({ inputCard }) => inputCard.orientation === "REVERSED");
    
    if (reversedEnriched.length > 0) {
      blockages = `El principal punto de resistencia se manifiesta en las cartas invertidas. `;
      reversedEnriched.forEach(({ dbCard }) => {
        if (dbCard) {
          const keywords = dbCard.keywordsReversed;
          blockages += `La presencia de ${dbCard.nameEs} invertida señala dificultades o fugas de energía relacionadas con: ${keywords}. `;
        }
      });
      // Check for swords specifically
      const swordCount = enrichedCards.filter(({ dbCard }) => dbCard?.suit === "swords").length;
      if (swordCount > 0) {
        blockages += `Además, la presencia del palo de Espadas sugiere tensiones, dudas constantes o una tendencia a sobreanalizar que podría alimentar la parálisis mental.`;
      }
    } else {
      blockages = `No se aprecian bloqueos severos ni resistencias manifiestas en las cartas de la tirada. Las energías están orientadas de manera productiva. El principal riesgo sería la complacencia o no actuar ante las oportunidades visibles.`;
    }

    // 7. Construct Advice
    const lastCardObj = enrichedCards[totalCards - 1]?.dbCard;
    const lastCardOrientValue = cards[totalCards - 1]?.orientation;
    
    let advice = "";
    if (lastCardObj) {
      const lastKeywords = lastCardOrientValue === "UPRIGHT" ? lastCardObj.keywordsUpright : lastCardObj.keywordsReversed;
      const pathText = lastCardOrientValue === "UPRIGHT" ? "apoyarte en la fuerza fluida de" : "desbloquear la energía contenida en";
      
      advice = `El consejo central del Tarot radica en la culminación de tu tirada libre. Se te sugiere ${pathText} ${lastCardObj.nameEs} (${lastCardOrientValue === "UPRIGHT" ? "al derecho" : "invertida"}), integrando aspectos de: ${lastKeywords}. `;
    } else {
      advice = "El Tarot te aconseja buscar equilibrio mental, pausar el impulso reactivo y analizar los recursos prácticos que tienes a tu disposición. ";
    }

    // Extra advice based on dominant element
    if (isMajorDominant) {
      advice += "Prioriza el crecimiento personal y asume esta etapa como un portal de aprendizaje espiritual; no fuerces resultados materiales inmediatos.";
    } else if (dominantSuits.includes("wands")) {
      advice += "Pon en marcha tus ideas. La clave es el movimiento físico, la iniciativa valiente y el entusiasmo constante.";
    } else if (dominantSuits.includes("cups")) {
      advice += "Escucha tu corazón y atiende tus relaciones. Sanar a nivel afectivo es el paso indispensable en este momento.";
    } else if (dominantSuits.includes("swords")) {
      advice += "Busca objetividad. Define tus límites con claridad, exprésate con honestidad y deshazte de los pensamientos obsesivos.";
    } else if (dominantSuits.includes("pentacles")) {
      advice += "Enfócate en lo tangible. Es tiempo de trabajar con constancia, cuidar tus recursos y dar pasos lentos pero firmes hacia la estabilidad.";
    }

    return NextResponse.json({
      summary,
      cards: cardsInterps,
      connections: connectionsText,
      dominantTone,
      blockages,
      advice
    });

  } catch (error) {
    console.error("Error en interpretación de tirada:", error);
    return NextResponse.json(
      { error: "Error interno al generar la interpretación." },
      { status: 500 }
    );
  }
}
