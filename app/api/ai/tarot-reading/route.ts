import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { resetIfNeeded } from "@/lib/usage/reset";
import { canUseAI } from "@/lib/usage/limits";
import { resolvePlanTier } from "@/lib/plans";
import { canUseManualSpreadCardCount, canUseSpread, MANUAL_SPREAD_ID } from "@/lib/features";
import { tarotSpreads } from "@/src/data/tarotSpreads";
import { buildNarrativeContext, type CartaPosicionada, type NarrativeContext } from "@/lib/mentor-narrative-context";

type MentorOpenAiResponse = {
  respuesta_directa: string;
  punto_ciego: string;
  dinamica_profunda: string;
  factor_saboteador: string;
  oportunidad_real: string;
  consejo_mentor: string;
  accion_concreta: string;
  pregunta_transformadora: string;
  preferred_option: string;
  preferred_option_reason: string;
  alternative_option: string;
  alternative_option_risk: string;
  decision_signal: string;
  confidence_level: string;
};

type MentorApiResponse = {
  directAnswer: string;
  blindSpot: string;
  deepDynamic: string;
  mainRisk: string;
  realOpportunity: string;
  mentorAdvice: string;
  sevenDayAction: string;
  reflectionQuestion: string;
  preferredOption: string;
  preferredOptionReason: string;
  alternativeOption: string;
  alternativeOptionRisk: string;
  decisionSignal: string;
  confidenceLevel: string;
  warning: string;
};

const MENTOR_INVALID_RESPONSE_ERROR = "Mentor no pudo completar una lectura válida. Inténtalo nuevamente.";
const MENTOR_WARNING =
  "El tarot no predice el futuro de forma absoluta. Interpreta patrones simbólicos como herramienta de reflexión personal.";

class MentorServiceError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "MentorServiceError";
    this.status = status;
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "La IA no está configurada todavía." }, { status: 503 });
    }

    // ── Usage guard ────────────────────────────────────────────────────────────
    const profile = await getOrCreateProfile(user.id);
    const freshProfile = await resetIfNeeded(profile);

    const check = canUseAI(freshProfile);
    if (!check.allowed) {
      return NextResponse.json(
        { error: "LIMIT_REACHED", reason: check.reason, plan: resolvePlanTier(freshProfile.userPlan), limit: check.limit },
        { status: 403 }
      );
    }
    // ── End usage guard ────────────────────────────────────────────────────────

    const payload = await req.json();
    const plan = resolvePlanTier(freshProfile.userPlan);
    const spreadType = typeof payload.spreadType === "string" ? payload.spreadType : "";
    const cardCount = Array.isArray(payload.cards) ? payload.cards.length : 0;

    if (spreadType === MANUAL_SPREAD_ID) {
      if (!canUseManualSpreadCardCount(plan, cardCount)) {
        return NextResponse.json(
          {
            error: "FEATURE_NOT_ALLOWED",
            feature: "SPREAD",
            spreadType,
            requiredPlan: "BASIC",
          },
          { status: 403 }
        );
      }
    } else if (spreadType) {
      const resolvedSpreadId =
        tarotSpreads.find((spread) => spread.id === spreadType || spread.name === spreadType)?.id ?? spreadType;

      if (!canUseSpread(plan, resolvedSpreadId)) {
        return NextResponse.json(
          {
            error: "FEATURE_NOT_ALLOWED",
            feature: "SPREAD",
            spreadType: resolvedSpreadId,
            requiredPlan: "BASIC"
          },
          { status: 403 }
        );
      }
    }

    const systemPrompt = buildMentorSystemPrompt();

    const question = typeof payload.question === "string" && payload.question.trim() ? payload.question.trim() : null;
    const narrativeContext = buildNarrativeContext({
      question: question ?? "",
      spreadType,
      cards: buildNarrativeCards(payload),
    });

    if (process.env.NODE_ENV === "development") {
      console.log("[Mentor] domain:", narrativeContext.domain);
      console.log("[Mentor] intent:", narrativeContext.intent);
      console.log("[Mentor] primaryFocus:", narrativeContext.primaryFocus);
      console.log("[Mentor] isMultiDomain:", narrativeContext.isMultiDomain);
      console.log("[Mentor] domains:", narrativeContext.domains);
      console.log("[Mentor] pendulumMode:", narrativeContext.pendulumMode);
      console.log("[Mentor] pendulumContext:", narrativeContext.pendulumContext);
      console.log("[Mentor] decisionContext:", narrativeContext.decisionContext);
      console.log("[Mentor] dominantSuit:", narrativeContext.dominantSuit);
      console.log("[Mentor] dominantArcanaSignal:", narrativeContext.dominantArcanaSignal);
      console.log("[Mentor] narrativeTone:", narrativeContext.narrativeTone);
      console.log("[Mentor] dominantTheme:", narrativeContext.dominantTheme);
      console.log("[Mentor] dominantSubTheme:", narrativeContext.dominantSubTheme);
      console.log("[Mentor] thematicKeywords:", narrativeContext.thematicKeywords);
      console.log("[Mentor] thematicNarrativeSeed:", narrativeContext.thematicNarrativeSeed);
      console.log("[Mentor] freePositionContext:", narrativeContext.freePositionContext);
      console.log("[Mentor] relationshipMode:", narrativeContext.relationshipMode);
      console.log("[Mentor] relationshipContext:", narrativeContext.relationshipContext);
      console.log("[Mentor] dominantThemes:", narrativeContext.dominantThemes);
      console.log("[Mentor] secondaryThemes:", narrativeContext.secondaryThemes);
      console.log("[Mentor] spreadType:", spreadType);
      console.log("[Mentor] narrativeContext:", narrativeContext);
      console.log("[Mentor] roleMap:", narrativeContext.roleMap);
      console.log("[Mentor] narrativeAxes:", {
        dominantEnergy: narrativeContext.dominantEnergy,
        missingEnergy: narrativeContext.missingEnergy,
        turningPoint: narrativeContext.turningPoint,
        primaryAxis: narrativeContext.primaryAxis,
        secondaryAxis: narrativeContext.secondaryAxis,
        narrativeWarnings: narrativeContext.narrativeWarnings,
      });
      console.log("[Mentor] storySpine:", narrativeContext.storySpine);
    }

    const mentorInput = {
      question,
      domain: narrativeContext.domain,
      intent: narrativeContext.intent,
      primaryFocus: narrativeContext.primaryFocus,
      isMultiDomain: narrativeContext.isMultiDomain,
      domains: narrativeContext.domains,
      pendulumMode: narrativeContext.pendulumMode,
      pendulumContext: narrativeContext.pendulumContext ?? null,
      relationshipMode: narrativeContext.relationshipMode,
      relationshipContext: narrativeContext.relationshipContext ?? null,
      dominantThemes: narrativeContext.dominantThemes,
      secondaryThemes: narrativeContext.secondaryThemes,
      dominantSuit: narrativeContext.dominantSuit,
      dominantArcanaSignal: narrativeContext.dominantArcanaSignal,
      narrativeTone: narrativeContext.narrativeTone,
      dominantTheme: narrativeContext.dominantTheme,
      dominantSubTheme: narrativeContext.dominantSubTheme,
      thematicKeywords: narrativeContext.thematicKeywords,
      thematicNarrativeSeed: narrativeContext.thematicNarrativeSeed,
      forbiddenGenericDrift: narrativeContext.forbiddenGenericDrift,
      freePositionContext: narrativeContext.freePositionContext ?? null,
      decisionContext: narrativeContext.decisionContext ?? null,
      spreadType: spreadType || null,
      narrativeContext,
      keyCards: narrativeContext.keyCards,
      supportCards: narrativeContext.supportCards,
      localReadingContext: {
        ya_fue_mostrado_al_usuario: true,
        instruccion: "Usa este contexto solo como evidencia base. No copies ni repitas estos textos.",
        resumen_general: getNestedString(payload, ["baseInterpretation", "summary"]),
        relaciones: getNestedString(payload, ["baseInterpretation", "connections"]),
        consejo_final: getNestedString(payload, ["baseInterpretation", "advice"]),
        tono_dominante: getNestedString(payload, ["baseInterpretation", "dominantTone"]),
      },
      instruccion_final:
        "No reconstruyas la tirada desde cero. Usa narrativeContext como mapa interpretativo obligatorio y devuelve exclusivamente los ocho campos JSON solicitados.",
    };

    const userMessage = JSON.stringify(mentorInput, null, 2);
    const firstParsed = await requestMentorPayload(apiKey, systemPrompt, userMessage);
    let mentorResponse = finalizeMentorResponse(normalizeMentorResponse(firstParsed), narrativeContext);
    let qualityCheck = validateMentorResponse(mentorResponse, narrativeContext);

    if (!qualityCheck.ok) {
      const repairPrompt = buildMentorSystemPrompt(qualityCheck.reason);
      const repairMessage = JSON.stringify(
        {
          ...mentorInput,
          control_calidad: {
            motivo_rechazo: qualityCheck.reason,
            recordatorio: "La pregunta tiene prioridad absoluta. Reescribe desde cero y usa las cartas solo como evidencia.",
          },
        },
        null,
        2
      );

      const repairedParsed = await requestMentorPayload(apiKey, repairPrompt, repairMessage);
      mentorResponse = finalizeMentorResponse(normalizeMentorResponse(repairedParsed), narrativeContext);
      qualityCheck = validateMentorResponse(mentorResponse, narrativeContext);
    }

    if (!mentorResponse) {
      console.error("Invalid Mentor response:", {
        reason: qualityCheck.reason || "No se pudo normalizar la respuesta de Mentor.",
        firstParsed,
      });
      return NextResponse.json({ error: MENTOR_INVALID_RESPONSE_ERROR }, { status: 502 });
    }

    if (!qualityCheck.ok) {
      console.warn("Mentor soft validation fallback:", {
        reason: qualityCheck.reason,
        question: narrativeContext.question,
        domain: narrativeContext.domain,
        intent: narrativeContext.intent,
      });
    }

    // Increment counter + log (only on success)
    await prisma.$transaction([
      prisma.userProfile.update({
        where: { id: freshProfile.id },
        data: { dailyAiCount: { increment: 1 } },
      }),
      prisma.usageLog.create({
        data: { userId: user.id, type: "AI", planSnapshot: resolvePlanTier(freshProfile.userPlan) },
      }),
    ]);

    return NextResponse.json(mentorResponse);
  } catch (err) {
    if (err instanceof MentorServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("AI Route Error:", err);
    return NextResponse.json({ error: "Error interno procesando la lectura AI" }, { status: 500 });
  }
}

