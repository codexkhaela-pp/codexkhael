const DEFAULT_TIMEOUT_MS = 45_000;
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_NUM_PREDICT = 350;
// Tarot local uses non-reasoning responses by default.
// If a future advanced-analysis endpoint needs reasoning, it must opt in explicitly.
const DEFAULT_THINK = false;
const DEFAULT_KEEP_ALIVE = "30m";
const NO_THINK_PREFIX = "/no_think\n";
const IS_DEV = process.env.NODE_ENV === "development";

export type OllamaGenerateOptions = {
  temperature?: number;
  num_predict?: number;
  maxTokens?: number;
  think?: boolean;
  keep_alive?: string;
  format?: "json";
  timeoutMs?: number;
};

export type OllamaRuntimeConfig = {
  enabled: boolean;
  baseUrl: string | null;
  model: string | null;
};

type OllamaApiResponse = {
  response?: unknown;
  error?: unknown;
  eval_count?: unknown;
  prompt_eval_count?: unknown;
  total_duration?: unknown;
  eval_duration?: unknown;
  prompt_eval_duration?: unknown;
};

export type OllamaGenerateResult = {
  answer: string;
  promptLength: number;
  generatedTokens: number | null;
  promptTokens: number | null;
  totalDurationMs: number | null;
  evalDurationMs: number | null;
  promptEvalDurationMs: number | null;
};

export class OllamaClientError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "OllamaClientError";
    this.code = code;
    this.status = status;
  }
}

export function getOllamaRuntimeConfig(): OllamaRuntimeConfig {
  return {
    enabled: process.env.OLLAMA_ENABLED === "true",
    baseUrl: process.env.OLLAMA_BASE_URL?.trim() || null,
    model: process.env.OLLAMA_MODEL?.trim() || null,
  };
}

function assertOllamaConfig(config: OllamaRuntimeConfig) {
  if (!config.enabled) {
    throw new OllamaClientError("La IA local no está habilitada.", "OLLAMA_DISABLED", 503);
  }

  if (!config.baseUrl || !config.model) {
    throw new OllamaClientError(
      "La configuración de Ollama está incompleta.",
      "OLLAMA_NOT_CONFIGURED",
      503,
    );
  }
}

function buildGenerateUrl(baseUrl: string): string {
  try {
    return new URL("/api/generate", baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).toString();
  } catch {
    throw new OllamaClientError("La URL base de Ollama no es válida.", "OLLAMA_NOT_CONFIGURED", 503);
  }
}

async function safeReadErrorBody(response: Response): Promise<string> {
  const raw = await response.text().catch(() => "");
  if (!raw) return "";

  try {
    const parsed = JSON.parse(raw) as OllamaApiResponse;
    if (typeof parsed.error === "string" && parsed.error.trim()) {
      return parsed.error.trim();
    }
  } catch {
    // Fall through to plain text.
  }

  return raw.trim();
}

/**
 * Cambiar de servidor o de modelo Ollama solo requiere actualizar:
 * OLLAMA_BASE_URL, OLLAMA_MODEL y OLLAMA_ENABLED en variables de entorno.
 */
function normalizeCount(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeDurationNsToMs(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? Math.round(value / 1_000_000) : null;
}

function buildPromptForOllama(prompt: string, think: boolean): string {
  if (think) {
    return prompt;
  }

  return prompt.startsWith(NO_THINK_PREFIX) ? prompt : `${NO_THINK_PREFIX}${prompt}`;
}

export async function generateWithOllama(
  prompt: string,
  options: OllamaGenerateOptions = {},
): Promise<string> {
  const result = await generateWithOllamaDetailed(prompt, options);
  return result.answer;
}

export async function generateWithOllamaDetailed(
  prompt: string,
  options: OllamaGenerateOptions = {},
): Promise<OllamaGenerateResult> {
  const config = getOllamaRuntimeConfig();
  assertOllamaConfig(config);
  const baseUrl = config.baseUrl!;
  const model = config.model!;

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const temperature = options.temperature ?? DEFAULT_TEMPERATURE;
  const numPredict = options.num_predict ?? options.maxTokens ?? DEFAULT_NUM_PREDICT;
  const think = options.think ?? DEFAULT_THINK;
  const keepAlive = options.keep_alive ?? DEFAULT_KEEP_ALIVE;
  const format = options.format;
  const finalPrompt = buildPromptForOllama(prompt, think);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(buildGenerateUrl(baseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt: finalPrompt,
        stream: false,
        think,
        keep_alive: keepAlive,
        ...(format ? { format } : {}),
        options: {
          temperature,
          num_predict: numPredict,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await safeReadErrorBody(response);
      const normalized = errorBody.toLowerCase();

      if (normalized.includes("model") && normalized.includes("not found")) {
        throw new OllamaClientError("El modelo configurado no existe en Ollama.", "OLLAMA_MODEL_NOT_FOUND", 503);
      }

      throw new OllamaClientError(
        errorBody || "Ollama devolvió una respuesta no válida.",
        "OLLAMA_REQUEST_FAILED",
        response.status >= 500 ? 502 : response.status,
      );
    }

    const data = (await response.json().catch(() => null)) as OllamaApiResponse | null;
    if (!data || typeof data.response !== "string" || !data.response.trim()) {
      throw new OllamaClientError("Ollama devolvió una respuesta vacía o inválida.", "OLLAMA_BAD_RESPONSE", 502);
    }

    const result = {
      answer: data.response.trim(),
      promptLength: finalPrompt.length,
      generatedTokens: normalizeCount(data.eval_count),
      promptTokens: normalizeCount(data.prompt_eval_count),
      totalDurationMs: normalizeDurationNsToMs(data.total_duration),
      evalDurationMs: normalizeDurationNsToMs(data.eval_duration),
      promptEvalDurationMs: normalizeDurationNsToMs(data.prompt_eval_duration),
    };

    if (IS_DEV) {
      console.info("[OLLAMA PERF]", {
        model,
        think,
        keep_alive: keepAlive,
        format: format ?? null,
        num_predict: numPredict,
        prompt_length: result.promptLength,
        eval_count: result.generatedTokens,
        eval_duration: result.evalDurationMs,
        total_duration: result.totalDurationMs,
      });
    }

    return result;
  } catch (error) {
    if (error instanceof OllamaClientError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new OllamaClientError("La consulta a Ollama excedió el tiempo de espera.", "OLLAMA_TIMEOUT", 504);
    }

    throw new OllamaClientError(
      "No fue posible conectar con el servidor de Ollama.",
      "OLLAMA_UNREACHABLE",
      503,
    );
  } finally {
    clearTimeout(timeout);
  }
}
