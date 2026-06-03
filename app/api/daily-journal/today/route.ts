import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { getTodayDailyJournalEntry, saveTodayDailyJournalEntry } from "@/lib/daily-journal/service";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const entry = await getTodayDailyJournalEntry(user.id);
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
    const body = (await request.json()) as {
      morningIntention?: string;
      experience?: string;
      manifestedAreas?: string[];
      intensity?: number | null;
      nightReflection?: string;
    };

    const entry = await saveTodayDailyJournalEntry(user.id, body);
    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Error al guardar el diario energético:", error);
    return NextResponse.json({ error: "No se pudo guardar el diario energético." }, { status: 500 });
  }
}
