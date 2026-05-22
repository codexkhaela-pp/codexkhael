import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { resetIfNeeded } from "@/lib/usage/reset";
import { canUseAI } from "@/lib/usage/limits";
import { resolvePlanTier } from "@/lib/plans";

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

    const systemPrompt = `Eres un guía experto en Tarot (Codex Khael).
Tu tarea es profundizar en una lectura de tarot basándote en la interpretación base proporcionada por el sistema.
La IA NO reemplaza el motor base, SOLO amplía/profundiza la lectura existente.

Reglas:
- Responder en español usando un tono de guía empático y reflexivo, no sentencia absoluta.
- NO predecir el futuro de forma absoluta ni adivinar el destino cerrado.
- NO asustar al usuario. Usa un enfoque psicológico y constructivo.
- Profundizar sobre la interpretación base y respetar la orientación de las cartas y las posiciones.
- Tomar en cuenta la pregunta del consultante si existe.
- Si source = JOURNAL, tomar en cuenta el contexto de la bitácora.

Seguridad: "El tarot no predice el futuro de forma absoluta. Interpreta patrones simbólicos como herramienta de reflexión personal."

Tu respuesta DEBE ser obligatoriamente un JSON puro (sin formato markdown) con la siguiente estructura exacta:
{
  "aiSummary": "Un resumen profundo de 1 o 2 párrafos",
  "deepInterpretation": "Interpretación más profunda general por carta y en conjunto",
  "cardConnections": "Relaciones sutiles y dinámicas ocultas entre las cartas",
  "practicalAdvice": "Consejo práctico y accionable",
  "reflectionQuestions": ["Pregunta 1", "Pregunta 2", "Pregunta 3"],
  "warning": "El tarot no predice el futuro de forma absoluta. Interpreta patrones simbólicos como herramienta de reflexión personal."
}`;

    const userMessage = JSON.stringify(payload, null, 2);

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
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
    });

    if (!openAiRes.ok) {
      const errorData = await openAiRes.text();
      console.error("OpenAI Error:", errorData);
      return NextResponse.json({ error: "Error en el servicio de IA" }, { status: 502 });
    }

    const data = await openAiRes.json();
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);

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

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("AI Route Error:", err);
    return NextResponse.json({ error: "Error interno procesando la lectura AI" }, { status: 500 });
  }
}

/** Finds or creates a UserProfile for the given userId. Always returns a non-null profile. */
async function getOrCreateProfile(userId: string) {
  const existing = await prisma.userProfile.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.userProfile.create({ data: { userId } });
}