function normalizeMentorResponse(value: unknown): MentorApiResponse | null {
  if (!isRecord(value)) {
    return null;
  }

  const output: MentorOpenAiResponse = {
    respuesta_directa: getRequiredString(value.respuesta_directa),
    punto_ciego: getRequiredString(value.punto_ciego),
    dinamica_profunda: getRequiredString(value.dinamica_profunda),
    factor_saboteador: getRequiredString(value.factor_saboteador),
    oportunidad_real: getRequiredString(value.oportunidad_real),
    consejo_mentor: getRequiredString(value.consejo_mentor),
    accion_concreta: getRequiredString(value.accion_concreta),
    pregunta_transformadora: getRequiredString(value.pregunta_transformadora),
    preferred_option: getRequiredString(value.preferred_option),
    preferred_option_reason: getRequiredString(value.preferred_option_reason),
    alternative_option: getRequiredString(value.alternative_option),
    alternative_option_risk: getRequiredString(value.alternative_option_risk),
    decision_signal: getRequiredString(value.decision_signal),
    confidence_level: getRequiredString(value.confidence_level),
  };

  const requiredCoreFields = [
    output.respuesta_directa,
    output.punto_ciego,
    output.dinamica_profunda,
    output.factor_saboteador,
    output.oportunidad_real,
    output.consejo_mentor,
    output.accion_concreta,
    output.pregunta_transformadora,
  ];

  if (requiredCoreFields.some((entry) => !entry)) {
    return null;
  }

  return {
    directAnswer: output.respuesta_directa,
    blindSpot: output.punto_ciego,
    deepDynamic: output.dinamica_profunda,
    mainRisk: output.factor_saboteador,
    realOpportunity: output.oportunidad_real,
    mentorAdvice: output.consejo_mentor,
    sevenDayAction: output.accion_concreta,
    reflectionQuestion: output.pregunta_transformadora,
    preferredOption: output.preferred_option,
    preferredOptionReason: output.preferred_option_reason,
    alternativeOption: output.alternative_option,
    alternativeOptionRisk: output.alternative_option_risk,
    decisionSignal: output.decision_signal,
    confidenceLevel: output.confidence_level,
    warning: MENTOR_WARNING,
  };
}

function finalizeMentorResponse(
  response: MentorApiResponse | null,
  narrativeContext: NarrativeContext
): MentorApiResponse | null {
  if (!response) {
    return null;
  }

  if (narrativeContext.pendulumMode && narrativeContext.pendulumContext) {
    return {
      ...response,
      directAnswer: toPendulumDisplaySignal(narrativeContext.pendulumContext.decisionSignal),
      decisionSignal: narrativeContext.pendulumContext.decisionSignal,
      confidenceLevel: narrativeContext.pendulumContext.confidenceLevel,
      preferredOption: "",
      preferredOptionReason: "",
      alternativeOption: "",
      alternativeOptionRisk: "",
    };
  }

  if (!narrativeContext.decisionContext) {
    return response;
  }

  const decisionContext = narrativeContext.decisionContext;
  const preferredLabel = `opcion ${decisionContext.preferredOption}`;
  const normalizedDirectAnswer = normalizeForMatch(response.directAnswer);
  const startsWithRequiredLead =
    normalizedDirectAnswer.startsWith(normalizeForMatch("La opcion mas favorecida es")) ||
    normalizedDirectAnswer.startsWith(normalizeForMatch("La opcion que actualmente muestra mayor potencial es"));

  return {
    ...response,
    directAnswer: startsWithRequiredLead
      ? response.directAnswer
      : `La opción más favorecida es ${preferredLabel}. ${response.directAnswer}`.trim(),
    preferredOption: decisionContext.preferredOption,
    preferredOptionReason: decisionContext.preferredOptionReason,
    alternativeOption: decisionContext.alternativeOption,
    alternativeOptionRisk: decisionContext.alternativeOptionRisk,
    decisionSignal: decisionContext.decisionSignal,
    confidenceLevel: decisionContext.confidenceLevel,
  };
}

function validateMentorResponse(
  response: MentorApiResponse | null,
  narrativeContext: NarrativeContext
): { ok: boolean; reason: string } {
  if (!response) {
    return { ok: false, reason: "La respuesta no devolvio los ocho campos requeridos." };
  }

  const directAnswer = normalizeForMatch(response.directAnswer);
  const combined = normalizeForMatch(
    [
      response.directAnswer,
      response.blindSpot,
      response.deepDynamic,
      response.mainRisk,
      response.realOpportunity,
      response.mentorAdvice,
      response.sevenDayAction,
      response.reflectionQuestion,
    ].join(" ")
  );

  if (narrativeContext.pendulumMode) {
    const pendulumCompliance = validatePendulumResponse(response, narrativeContext);
    if (!pendulumCompliance.ok) {
      return pendulumCompliance;
    }
  }

  const directMatches = findMatchedFocuses(narrativeContext.primaryFocus, directAnswer);
  if (!narrativeContext.pendulumMode && directMatches.length === 0) {
    return {
      ok: false,
      reason: `La respuesta directa no atiende el foco principal ${narrativeContext.primaryFocus.join(", ")} para la intención ${narrativeContext.intent}.`,
    };
  }

  const overallMatches = findMatchedFocuses(narrativeContext.primaryFocus, combined);
  const minimumMatches = narrativeContext.domain === "general" ? 1 : Math.min(2, narrativeContext.primaryFocus.length);
  if (overallMatches.length < minimumMatches) {
    return {
      ok: false,
      reason: `La lectura no desarrolla suficiente foco en ${narrativeContext.primaryFocus.join(", ")} para responder la pregunta "${narrativeContext.question}".`,
    };
  }

  if (narrativeContext.isMultiDomain) {
    const coveredDomains = findMatchedFocuses(narrativeContext.domains, combined);
    const requiredCoverage = narrativeContext.domains.length <= 3 ? narrativeContext.domains.length : narrativeContext.domains.length - 1;

    if (coveredDomains.length < requiredCoverage) {
      return {
        ok: false,
        reason: `La lectura multidominio no cubre suficientes areas. Cubiertas: ${coveredDomains.join(", ") || "ninguna"}. Esperadas: ${narrativeContext.domains.join(", ")}.`,
      };
    }

    if (coveredDomains.length <= 1 && coveredDomains.includes("personal_growth")) {
      return {
        ok: false,
        reason: "La lectura multidominio quedo reducida a crecimiento personal y no entrego panorama equilibrado.",
      };
    }
  }

  const dominantThemeMatches = findMatchedFocuses(
    [...narrativeContext.dominantThemes, ...narrativeContext.secondaryThemes],
    combined
  );
  const genericConceptHits = countGenericConceptHits(combined, narrativeContext.narrativeTone);
  const dominantSuitCoverage = narrativeContext.dominantSuit === "mixto"
    ? 1
    : findMatchedFocuses([narrativeContext.dominantSuit], combined).length;

  if (
    genericConceptHits >= 3 &&
    dominantThemeMatches.length < 2 &&
    dominantSuitCoverage === 0
  ) {
    return {
      ok: false,
      reason: `La lectura cae en conceptos abstractos repetitivos (${genericConceptHits}) sin sostenerse en los temas dominantes de la tirada (${narrativeContext.dominantThemes.join(", ")}).`,
    };
  }

  const themeLockCompliance = validateThemeLockCompliance(response, narrativeContext);
  if (!themeLockCompliance.ok) {
    return {
      ok: false,
      reason: themeLockCompliance.reason,
    };
  }

  const freePositionCompliance = validateFreePositionContextCompliance(response, narrativeContext);
  if (!freePositionCompliance.ok) {
    return {
      ok: false,
      reason: freePositionCompliance.reason,
    };
  }

  const relationshipCompliance = validateRelationshipContextCompliance(response, narrativeContext);
  if (!relationshipCompliance.ok) {
    return {
      ok: false,
      reason: relationshipCompliance.reason,
    };
  }

  if (!narrativeContext.pendulumMode) {
    const toneCompliance = buildToneComplianceReport(response, narrativeContext.narrativeTone);
    if (!toneCompliance.ok) {
      return {
        ok: false,
        reason: toneCompliance.reason,
      };
    }
  }

  if (narrativeContext.decisionContext) {
    const expectedOption = narrativeContext.decisionContext.preferredOption;
    const expectedAlternative = narrativeContext.decisionContext.alternativeOption;
    const expectedSignal = narrativeContext.decisionContext.decisionSignal;
    const expectedConfidence = narrativeContext.decisionContext.confidenceLevel;
    const decisionDirectAnswer = normalizeForMatch(response.directAnswer);

    if (!response.preferredOption || !response.preferredOptionReason || !response.alternativeOptionRisk) {
      return {
        ok: false,
        reason: "La tirada de decision no devolvio los campos estructurados obligatorios de comparacion.",
      };
    }

    if (response.preferredOption !== expectedOption) {
      return {
        ok: false,
        reason: `La respuesta eligio la opcion ${response.preferredOption}, pero el decisionContext favorece ${expectedOption}.`,
      };
    }

    if (response.decisionSignal !== expectedSignal) {
      return {
        ok: false,
        reason: `La respuesta no respetó la intensidad comparativa calculada (${expectedSignal}).`,
      };
    }

    if (response.alternativeOption !== expectedAlternative) {
      return {
        ok: false,
        reason: `La respuesta no identifico correctamente la alternativa secundaria (${expectedAlternative}).`,
      };
    }

    if (response.confidenceLevel !== expectedConfidence) {
      return {
        ok: false,
        reason: `La respuesta no respetó el nivel de confianza calculado (${expectedConfidence}).`,
      };
    }

    if (
      !decisionDirectAnswer.startsWith(normalizeForMatch("La opcion mas favorecida es")) &&
      !decisionDirectAnswer.startsWith(normalizeForMatch("La opcion que actualmente muestra mayor potencial es"))
    ) {
      return {
        ok: false,
        reason: "La respuesta directa de una tirada de decision debe comenzar tomando postura explicita.",
      };
    }

    if (!decisionDirectAnswer.includes(normalizeForMatch(`opcion ${expectedOption}`))) {
      return {
        ok: false,
        reason: `La respuesta directa no deja claro que la opcion preferida es ${expectedOption}.`,
      };
    }
  }

  return { ok: true, reason: "" };
}

