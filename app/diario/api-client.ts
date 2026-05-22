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
