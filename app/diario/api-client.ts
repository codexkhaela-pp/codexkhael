import type { JournalEntry } from "@/app/diario/types";

type ListResponse = {
  entries?: JournalEntry[];
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

export async function fetchJournalEntriesFromApi(): Promise<JournalEntry[]> {
  const response = await fetch("/api/diario/entries", {
    method: "GET",
    credentials: "same-origin",
  });

  if (!response.ok) {
    return [];
  }

  const data = await parseJson<ListResponse>(response);
  return Array.isArray(data.entries) ? data.entries : [];
}

export async function fetchJournalEntryByIdFromApi(id: string): Promise<JournalEntry | null> {
  const response = await fetch(`/api/diario/entries/${id}`, {
    method: "GET",
    credentials: "same-origin",
  });

  if (!response.ok) {
    return null;
  }

  const data = await parseJson<DetailResponse>(response);
  return data.entry ?? null;
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

  const data = await parseJson<DetailResponse>(response);
  if (!response.ok || !data.entry) {
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