function findMatchedFocuses(primaryFocus: string[], text: string): string[] {
  return primaryFocus.filter((focus) => {
    const terms = focusKeywords[focus] ?? [normalizeForMatch(focus)];
    return terms.some((term) => text.includes(normalizeForMatch(term)));
  });
}

function countGenericConceptHits(text: string, narrativeTone: string): number {
  const allowedGenericTerms = genericTermsAllowedByTone[narrativeTone] ?? [];
  return genericNarrativeTerms.reduce((count, term) => {
    if (allowedGenericTerms.includes(term)) {
      return count;
    }
    return count + (text.includes(term) ? 1 : 0);
  }, 0);
}

function buildToneComplianceReport(
  response: MentorApiResponse,
  narrativeTone: NarrativeContext["narrativeTone"]
): { ok: boolean; reason: string; totalScore: number } {
  const sections = [
    { label: "mensaje principal", text: response.directAnswer, minScore: 2 },
    { label: "tension central", text: response.deepDynamic, minScore: 2 },
    { label: "consejo mentor", text: response.mentorAdvice, minScore: 2 },
    { label: "accion concreta", text: response.sevenDayAction, minScore: 1.5 },
  ];

  const sectionScores = sections.map((section) => ({
    ...section,
    score: calculateToneComplianceScore(section.text, narrativeTone),
  }));

  const failedSection = sectionScores.find((section) => section.score < section.minScore);
  const totalScore = Math.round(sectionScores.reduce((sum, section) => sum + section.score, 0) * 10) / 10;
  const minimumTotalScore = 7.5;

  if (failedSection) {
    return {
      ok: false,
      reason: `La seccion "${failedSection.label}" no respeta el tono ${narrativeTone}. Score=${failedSection.score.toFixed(1)}.`,
      totalScore,
    };
  }

  if (totalScore < minimumTotalScore) {
    return {
      ok: false,
      reason: `El cumplimiento global del tono ${narrativeTone} es insuficiente. toneComplianceScore=${totalScore.toFixed(1)}.`,
      totalScore,
    };
  }

  return { ok: true, reason: "", totalScore };
}

function validateThemeLockCompliance(
  response: MentorApiResponse,
  narrativeContext: NarrativeContext
): { ok: boolean; reason: string } {
  const sections = [
    { label: "mensaje principal", text: response.directAnswer },
    { label: "tension central", text: response.deepDynamic },
    { label: "saboteador", text: response.mainRisk },
    { label: "oportunidad", text: response.realOpportunity },
    { label: "consejo mentor", text: response.mentorAdvice },
    { label: "accion concreta", text: response.sevenDayAction },
  ];

  const normalizedCombined = normalizeForMatch(sections.map((section) => section.text).join(" "));
  const thematicMatches = findMatchedFocuses(narrativeContext.thematicKeywords, normalizedCombined);
  const thematicKeywordHits = countMatchedKeywordHits(normalizedCombined, narrativeContext.thematicKeywords);
  const genericDriftHits = countMatchedKeywordHits(normalizedCombined, narrativeContext.forbiddenGenericDrift);
  const themedSections = sections.filter((section) => {
    const normalizedSection = normalizeForMatch(section.text);
    return findMatchedFocuses(narrativeContext.thematicKeywords, normalizedSection).length > 0;
  });
  const mainAxisSections = sections.filter((section) => {
    const normalizedSection = normalizeForMatch(section.text);
    const axisKeywords = themeAxisKeywords[narrativeContext.dominantTheme] ?? narrativeContext.thematicKeywords;
    return findMatchedFocuses(axisKeywords, normalizedSection).length > 0;
  });

  if (thematicMatches.length < 3) {
    return {
      ok: false,
      reason: `La lectura no sostiene suficiente Theme Lock ${narrativeContext.dominantTheme}. Solo aparecieron ${thematicMatches.length} thematicKeywords sobre ${narrativeContext.thematicKeywords.join(", ")}.`,
    };
  }

  if (themedSections.length < 2) {
    return {
      ok: false,
      reason: `El Theme Lock ${narrativeContext.dominantTheme} no atraviesa suficientes secciones principales. Solo cubre ${themedSections.length}.`,
    };
  }

  if (genericDriftHits > thematicKeywordHits) {
    return {
      ok: false,
      reason: `La lectura se desvia hacia lenguaje generico (${genericDriftHits}) por encima del eje tematico (${thematicKeywordHits}) para ${narrativeContext.dominantTheme}.`,
    };
  }

  if (mainAxisSections.length < 2) {
    return {
      ok: false,
      reason: `La lectura podria aplicarse a cualquier tirada porque el eje ${narrativeContext.dominantTheme} no queda claro en las secciones principales.`,
    };
  }

  return { ok: true, reason: "" };
}

function validateFreePositionContextCompliance(
  response: MentorApiResponse,
  narrativeContext: NarrativeContext
): { ok: boolean; reason: string } {
  const freePositionContext = narrativeContext.freePositionContext;
  if (!freePositionContext?.isFreeSpread) {
    return { ok: true, reason: "" };
  }

  const sections = [
    { label: "mensaje principal", text: response.directAnswer },
    { label: "tension central", text: response.deepDynamic },
    { label: "consejo mentor", text: response.mentorAdvice },
  ];
  const normalizedCombined = normalizeForMatch(
    [
      response.directAnswer,
      response.blindSpot,
      response.deepDynamic,
      response.mainRisk,
      response.realOpportunity,
      response.mentorAdvice,
      response.sevenDayAction,
      response.reflectionQuestion,
    ].join(" ")
  );
  const positionNames = freePositionContext.customPositions.map((position) => position.positionName);
  const positionTerms = buildFreePositionSubjectTerms(freePositionContext);
  const mentionedPositions = positionNames.filter((positionName) =>
    normalizedCombined.includes(normalizeForMatch(positionName))
  );

  if (mentionedPositions.length < 2) {
    return {
      ok: false,
      reason: `La tirada libre no menciona suficientes posiciones personalizadas. Detectadas: ${mentionedPositions.join(", ") || "ninguna"}.`,
    };
  }

  const interactionSections = sections.filter((section) => {
    const normalizedSection = normalizeForMatch(section.text);
    const mentions = positionNames.filter((positionName) => normalizedSection.includes(normalizeForMatch(positionName)));
    return mentions.length >= 2;
  });

  if (interactionSections.length < 1) {
    return {
      ok: false,
      reason: "La tirada libre no explica la interaccion entre posiciones personalizadas en ninguna seccion principal.",
    };
  }

  const advicePosition = freePositionContext.customPositions.find((position) => position.interpretedRole === "consejo");
  if (advicePosition) {
    const normalizedAdvice = normalizeForMatch(response.mentorAdvice);
    if (!normalizedAdvice.includes(normalizeForMatch(advicePosition.positionName))) {
      return {
        ok: false,
        reason: `Existe una posicion de consejo (${advicePosition.positionName}) pero Consejo de Mentor no deriva explicitamente de ella.`,
      };
    }
  }

  const cardNames = freePositionContext.customPositions
    .map((position) => position.cardName)
    .filter((cardName) => cardName.length > 0);
  const positionLedSections = sections.filter((section) =>
    countSentenceStartsWithTerms(section.text, positionTerms) > 0
  );
  const cardLedSections = sections.filter((section) =>
    countSentenceStartsWithTerms(section.text, cardNames) > 0
  );

  if (cardLedSections.length > 0) {
    return {
      ok: false,
      reason: `La tirada libre sigue priorizando la carta sobre la posicion. Secciones iniciadas desde nombres de cartas: ${cardLedSections.map((section) => section.label).join(", ")}.`,
    };
  }

  if (positionLedSections.length < 2) {
    return {
      ok: false,
      reason: "La tirada libre no sostiene suficientemente la narrativa desde posiciones. Al menos dos secciones principales deben abrir o apoyarse claramente en posiciones personalizadas.",
    };
  }

  const totalPositionMentions = countWholeTermMentions(normalizedCombined, positionTerms);
  const totalCardMentions = countWholeTermMentions(normalizedCombined, cardNames);
  if (totalCardMentions >= totalPositionMentions) {
    return {
      ok: false,
      reason: `La tirada libre sigue pareciendo una lectura de cartas sueltas. Referencias a posiciones: ${totalPositionMentions}. Referencias a cartas: ${totalCardMentions}.`,
    };
  }

  const temporalPositions = freePositionContext.customPositions.filter((position) => {
    const normalizedName = normalizeForMatch(position.positionName);
    return (
      normalizedName.includes("pasado") ||
      normalizedName.includes("presente") ||
      normalizedName.includes("futuro")
    );
  });
  if (temporalPositions.length >= 2) {
    const normalizedStory = normalizeForMatch(`${response.directAnswer} ${response.deepDynamic}`);
    const temporalMentions = temporalPositions.filter((position) =>
      normalizedStory.includes(normalizeForMatch(position.positionName))
    );
    if (temporalMentions.length < Math.min(temporalPositions.length, 3)) {
      return {
        ok: false,
        reason: "La tirada libre tiene estructura temporal pero la progresion pasado-presente-futuro no queda explicitamente desarrollada.",
      };
    }
  }

  return { ok: true, reason: "" };
}

