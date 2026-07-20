import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { getTodayDailyJournalEntry, saveTodayDailyJournalEntry } from "@/lib/daily-journal/service";
import { normalizeTimezone } from "@/lib/carta-del-dia/service";

export const runtime = "nodejs";

function getTimezoneFromRequest(request: Request): string {
  const url = new URL(request.url);
  return normalizeTimezone(url.searchParams.get("timezone"));
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const timezone = getTimezoneFromRequest(request);
    const entry = await getTodayDailyJournalEntry(user.id, timezone);
    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Error al obtener el diario energético:", error);
    return NextResponse.json({ error: "No se pudo obtener el diario energético." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const timezone = getTimezoneFromRequest(request);
    const body = (await request.json()) as {
      morningIntention?: string;
      experience?: string;
      manifestedAreas?: string[];
      intensity?: number | null;
      nightReflection?: string;
    };

    const entry = await saveTodayDailyJournalEntry(user.id, body, timezone);
    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Error al guardar el diario energético:", error);
    return NextResponse.json({ error: "No se pudo guardar el diario energético." }, { status: 500 });
  }
}
