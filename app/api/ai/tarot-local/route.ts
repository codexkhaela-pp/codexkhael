import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import {
  generateWithOllamaDetailed,
  getOllamaRuntimeConfig,
  OllamaClientError,
} from "@/lib/ai/ollama-client";
import {
  buildCardContext,
  formatCardCharBreakdown,
  isTarotScope,
  normalizeInput,
  type TarotCardData,
} from "@/lib/ai/tarot-official-context";
import { getTarotCardById } from "@/lib/tarot-data";

export const runtime = "nodejs";
const IS_DEV = process.env.NODE_ENV === "development";

type TarotLocalRequest = {
  question?: unknown;
  cardId?: unknown;
  scope?: unknown;
};

function buildPrompt(question: string, cardContext: string, scope: string): string {
  return `Eres Khael Tarotista.

Debes responder en espanol, en tono directo, claro, mistico y util.

Usa como fuente principal esta informacion oficial de Codex Khael:
${cardContext}

Pregunta del usuario:
${question}

Ambito solicitado:
${scope}

Reglas:
- No inventes informacion fuera del contexto si el contexto es suficiente.
- No menciones que estas usando JSON, RAG, base de datos ni modelo local.
- Responde de forma natural.
- Manten la respuesta alineada al ambito solicitado.`;
}

export async function POST(req: Request) {
  const endpointStartedAt = Date.now();
  let cardLookupMs = 0;
  let promptBuildMs = 0;
  let promptLength = 0;
  let ollamaCallMs = 0;
  let generatedTokens: number | null = null;
  let outcome = "success";

  try {
    const user = await getCurrentUser();
    const allowDevAiTest =
      process.env.NODE_ENV === "development" &&
      process.env.ALLOW_DEV_AI_TEST === "true";

    if (!user && !allowDevAiTest) {
      outcome = "unauthorized";
      return NextResponse.json(
        { success: false, error: "No autorizado." },
        { status: 401 },
      );
    }

    const body = (await req.json().catch(() => null)) as TarotLocalRequest | null;
    if (!body) {
      outcome = "invalid_body";
      return NextResponse.json(
        { success: false, error: "Body JSON invalido." },
        { status: 400 },
      );
    }

    const question = normalizeInput(body.question);
    const cardId = normalizeInput(body.cardId);
    const scope = body.scope;

    if (!question || !cardId || !isTarotScope(scope)) {
      outcome = "invalid_payload";
      return NextResponse.json(
        {
          success: false,
          error: "Debes enviar question, cardId y scope validos.",
        },
        { status: 400 },
      );
    }

    const cardLookupStartedAt = Date.now();
    const card = getTarotCardById(cardId) as TarotCardData;
    cardLookupMs = Date.now() - cardLookupStartedAt;
    if (!card) {
      outcome = "card_not_found";
      return NextResponse.json(
        { success: false, error: "Carta no encontrada." },
        { status: 404 },
      );
    }

    const cardContext = buildCardContext(card, scope);
    if (!cardContext) {
      outcome = "insufficient_context";
      return NextResponse.json(
        { success: false, error: "No hay contexto suficiente para esa carta o ambito." },
        { status: 422 },
      );
    }

    if (IS_DEV) {
      console.info(`[AI CONTEXT][tarot-local]\n${formatCardCharBreakdown(card)}`);
    }

    const promptBuildStartedAt = Date.now();
    const prompt = buildPrompt(question, cardContext, scope);
    promptBuildMs = Date.now() - promptBuildStartedAt;

    const ollamaCallStartedAt = Date.now();
    const result = await generateWithOllamaDetailed(prompt, {
      temperature: 0.7,
      num_predict: 700,
      think: false,
    });
    ollamaCallMs = Date.now() - ollamaCallStartedAt;
    promptLength = result.promptLength;
    generatedTokens = result.generatedTokens;
    const config = getOllamaRuntimeConfig();

    return NextResponse.json({
      provider: "ollama",
      model: config.model,
      answer: result.answer,
      success: true,
    });
  } catch (error) {
    outcome = error instanceof OllamaClientError ? error.code : "internal_error";

    if (error instanceof OllamaClientError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.status },
      );
    }

    console.error("Tarot local AI route error:", error);
    return NextResponse.json(
      { success: false, error: "Error interno procesando la consulta local." },
      { status: 500 },
    );
  } finally {
    if (IS_DEV) {
      console.info("[AI PERF][tarot-local]", {
        outcome,
        cardLookupMs,
        promptBuildMs,
        promptLength,
        ollamaCallMs,
        generatedTokens,
        totalEndpointMs: Date.now() - endpointStartedAt,
      });
    }
  }
}