function validateRelationshipContextCompliance(
  response: MentorApiResponse,
  narrativeContext: NarrativeContext
): { ok: boolean; reason: string } {
  const relationshipContext = narrativeContext.relationshipContext;
  if (!narrativeContext.relationshipMode || !relationshipContext) {
    return { ok: true, reason: "" };
  }

  const combined = normalizeForMatch(
    [
      response.directAnswer,
      response.blindSpot,
      response.deepDynamic,
      response.mainRisk,
      response.realOpportunity,
      response.mentorAdvice,
      response.sevenDayAction,
      response.reflectionQuestion,
    ].join(" ")
  );
  const sections = [
    { label: "mensaje principal", text: response.directAnswer },
    { label: "tension central", text: response.deepDynamic },
    { label: "consejo mentor", text: response.mentorAdvice },
  ];
  const { selfTerms, otherTerms, bondTerms, outcomeTerms } = buildRelationshipReferenceTerms(relationshipContext);
  const selfHits = countWholeTermMentions(combined, selfTerms);
  const otherHits = countWholeTermMentions(combined, otherTerms);
  const bondHits = countWholeTermMentions(combined, bondTerms);
  const directStartsWithBond = countSentenceStartsWithTerms(response.directAnswer, bondTerms) > 0;
  const directStartsWithSelf = countSentenceStartsWithTerms(response.directAnswer, selfTerms) > 0;
  const directStartsWithOther = countSentenceStartsWithTerms(response.directAnswer, otherTerms) > 0;
  const deepDynamicStartsWithBond = countSentenceStartsWithTerms(response.deepDynamic, bondTerms) > 0;
  const deepDynamicStartsWithSelf = countSentenceStartsWithTerms(response.deepDynamic, selfTerms) > 0;
  const deepDynamicStartsWithOther = countSentenceStartsWithTerms(response.deepDynamic, otherTerms) > 0;

  if (selfHits === 0 || otherHits === 0 || bondHits === 0) {
    return {
      ok: false,
      reason: "La lectura de relaciones debe diferenciar explicitamente tu energia, la otra persona y el vinculo.",
    };
  }

  if (!directStartsWithBond || directStartsWithSelf || directStartsWithOther) {
    return {
      ok: false,
      reason: "La respuesta principal de una tirada de relaciones debe comenzar desde el vinculo y no desde una persona.",
    };
  }

  const directBondHits = countWholeTermMentions(response.directAnswer, bondTerms);
  if (directBondHits === 0) {
    return {
      ok: false,
      reason: "La respuesta principal de una tirada de relaciones debe nombrar y desarrollar el vinculo como nucleo de la lectura.",
    };
  }

  const deepDynamicBondHits = countWholeTermMentions(response.deepDynamic, bondTerms);
  const deepDynamicSelfHits = countWholeTermMentions(response.deepDynamic, selfTerms);
  const deepDynamicOtherHits = countWholeTermMentions(response.deepDynamic, otherTerms);
  if (deepDynamicBondHits === 0) {
    return {
      ok: false,
      reason: "La seccion de tension central debe profundizar explicitamente en el vinculo.",
    };
  }

  if (!deepDynamicStartsWithBond || deepDynamicStartsWithSelf || deepDynamicStartsWithOther) {
    return {
      ok: false,
      reason: "La tension central de una tirada de relaciones debe explicarse desde el vinculo y no desde una persona.",
    };
  }

  if (deepDynamicBondHits < deepDynamicSelfHits || deepDynamicBondHits < deepDynamicOtherHits) {
    return {
      ok: false,
      reason: "La seccion principal desarrolla mas a una energia individual que al vinculo. El vinculo debe ser el corazon narrativo.",
    };
  }

  if (bondHits <= selfHits || bondHits <= otherHits) {
    return {
      ok: false,
      reason: `La lectura de relaciones no da suficiente peso al vinculo. Referencias vinculo=${bondHits}, tu energia=${selfHits}, otra persona=${otherHits}.`,
    };
  }

  const adviceBondHits = countWholeTermMentions(response.mentorAdvice, bondTerms);
  if (adviceBondHits === 0) {
    return {
      ok: false,
      reason: "El Consejo de Mentor en una tirada de relaciones debe derivarse del vinculo y no solo de una energia individual.",
    };
  }

  if (relationshipContext.likelyOutcome) {
    const outcomeSections = [
      response.directAnswer,
      response.deepDynamic,
      response.mentorAdvice,
    ].filter((section) => countWholeTermMentions(section, outcomeTerms) > 0 && countWholeTermMentions(section, bondTerms) > 0);
    const outcomeHits = countWholeTermMentions(
      normalizeForMatch(`${response.directAnswer} ${response.deepDynamic} ${response.mentorAdvice}`),
      outcomeTerms
    );
    if (outcomeHits === 0) {
      return {
        ok: false,
        reason: "La lectura de relaciones debe indicar hacia donde evoluciona el vinculo cuando existe posicion de resultado probable.",
      };
    }
    if (outcomeSections.length === 0) {
      return {
        ok: false,
        reason: "El resultado probable de una tirada de relaciones debe derivarse explicitamente del vinculo.",
      };
    }
  }

  const differentiatedSections = sections.filter((section) => {
    const normalizedSection = normalizeForMatch(section.text);
    return (
      countWholeTermMentions(normalizedSection, selfTerms) > 0 &&
      countWholeTermMentions(normalizedSection, otherTerms) > 0 &&
      countWholeTermMentions(normalizedSection, bondTerms) > 0
    );
  });
  if (differentiatedSections.length === 0) {
    return {
      ok: false,
      reason: "La lectura de relaciones no muestra en ninguna seccion principal la secuencia tu energia / otra persona / vinculo.",
    };
  }

  return { ok: true, reason: "" };
}

function validatePendulumResponse(
  response: MentorApiResponse,
  narrativeContext: NarrativeContext
): { ok: boolean; reason: string } {
  const pendulumContext = narrativeContext.pendulumContext;
  if (!narrativeContext.pendulumMode || !pendulumContext) {
    return { ok: true, reason: "" };
  }

  const expectedSignal = pendulumContext.decisionSignal;
  const expectedDisplaySignal = toPendulumDisplaySignal(expectedSignal);
  const rawDirectAnswer = response.directAnswer.trim();
  const normalizedDirectAnswer = normalizeForMatch(rawDirectAnswer);
  const normalizedExpectedSignal = normalizeForMatch(expectedDisplaySignal);
  const signalTokens = ["si", "no", "tal vez"];

  if (normalizedDirectAnswer !== normalizedExpectedSignal) {
    return {
      ok: false,
      reason: `La tirada pendulo debe responder primero con ${expectedDisplaySignal} y sin narrativa adicional en respuesta_directa.`,
    };
  }

  if (signalTokens.every((token) => !normalizeForMatch(response.directAnswer).includes(token))) {
    return {
      ok: false,
      reason: "La tirada pendulo no contiene una decision valida: SI, NO o TAL VEZ.",
    };
  }

  const explanationLeadChecks = [
    response.blindSpot,
    response.deepDynamic,
    response.mainRisk,
    response.mentorAdvice,
  ].map((section) => normalizeForMatch(section));

  if (explanationLeadChecks.some((section) => section.startsWith("las cartas muestran") || section.startsWith("la energia indica") || section.startsWith("el panorama revela"))) {
    return {
      ok: false,
      reason: "La tirada pendulo no debe iniciar su explicacion con formulas narrativas antes de resolver SI/NO/TAL VEZ.",
    };
  }

  if (normalizeForMatch(response.decisionSignal) !== normalizeForMatch(expectedSignal)) {
    return {
      ok: false,
      reason: `decision_signal debe devolver ${expectedSignal} en tirada pendulo.`,
    };
  }

  if (expectedSignal !== "TAL_VEZ" && normalizeForMatch(`${response.blindSpot} ${response.deepDynamic}`).includes("tal vez")) {
    return {
      ok: false,
      reason: "La tirada pendulo responde de forma ambigua aunque el contexto ya inclina claramente la balanza.",
    };
  }

  return { ok: true, reason: "" };
}

function calculateToneComplianceScore(text: string, narrativeTone: NarrativeContext["narrativeTone"]): number {
  const normalizedText = normalizeForMatch(text);
  const keywords = toneKeywords[narrativeTone] ?? [];
  const uniqueMatches = keywords.filter((term) => normalizedText.includes(term));
  let score = uniqueMatches.length;

  const blockers = toneBlockers[narrativeTone] ?? [];
  for (const blocker of blockers) {
    if (normalizedText.includes(blocker)) {
      score -= 0.75;
    }
  }

  return Math.max(0, Math.round(score * 10) / 10);
}

function countMatchedKeywordHits(text: string, keywords: string[]): number {
  return keywords.reduce((count, keyword) => count + (text.includes(normalizeForMatch(keyword)) ? 1 : 0), 0);
}

