import type { JournalEntry } from "@/app/diario/types";
import { getJournalEntries, getJournalEntryById } from "@/app/diario/storage";

type ListResponse = {
  entries?: JournalEntry[];
  canCreateNew?: boolean;
  limitReason?: string | null;
  error?: string;
};

type DetailResponse = {
  entry?: JournalEntry;
  error?: string;
};

type RereadingResponse = {
  entry?: JournalEntry;
  rereading?: {
    id?: string;
    didComeTrue?: "si" | "no" | "parcial" | "pendiente";
  };
  error?: string;
};

type CreatePayload = {
  metadata: JournalEntry["metadata"];
  reflection: JournalEntry["reflection"];
  canvas: Omit<JournalEntry["canvas"], "placements"> & {
    placements: Array<
      JournalEntry["canvas"]["placements"][number] & {
        orientation?: "derecha" | "invertida";
        rotation?: number;
        meaningUsed?: string;
      }
    >;
  };
  flipStats: JournalEntry["flipStats"];
  flipEvents?: JournalEntry["flipEvents"];
  notes?: string;
  createdAt?: string;
};

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

export type FetchJournalEntriesResult = {
  entries: JournalEntry[];
  canCreateNew: boolean;
  limitReason: string | null;
};

export async function fetchJournalEntriesFromApi(): Promise<FetchJournalEntriesResult> {
  const fallback: FetchJournalEntriesResult = { entries: getJournalEntries(), canCreateNew: true, limitReason: null };
  try {
    const response = await fetch("/api/diario/entries", {
      method: "GET",
      credentials: "same-origin",
    });

    if (response.status === 401 || !response.ok) {
      return fallback;
    }

    const data = await parseJson<ListResponse>(response);
    const apiEntries = Array.isArray(data.entries) ? data.entries : [];

    return {
      entries: apiEntries.length > 0 ? apiEntries : getJournalEntries(),
      canCreateNew: data.canCreateNew ?? true,
      limitReason: data.limitReason ?? null
    };
  } catch {
    return fallback;
  }
}

export async function fetchJournalEntryByIdFromApi(id: string): Promise<JournalEntry | null> {
  try {
    const response = await fetch(`/api/diario/entries/${id}`, {
      method: "GET",
      credentials: "same-origin",
    });

    if (!response.ok) {
      return getJournalEntryById(id);
    }

    const data = await parseJson<DetailResponse>(response);
    return data.entry ?? getJournalEntryById(id);
  } catch {
    return getJournalEntryById(id);
  }
}

export async function createJournalEntryInApi(payload: CreatePayload): Promise<JournalEntry> {
  const response = await fetch("/api/diario/entries", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify(payload),
  });

  const data = await parseJson<DetailResponse & { requiredPlan?: string }>(response);
  if (!response.ok || !data.entry) {
    if (data.error === "FEATURE_NOT_ALLOWED") {
      const required = data.requiredPlan === "PRO" ? "Pro" : "Básico";
      throw new Error(`Esta tirada está disponible en el plan ${required}.`);
    }
    if (data.error === "LIMIT_REACHED") {
      throw new Error("LIMIT_REACHED");
    }
    throw new Error(data.error ?? "No se pudo guardar la entrada en base de datos");
  }

  return data.entry;
}

type CreateRereadingPayload = {
  didComeTrue?: "si" | "no" | "parcial" | "pendiente";
  comment?: string;
  reflection?: string;
  newInterpretation?: string;
  lessonLearned?: string;
};

export async function createRereadingInApi(entryId: string, payload: CreateRereadingPayload): Promise<JournalEntry> {
  const response = await fetch(`/api/diario/entries/${entryId}/rereadings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify(payload),
  });

  const data = await parseJson<RereadingResponse>(response);
  if (!response.ok || !data.entry) {
    throw new Error(data.error ?? "No se pudo guardar la relectura");
  }

  return data.entry;
}

export async function deleteJournalEntryInApi(id: string): Promise<void> {
  const response = await fetch(`/api/diario/entries/${id}`, {
    method: "DELETE",
    credentials: "same-origin",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Error al eliminar la entrada.");
  }
}

export async function exportJournalEntryToPdf(id: string): Promise<void> {
  const response = await fetch(`/api/diario/export`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ entryId: id }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (errorData.error === "FEATURE_NOT_ALLOWED") {
      throw new Error("Exportar en PDF está disponible en el plan Pro");
    }
    throw new Error(errorData.error || "Error al generar el PDF.");
  }

  // Assuming the response is a binary PDF
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  const dateStr = new Date().toISOString().split("T")[0];
  const shortId = id.substring(0, 8);
  a.download = `Lectura_Tarot_${dateStr}_${shortId}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