function countWholeTermMentions(text: string, terms: string[]): number {
  const normalizedText = normalizeForMatch(text);
  const normalizedTerms = [...new Set(terms.map((term) => normalizeForMatch(term)).filter(Boolean))];

  return normalizedTerms.reduce((count, term) => {
    const regex = new RegExp(`(^|[^a-z0-9])${escapeRegex(term)}(?=$|[^a-z0-9])`, "g");
    const matches = normalizedText.match(regex);
    return count + (matches?.length ?? 0);
  }, 0);
}

function countSentenceStartsWithTerms(text: string, terms: string[]): number {
  const normalizedText = normalizeForMatch(text);
  const normalizedTerms = [...new Set(terms.map((term) => normalizeForMatch(term)).filter(Boolean))];

  if (!normalizedText || normalizedTerms.length === 0) {
    return 0;
  }

  const pattern = normalizedTerms
    .sort((left, right) => right.length - left.length)
    .map((term) => escapeRegex(term))
    .join("|");
  const regex = new RegExp(`(^|[.!?]\\s+|\\n+)(?:el\\s+|la\\s+|los\\s+|las\\s+)?(?:${pattern})(?=[\\s,:;])`, "g");

  let matches = 0;
  while (regex.exec(normalizedText) !== null) {
    matches += 1;
  }

  return matches;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildFreePositionSubjectTerms(
  freePositionContext: NonNullable<NarrativeContext["freePositionContext"]>
): string[] {
  const terms = freePositionContext.customPositions.flatMap((position) => {
    const normalizedName = normalizeForMatch(position.positionName);
    const roleTerms: string[] = [position.positionName];

    if (normalizedName.includes("pasado")) roleTerms.push("pasado");
    if (normalizedName.includes("presente")) roleTerms.push("presente");
    if (normalizedName.includes("futuro")) roleTerms.push("futuro");

    switch (position.interpretedRole) {
      case "consultante":
        roleTerms.push("consultante");
        break;
      case "vinculo":
        roleTerms.push("relacion", "vinculo");
        break;
      case "otra_persona":
        roleTerms.push("otra persona");
        break;
      case "trabajo":
        roleTerms.push("trabajo");
        break;
      case "dinero":
        roleTerms.push("dinero", "economia");
        break;
      case "bloqueo":
        roleTerms.push("bloqueo");
        break;
      case "consejo":
        roleTerms.push("consejo");
        break;
      case "resultado":
        roleTerms.push("resultado");
        break;
      case "miedo":
        roleTerms.push("miedo");
        break;
      default:
        break;
    }

    return roleTerms;
  });

  return [...new Set(terms.map((term) => term.trim()).filter(Boolean))];
}

function buildRelationshipReferenceTerms(
  relationshipContext: NonNullable<NarrativeContext["relationshipContext"]>
): {
  selfTerms: string[];
  otherTerms: string[];
  bondTerms: string[];
  outcomeTerms: string[];
} {
  const selfTerms = [
    relationshipContext.selfEnergy?.positionName ?? "",
    "tu energia",
    "tu parte",
    "consultante",
  ];
  const otherTerms = [
    relationshipContext.otherEnergy?.positionName ?? "",
    "otra persona",
    "otra parte",
    "la otra persona",
    "su energia",
    "su parte",
    "pareja",
  ];
  const bondTerms = [
    relationshipContext.relationshipBond?.positionName ?? "",
    "vinculo",
    "relacion",
    "dinamica",
    "entre ambos",
    "entre ustedes",
    "conexion",
  ];
  const outcomeTerms = [
    relationshipContext.likelyOutcome?.positionName ?? "",
    "resultado",
    "desenlace",
    "direccion del vinculo",
    "hacia donde evoluciona",
  ];

  return {
    selfTerms: [...new Set(selfTerms.map((term) => term.trim()).filter(Boolean))],
    otherTerms: [...new Set(otherTerms.map((term) => term.trim()).filter(Boolean))],
    bondTerms: [...new Set(bondTerms.map((term) => term.trim()).filter(Boolean))],
    outcomeTerms: [...new Set(outcomeTerms.map((term) => term.trim()).filter(Boolean))],
  };
}

function toPendulumDisplaySignal(signal: "SI" | "NO" | "TAL_VEZ"): "SI" | "NO" | "TAL VEZ" {
  return signal === "TAL_VEZ" ? "TAL VEZ" : signal;
}

async function requestMentorPayload(apiKey: string, systemPrompt: string, userMessage: string): Promise<unknown> {
  const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "mentor_reading",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: [
              "respuesta_directa",
              "punto_ciego",
              "dinamica_profunda",
              "factor_saboteador",
              "oportunidad_real",
              "consejo_mentor",
              "accion_concreta",
              "pregunta_transformadora",
              "preferred_option",
              "preferred_option_reason",
              "alternative_option",
              "alternative_option_risk",
              "decision_signal",
              "confidence_level",
            ],
            properties: {
              respuesta_directa: { type: "string" },
              punto_ciego: { type: "string" },
              dinamica_profunda: { type: "string" },
              factor_saboteador: { type: "string" },
              oportunidad_real: { type: "string" },
              consejo_mentor: { type: "string" },
              accion_concreta: { type: "string" },
              pregunta_transformadora: { type: "string" },
              preferred_option: { type: "string" },
              preferred_option_reason: { type: "string" },
              alternative_option: { type: "string" },
              alternative_option_risk: { type: "string" },
              decision_signal: { type: "string" },
              confidence_level: { type: "string" },
            },
          },
        },
      },
      temperature: 0.7,
      max_tokens: 1200,
    }),
  });

  if (!openAiRes.ok) {
    const errorData = await openAiRes.text();
    console.error("OpenAI Error:", errorData);
    throw new MentorServiceError("Error en el servicio de IA", 502);
  }

  const data = await openAiRes.json();
  const content = data?.choices?.[0]?.message?.content;

  try {
    return typeof content === "string" ? JSON.parse(content) : null;
  } catch (error) {
    console.error("Invalid Mentor JSON:", error);
    return null;
  }
}

function buildMentorSystemPrompt(qualityRepairReason?: string): string {
  const repairBlock = qualityRepairReason
    ? `

CORRECCION OBLIGATORIA:
- La respuesta anterior fue rechazada por control de calidad.
- Motivo: ${qualityRepairReason}
- Reescribe desde cero.
- No basta con hablar de emociones o procesos internos si no son el foco principal de la pregunta.
`
    : "";

  return `Actua como un mentor tarotista experto.

No reconstruyas la tirada desde cero.
Usa el NarrativeContext como mapa interpretativo obligatorio.
Tu tarea es convertir ese mapa en una lectura humana, elegante y premium.

El backend ya construyo una tesis interpretativa con dominio, cartas clave, cartas de apoyo, tema central, conflicto, contradiccion, riesgo, oportunidad y resultado probable.
No ignores ni reemplaces esa tesis.

REGLA CRITICA:
- La pregunta del consultante tiene prioridad absoluta.
- Interpreta en este orden: pregunta -> intent -> domain -> cartas -> respuesta.
- Toda interpretacion debe responder directamente la pregunta formulada.
- Las cartas son evidencia y contexto.
- Las cartas no reemplazan la respuesta.
- Si la pregunta es sobre dinero, habla principalmente de dinero.
- Si la pregunta es sobre trabajo, habla principalmente de trabajo.
- Si la pregunta es sobre salud, habla principalmente de salud.
- Si la pregunta es sobre relaciones, habla principalmente de relaciones.
- Evita desviar la lectura hacia emociones, vinculos o procesos internos cuando no sean el foco principal.

REGLA CRITICA PARA TIRADAS DE DECISION:
- Si existe decisionContext, la pregunta principal es determinar que opcion aparece mas favorecida.
- Debes comparar explicitamente las alternativas.
- No presentes ambas opciones como equivalentes cuando la narrativa incline la balanza hacia una de ellas.
- Debes indicar opcion mas favorecida, motivo principal, riesgo de la alternativa y que tan clara es la diferencia.
- La respuesta_directa debe comenzar con "La opcion mas favorecida es..." o "La opcion que actualmente muestra mayor potencial es...".
- Usa preferredOption, preferredOptionReason, alternativeOption, alternativeOptionRisk, decisionSignal y confidenceLevel como referencia obligatoria.

REGLA CRITICA PARA MULTIDOMINIO:
- Si isMultiDomain es true, no reduzcas la lectura a una sola area.
- Debes cubrir todas las areas indicadas en domains.
- La respuesta debe proporcionar un panorama equilibrado.
- No conviertas una lectura anual o panoramica en una lectura exclusiva de crecimiento personal, espiritualidad, emociones o dinero.
- Si domains viene vacio y isMultiDomain es true, prioriza este orden: work, money, love, health, personal_growth.

REGLA CRITICA PARA TEMAS DOMINANTES:
- Los temas dominantes extraidos del NarrativeContext tienen prioridad sobre interpretaciones abstractas genericas.
- Si la tirada esta dominada por Espadas, Copas, Bastos u Oros, la narrativa debe reflejar esa energia.
- Evita repetir conceptos como claridad, proposito, intuicion o crecimiento cuando no sean centrales en las cartas.
- Usa dominantThemes, secondaryThemes, dominantSuit y dominantArcanaSignal para que esta lectura suene especifica a esta tirada.

REGLA CRITICA DE THEME LOCK:
- El Theme Lock tiene prioridad sobre el tono narrativo.
- Antes de redactar, usa thematicNarrativeSeed como base obligatoria.
- Todas las secciones deben sostener dominantTheme y apoyarse en thematicKeywords.
- forbiddenGenericDrift no puede dominar la lectura.
- No escribas una lectura de coaching generica.
- respuesta_directa, dinamica_profunda, factor_saboteador, oportunidad_real, consejo_mentor y accion_concreta deben reflejar dominantTheme.

REGLA CRITICA PARA TIRADA LIBRE:
- Si freePositionContext.isFreeSpread es true, debes interpretar obligatoriamente cada carta desde su posicion personalizada.
- No leas las cartas como una tirada generica.
- La prioridad narrativa obligatoria es: 1. posicion 2. relacion entre posiciones 3. carta 4. significado tradicional.
- Debes interpretar primero la posicion, luego explicar que funcion cumple dentro de la historia y solo despues usar la carta como evidencia.
- La narrativa principal debe poder entenderse incluso si ocultaras los nombres de las cartas.
- Las posiciones personalizadas deben dominar la lectura.
- La posicion debe ser el sujeto principal de la frase.
- Redacta como "La relacion atraviesa...", "El trabajo requiere...", "El dinero muestra...", "El bloqueo surge porque..." o "La posicion Consejo indica...".
- Evita redactar como "El Diez de Espadas indica...", "El Siete de Espadas significa..." o "El Nueve de Bastos aconseja...".
- La carta solo puede aparecer como evidencia de la posicion, nunca como protagonista de la narrativa.
- Ninguna seccion principal puede comenzar nombrando una carta.
- No construyas la historia en formato carta -> significado.
- Construye la historia en formato posicion -> funcion -> carta que la respalda.
- Debes mencionar explicitamente el nombre de la posicion y explicar que aporta esa posicion a la historia.
- Usa freePositionContext.customPositions y freeSpreadNarrativeAxis como mapa obligatorio de interaccion.
- Si existen posiciones temporales como Pasado, Presente o Futuro, la progresion temporal debe quedar explicita.
- Si las posiciones son personalizadas, explica como interactuan entre si.
- respuesta_directa debe mencionar al menos dos posiciones personalizadas si existen.
- dinamica_profunda debe explicar como interactuan al menos dos posiciones.
- consejo_mentor debe derivarse de la posicion de Consejo si existe; si no existe, debe derivarse del eje completo de la tirada libre.

REGLA CRITICA PARA TIRADA DE RELACIONES:
- Si relationshipMode es true, la lectura debe diferenciar obligatoriamente: tu energia, la otra persona, el vinculo y el resultado probable.
- La jerarquia narrativa obligatoria es: 1. relationshipBond 2. selfEnergy 3. otherEnergy 4. likelyOutcome.
- Antes de analizar cualquier otra posicion, debes interpretar relationshipBond y extraer de relationshipContext.bondNarrativeCore: centralTheme, mainTension, centralLearning y bondDirection.
- La seccion mas extensa y profunda debe ser siempre la del vinculo.
- No mezcles consultante, otra persona y vinculo como si fueran una sola energia.
- El vinculo no es una carta mas: debe actuar como nucleo explicativo de toda la lectura.
- La lectura debe poder resumirse asi: todo lo demas existe para explicar lo que ocurre en el vinculo.
- Sigue esta secuencia obligatoria: 1. que ocurre realmente en el vinculo 2. como tu energia contribuye a esa dinamica 3. como la otra persona influye 4. por que el resultado probable deriva del vinculo 5. consejo.
- Debes responder que une a estas personas, que las separa, que patron sostiene la relacion, que tension central existe y que aprendizaje aparece.
- selfEnergy y otherEnergy solo pueden usarse como evidencia para explicar la dinamica del relationshipBond.
- La respuesta principal debe comenzar desde el vinculo, nunca desde tu energia ni desde la otra persona.
- La tension central debe explicarse desde el vinculo, no desde una persona aislada.
- El resultado final debe derivarse explicitamente del vinculo.

REGLA CRITICA PARA TIRADA PENDULO:
- Si pendulumMode es true, debes resolver primero una decision cerrada: SI, NO o TAL VEZ.
- La primera linea y todo el contenido de respuesta_directa debe contener exclusivamente: SI, NO o TAL VEZ.
- No puedes iniciar la lectura con "Las cartas muestran...", "La energia indica..." ni "El panorama revela...".
- La estructura obligatoria es: 1. respuesta directa 2. justificacion 3. matices 4. consejo.
- Usa pendulumContext.decisionSignal como ancla principal.
- Usa pendulumContext.justificationSeed, supportingRisk, supportingOpportunity y supportingAdvice solo para justificar la decision.
- Si pendulumContext.decisionSignal es SI o NO, evita responder de forma ambigua.

REGLA OBLIGATORIA DE TONO NARRATIVO:
- Usa narrativeTone como tono general de la lectura.
- narrativeTone tiene prioridad maxima.
- La narrativa debe escribirse desde el tono indicado. Si existe conflicto entre cartas individuales y narrativeTone, la redaccion debe seguir respetando narrativeTone.
- strategic: centra la lectura en decisiones, analisis, estrategia, prioridades, conflictos mentales y busqueda de verdad.
- emotional: centra la lectura en emociones, vinculos, necesidades afectivas, relaciones e integracion emocional.
- practical: centra la lectura en recursos, estabilidad, trabajo, dinero, resultados concretos y acciones medibles.
- dynamic: centra la lectura en iniciativa, movimiento, liderazgo, impulso, ejecucion y avance.
- transformational: centra la lectura en cambios de ciclo, aprendizajes profundos, reconfiguracion personal, evolucion y transformacion.

REGLAS DURAS:
- Responde la pregunta del usuario.
- Usa intent, domain y primaryFocus como prioridad de lectura.
- Si isMultiDomain es true, distribuye la lectura entre domains y evita concentrarte en una sola area.
- Si existe decisionContext, sigue su comparativa y no la contradigas.
- Si dominantThemes existe, construye primero desde esos temas antes de usar conceptos abstractos.
- Mantén el tono narrativo de narrativeTone a lo largo de toda la respuesta.
- Usa storySpine y los ejes narrativos como mapa principal.
- Usa coreTheme, mainConflict, mainContradiction, mainRisk, mainOpportunity y likelyOutcome solo como resumen de apoyo.
- Construye la lectura desde la historia completa de la tirada, no desde frases resumen.
- Prioriza storySpine, primaryAxis, secondaryAxis, dominantEnergy, missingEnergy, turningPoint y narrativeWarnings.
- Trabaja exclusivamente desde primaryAxis, secondaryAxis, storySpine, mainConflict, mainContradiction, mainRisk, mainOpportunity y likelyOutcome.
- Las cartas solo pueden mencionarse para ilustrar una conclusion narrativa ya establecida.
- No des consejos no sustentados por NarrativeContext.
- No recomiendes acciones que no deriven de NarrativeContext.
- No inventes consejos genericos.
- No interpretes como espiritual si el dominio es trabajo, dinero, salud o amor.
- No repitas el motor local.
- No expliques cartas una por una.
- No conviertas domainMeaning en definiciones de cartas; usalo como traduccion contextual.

PROHIBICIONES DE ESTRUCTURA:
- No construyas la lectura explicando cada carta por separado.
- No escribas parrafos del tipo "Carta A significa...", "Carta B representa..." o "Carta C indica...".
- No enumeres cartas como diccionario.
- No conviertas keyCards ni supportCards en una lista interpretativa.
- No abras bloques con significados individuales de cartas.
- La historia debe sentirse como una unica conversacion humana sobre el problema central de la lectura.

DATOS QUE RECIBES:
- question
- intent
- domain
- primaryFocus
- isMultiDomain
- domains
- pendulumMode
- pendulumContext
- pendulumContext.decisionSignal
- pendulumContext.confidenceLevel
- pendulumContext.answerCard
- pendulumContext.supportingRisk
- pendulumContext.supportingOpportunity
- pendulumContext.supportingAdvice
- pendulumContext.justificationSeed
- relationshipMode
- relationshipContext
- relationshipContext.selfEnergy
- relationshipContext.otherEnergy
- relationshipContext.relationshipBond
- relationshipContext.likelyOutcome
- relationshipContext.bondNarrativeCore
- relationshipContext.bondNarrativeCore.centralTheme
- relationshipContext.bondNarrativeCore.mainTension
- relationshipContext.bondNarrativeCore.centralLearning
- relationshipContext.bondNarrativeCore.bondDirection
- dominantThemes
- secondaryThemes
- dominantSuit
- dominantArcanaSignal
- narrativeTone
- dominantTheme
- dominantSubTheme
- thematicKeywords
- thematicNarrativeSeed
- forbiddenGenericDrift
- freePositionContext
- freePositionContext.customPositions
- freePositionContext.freeSpreadNarrativeAxis
- decisionContext
- spreadType
- narrativeContext completo
- narrativeContext.storySpine
- narrativeContext.primaryAxis
- narrativeContext.secondaryAxis
- narrativeContext.dominantEnergy
- narrativeContext.missingEnergy
- narrativeContext.turningPoint
- narrativeContext.narrativeWarnings
- keyCards principales
- supportCards de apoyo

USO DE CARTAS:
- keyCards y supportCards son evidencia secundaria, no la fuente principal de interpretacion.
- No derives conclusiones nuevas desde una carta aislada.
- Si mencionas una carta, debe ser para sostener una conclusion que ya exista en primaryAxis, secondaryAxis, storySpine, mainConflict, mainContradiction, mainRisk, mainOpportunity o likelyOutcome.

DISTRIBUCION OBLIGATORIA:

respuesta_directa:
- Responde directamente la pregunta.
- Si pendulumMode es true, devuelve exclusivamente SI, NO o TAL VEZ.
- Usa intent, primaryFocus, storySpine.currentState, storySpine.likelyEvolution y dominantEnergy.
- Usa dominantThemes y dominantSuit como base de tono si estan disponibles.
- Usa thematicNarrativeSeed como base y sosten dominantTheme en toda la respuesta.
- Usa narrativeTone para decidir el lenguaje narrativo dominante.
- Debe sentirse escrita desde narrativeTone, no solo mencionarlo.
- Si isMultiDomain es true, representa varias areas de domains dentro de la respuesta.
- Si relationshipMode es true, diferencia explicitamente tu energia, la otra persona, el vinculo y la direccion probable.
- Si relationshipMode es true, abre interpretando primero el vinculo desde relationshipContext.bondNarrativeCore.
- Si relationshipMode es true, el vinculo debe aparecer como nucleo principal de la respuesta.
- Si relationshipMode es true, la respuesta debe seguir la secuencia vinculo -> tu energia como contribucion -> otra persona como influencia -> resultado derivado.
- Si freePositionContext.isFreeSpread es true, menciona al menos dos posiciones personalizadas por nombre.
- Si freePositionContext.isFreeSpread es true, abre desde la posicion y no desde la carta.
- Si freePositionContext.isFreeSpread es true, la respuesta debe seguir la secuencia posicion -> funcion narrativa -> carta como evidencia.
- Si existe decisionContext, empieza indicando la opcion favorecida y la claridad de la balanza.
- Debe nombrar o desarrollar claramente el foco principal de la pregunta.
- Puedes usar coreTheme o likelyOutcome solo como sintesis secundaria.
- Debe ser una respuesta clara, no un resumen.
- Maximo 120 palabras.

punto_ciego:
- Muestra aquello que el consultante probablemente no esta viendo.
- Si pendulumMode es true, usa este bloque como justificacion breve de la decision cerrada.
- Usa missingEnergy, turningPoint y secondaryAxis.
- Si mencionas una carta unconscious, conscious o support, usala solo como evidencia de ese punto ciego.
- Maximo 110 palabras.

dinamica_profunda:
- Explica la historia central de la tirada.
- Si pendulumMode es true, usa este bloque para los matices que sostienen o condicionan SI/NO/TAL VEZ.
- Usa primaryAxis, secondaryAxis y storySpine completo.
- Debe sostener dominantTheme de forma obligatoria.
- Debe respetar narrativeTone de forma obligatoria.
- Si relationshipMode es true, esta debe ser la seccion mas profunda del vinculo.
- Si relationshipMode es true, desarrolla primero centralTheme, mainTension, centralLearning y bondDirection del vinculo.
- Si relationshipMode es true, desarrolla primero que ocurre entre ambos y usa tu energia y la otra persona solo como evidencia explicativa de esa dinamica.
- Si relationshipMode es true, la historia principal debe seguir teniendo sentido incluso si se quitan temporalmente las energias individuales.
- Si freePositionContext.isFreeSpread es true, explica como interactuan al menos dos posiciones personalizadas.
- Si freePositionContext.isFreeSpread es true, desarrolla la secuencia posicion -> relacion entre posiciones -> evidencia de cartas.
- Si freePositionContext.isFreeSpread es true y existen posiciones temporales, vuelve explicita la progresion entre Pasado, Presente y Futuro.
- Debe conectar la historia completa de la mesa, no explicar keyCards una por una.
- Debe sonar como una sola conversacion humana, no como analisis carta por carta.
- Maximo 150 palabras.

factor_saboteador:
- Muestra el patron destructivo especifico.
- Usa storySpine.whatBlocksIt, narrativeWarnings y las cartas con rol fear/outcome si existen.
- Debe sostener dominantTheme de forma obligatoria.
- Puedes usar mainRisk solo como apoyo si resume bien el mismo riesgo.
- Si relationshipMode es true, formula el sabotaje como un patron que daña el vinculo, no como un defecto aislado de una persona.
- Maximo 90 palabras.

oportunidad_real:
- Muestra la puerta real de evolucion.
- Usa storySpine.whatWantsToEmerge y storySpine.whatMustBeIntegrated.
- Debe sostener dominantTheme de forma obligatoria.
- Puedes usar mainOpportunity solo como sintesis secundaria.
- Si relationshipMode es true, formula la oportunidad como aprendizaje central del vinculo.
- No prometas resultados.
- Maximo 90 palabras.

consejo_mentor:
- Traduce la sabiduria practica de NarrativeContext.
- Si pendulumMode es true, este bloque debe actuar como consejo posterior a la decision, no como reemplazo de la decision.
- Usa turningPoint, mainRisk y mainOpportunity.
- Debe sostener dominantTheme de forma obligatoria.
- Debe respetar narrativeTone de forma obligatoria.
- Si relationshipMode es true, deriva el consejo desde el vinculo primero y desde las energias individuales despues.
- Si relationshipMode es true, usa bondDirection como base del consejo.
- Si freePositionContext.isFreeSpread es true y existe una posicion de Consejo, deriva el consejo desde esa posicion.
- Si freePositionContext.isFreeSpread es true, la posicion Consejo debe funcionar como sujeto o punto de apoyo del consejo, no la carta.
- El consejo debe nacer del punto de giro de la tirada, no de una recomendacion universal.
- No des consejos genericos.
- Maximo 100 palabras.

accion_concreta:
- Debe surgir directamente de turningPoint y storySpine.whatMustBeIntegrated.
- Debe sostener dominantTheme de forma obligatoria.
- Debe respetar narrativeTone de forma obligatoria.
- Debe ser observable, medible y ejecutable en 24 horas a 7 dias.
- No uses "hablen mas", "reflexiona" ni "comunicate".
- Maximo 80 palabras.

pregunta_transformadora:
- Debe confrontar missingEnergy o turningPoint.
- Debe incomodar y cuestionar la premisa de la pregunta.
- Maximo 35 palabras.

preferred_option:
- Si existe decisionContext, devuelve "A" o "B" segun la opcion mas favorecida.
- Si no existe decisionContext, devuelve "".

preferred_option_reason:
- Si existe decisionContext, resume por que esa opcion tiene mejor narrativa.
- Si no existe decisionContext, devuelve "".

alternative_option:
- Si existe decisionContext, devuelve la opcion secundaria ("A" o "B").
- Si no existe decisionContext, devuelve "".

alternative_option_risk:
- Si existe decisionContext, indica el riesgo principal de la alternativa secundaria.
- Si no existe decisionContext, devuelve "".

decision_signal:
- Si existe decisionContext, usa exactamente uno de estos valores: strongly_favors_a, favors_a, balanced, favors_b, strongly_favors_b.
- Si pendulumMode es true, usa exactamente uno de estos valores: SI, NO, TAL_VEZ.
- Si no existe decisionContext, devuelve "not_applicable".

confidence_level:
- Si existe decisionContext, usa exactamente uno de estos valores: high, medium, low.
- Si pendulumMode es true, usa exactamente uno de estos valores: high, medium, low.
- Si no existe decisionContext, devuelve "not_applicable".

REGLA DE NO REPETICION:
Cada bloque debe aportar algo distinto.
No repitas la misma idea en tension, sabotaje, consejo y accion.

VALIDACION INTERNA:
Antes de devolver el JSON, verifica:
1. ¿La pregunta fue respondida de forma directa?
2. ¿La respuesta mantiene prioridad absoluta sobre intent, domain y primaryFocus?
3. Si isMultiDomain es true, ¿la respuesta cubre las areas de domains de forma equilibrada?
4. ¿Se uso storySpine como mapa principal?
5. ¿Las conclusiones nacen de primaryAxis, secondaryAxis, storySpine, mainConflict, mainContradiction, mainRisk, mainOpportunity y likelyOutcome?
6. ¿Cada bloque aporta algo distinto?
7. ¿La respuesta evita repetir el motor local?
8. ¿La respuesta refleja dominantThemes, dominantSuit y narrativeTone sin caer en conceptos abstractos repetitivos?
9. ¿Theme Lock domina la lectura usando dominantTheme, thematicKeywords y thematicNarrativeSeed?
10. ¿Las secciones mensaje principal, tension central, consejo mentor y accion concreta cumplen realmente narrativeTone?
11. ¿Evita explicar cartas por separado o hacer una lista de significados?
12. Si freePositionContext.isFreeSpread es true, ¿la respuesta menciona posiciones personalizadas e interacciones reales entre ellas?
13. Si existe decisionContext, ¿la respuesta tomo postura clara y coincide con la opcion favorecida?
Si alguna respuesta es NO, reescribe antes de devolver.
No muestres esta evaluacion.${repairBlock}

Devuelve SOLO JSON valido con este formato exacto:
{
  "respuesta_directa": "",
  "punto_ciego": "",
  "dinamica_profunda": "",
  "factor_saboteador": "",
  "oportunidad_real": "",
  "consejo_mentor": "",
  "accion_concreta": "",
  "pregunta_transformadora": "",
  "preferred_option": "",
  "preferred_option_reason": "",
  "alternative_option": "",
  "alternative_option_risk": "",
  "decision_signal": "",
  "confidence_level": ""
}`;
}

const focusKeywords: Record<string, string[]> = {
  strategic: ["decision", "estrategia", "analisis", "prioridad", "verdad", "criterio", "conflicto mental"],
  emotional: ["emociones", "vinculos", "sentimientos", "afectividad", "relaciones", "afecto", "duelo"],
  practical: ["recursos", "estabilidad", "dinero", "trabajo", "resultados", "acciones concretas", "medible"],
  dynamic: ["accion", "iniciativa", "movimiento", "liderazgo", "ejecucion", "avance", "impulso"],
  transformational: ["cambio", "transicion", "ciclo", "aprendizaje", "evolucion", "transformacion", "reconfiguracion"],
  conflicto: ["conflicto", "choque", "friccion", "tension"],
  verdad: ["verdad", "hecho", "evidencia", "sinceridad"],
  decision: ["decision", "elegir", "corte", "criterio"],
  "tension mental": ["mental", "mente", "sobrecarga", "presion mental"],
  estrategia: ["estrategia", "plan", "calculo", "maniobra"],
  vinculos: ["vinculo", "lazo", "relacion", "union"],
  emociones: ["emocion", "emociones", "sentir", "afectivo"],
  reconciliacion: ["reconciliacion", "reencuentro", "acercamiento"],
  duelo: ["duelo", "perdida", "tristeza", "ausencia"],
  afectividad: ["afectividad", "cuidado", "ternura", "afecto"],
  recursos: ["recurso", "capital", "presupuesto", "ahorro"],
  estabilidad: ["estabilidad", "base", "seguridad", "sostener"],
  resultados: ["resultado", "fruto", "rendimiento", "concrecion"],
  seguridad: ["seguridad", "resguardo", "proteccion", "certeza material"],
  accion: ["accion", "movimiento", "ejecucion", "hacer"],
  impulso: ["impulso", "empuje", "arranque", "fuerza"],
  expansion: ["expansion", "crecimiento", "apertura", "avance"],
  liderazgo: ["liderazgo", "direccion", "mando", "iniciativa visible"],
  iniciativa: ["iniciativa", "primer paso", "arranque", "decision de actuar"],
  "proceso estructural": ["estructura", "ciclo", "reordenamiento", "proceso estructural"],
  "leccion central": ["leccion", "aprendizaje nuclear", "ensenanza", "tema central"],
  "cambio profundo": ["cambio profundo", "transformacion real", "giro de etapa", "mudanza interna"],
  reordenamiento: ["reordenamiento", "reacomodo", "ajuste de estructura", "nueva disposicion"],
  "umbral de etapa": ["umbral", "etapa", "paso de ciclo", "cierre y apertura"],
  fuego: ["accion", "movimiento", "impulso", "iniciativa", "expansion"],
  tierra: ["recursos", "estabilidad", "trabajo", "resultado", "seguridad"],
  agua: ["emociones", "vinculo", "afecto", "reconciliacion", "duelo"],
  aire: ["decision", "verdad", "conflicto", "estrategia", "mente"],
  mayor: ["leccion", "cambio profundo", "proceso estructural", "umbral", "reordenamiento"],
  mixto: ["panorama mixto", "varias energias", "combinacion", "cruce de temas"],
  work: ["trabajo", "laboral", "empleo", "empresa", "carrera", "profesion", "puesto", "jefe"],
  income: ["ingreso", "ingresos", "ganar", "ganancia", "facturacion", "ventas", "cobro"],
  money: ["dinero", "plata", "finanza", "econom", "rentable", "rentabilidad"],
  love: ["amor", "pareja", "relacion", "vinculo", "sentimental", "compromiso"],
  health: ["salud", "cuerpo", "bienestar", "recuperacion", "habito", "vitalidad"],
  personal_growth: ["energia", "camino", "proposito", "crecimiento personal", "aprendizaje", "evolucion", "direccion"],
  resources: ["recurso", "capital", "presupuesto", "ahorro", "flujo", "liquidez"],
  productivity: ["productividad", "estructura", "disciplina", "sistema", "eficiencia", "especializacion"],
  career: ["trabajo", "carrera", "puesto", "rol", "laboral"],
  employment: ["empleo", "empresa", "contrato", "cargo", "equipo", "jefe"],
  performance: ["desempeno", "rendimiento", "resultado", "habilidad", "mejora"],
  opportunities: ["oportunidad", "oportunidades", "apertura", "avance", "crecimiento"],
  relationship: ["relacion", "pareja", "vinculo", "amor"],
  communication: ["comunicacion", "dialogo", "conversacion", "mensaje"],
  commitment: ["compromiso", "acuerdo", "estabilidad", "continuidad"],
  stability: ["estabilidad", "base", "seguridad", "sostener"],
  wellbeing: ["salud", "bienestar", "cuerpo", "vitalidad"],
  habits: ["habito", "rutina", "descanso", "alimentacion", "constancia"],
  recovery: ["recuperacion", "sanacion", "mejoria", "reposo", "restablecer"],
  energy: ["energia", "desgaste", "agotamiento", "drenaje", "vitalidad"],
  boundaries: ["limite", "limites", "frontera", "carga", "proteccion"],
  project: ["proyecto", "negocio", "emprendimiento", "lanzamiento"],
  execution: ["ejecucion", "avance", "operacion", "implementacion"],
  travel: ["viaje", "mudanza", "traslado", "destino"],
  timing: ["momento", "timing", "tiempo", "fecha"],
  logistics: ["logistica", "documento", "ruta", "movimiento"],
  family: ["familia", "hogar", "casa", "convivencia"],
  support: ["apoyo", "soporte", "red", "alianza"],
  overview: ["panorama", "vision", "etapa", "situacion"],
  life: ["vida", "camino", "direccion", "momento"],
  challenges: ["desafio", "reto", "obstaculo", "bloqueo"],
};

const toneKeywords: Record<string, string[]> = {
  strategic: ["decision", "estrategia", "analisis", "prioridad", "verdad", "plan", "consecuencia", "criterio"],
  emotional: ["emociones", "emocion", "vinculos", "vinculo", "sentimientos", "afectividad", "relacion", "afecto", "integracion emocional"],
  practical: ["recursos", "estabilidad", "dinero", "trabajo", "resultados", "accion concreta", "medible", "ejecucion concreta", "sostener"],
  dynamic: ["accion", "movimiento", "iniciativa", "liderazgo", "avance", "impulso", "ejecucion", "arranque", "activar"],
  transformational: ["cambio", "transicion", "ciclo", "aprendizaje", "evolucion", "transformacion", "reconfiguracion", "giro de etapa"],
};

const toneBlockers: Record<string, string[]> = {
  strategic: ["afectividad", "emociones", "sentimientos"],
  emotional: ["estrategia", "planificacion", "verdad objetiva"],
  practical: ["intuicion", "proposito", "transformacion"],
  dynamic: ["espera", "pausa", "contemplacion excesiva"],
  transformational: ["ejecucion inmediata", "resultado inmediato"],
};

const themeAxisKeywords: Record<string, string[]> = {
  material_construction: ["recursos", "estabilidad", "trabajo", "dinero", "patrimonio", "resultados", "seguridad", "construccion"],
  mental_conflict: ["decision", "estrategia", "analisis", "verdad", "comunicacion", "conflicto", "tension mental", "prioridad"],
  emotional_bond: ["emociones", "vinculo", "afecto", "relacion", "sensibilidad", "duelo", "intimidad", "reconciliacion"],
  active_movement: ["accion", "impulso", "iniciativa", "liderazgo", "movimiento", "ejecucion", "avance", "deseo"],
  structural_transformation: ["ciclo", "cambio", "aprendizaje", "transformacion", "reordenamiento", "etapa", "destino", "leccion"],
  mixed_axis: ["recursos", "decision", "emociones", "accion", "cambio", "estabilidad"],
};

const genericNarrativeTerms = [
  "claridad",
  "intuicion",
  "proposito",
  "crecimiento personal",
  "evolucion",
  "transformacion",
  "crecimiento",
  "reflexion",
  "avanzar",
  "discernimiento",
];

const genericTermsAllowedByTone: Record<string, string[]> = {
  strategic: ["claridad"],
  emotional: [],
  practical: [],
  dynamic: [],
  transformational: ["evolucion", "transformacion"],
};

function buildNarrativeCards(payload: unknown): CartaPosicionada[] {
  const payloadRecord = isRecord(payload) ? payload : {};
  const baseInterpretation = isRecord(payloadRecord.baseInterpretation) ? payloadRecord.baseInterpretation : {};
  const cards = getRecordArray(payloadRecord.cards);
  const localCards = getRecordArray(baseInterpretation.cards);

  return cards.map((entry, index) => {
    const localCard = findLocalCard(localCards, entry, index);

    return {
      positionNumber: getNumber(entry.order) ?? index + 1,
      positionName:
        getCleanString(entry.positionName) ?? getCleanString(localCard?.positionName) ?? `Posición ${index + 1}`,
      cardName: getCleanString(entry.name) ?? getCleanString(localCard?.name) ?? "Carta no especificada",
      orientation: normalizeOrientation(entry.orientation ?? localCard?.orientation),
      baseMeaning: "",
    };
  });
}

function findLocalCard(
  localCards: Array<Record<string, unknown>>,
  entry: Record<string, unknown>,
  index: number
): Record<string, unknown> | null {
  const byIndex = localCards[index];
  if (byIndex) {
    return byIndex;
  }

  const entryName = normalizeForMatch(getCleanString(entry.name) ?? "");
  if (!entryName) {
    return null;
  }

  return localCards.find((card) => normalizeForMatch(getCleanString(card.name) ?? "") === entryName) ?? null;
}

function normalizeOrientation(value: unknown): CartaPosicionada["orientation"] {
  const orientation = getCleanString(value)?.toUpperCase();
  if (orientation === "REVERSED" || orientation === "INVERTIDA" || orientation === "INVERTIDO") {
    return "invertido";
  }
  return "derecho";
}

function getNestedString(source: unknown, path: string[]): string {
  let current = source;
  for (const key of path) {
    if (!isRecord(current)) {
      return "";
    }
    current = current[key];
  }
  return getCleanString(current) ?? "";
}

function getRecordArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function getRequiredString(value: unknown): string {
  return getCleanString(value) ?? "";
}

function getCleanString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned || null;
}

function getNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeForMatch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Finds or creates a UserProfile for the given userId. Always returns a non-null profile. */
async function getOrCreateProfile(userId: string) {
  const existing = await prisma.userProfile.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.userProfile.create({ data: { userId } });
}
