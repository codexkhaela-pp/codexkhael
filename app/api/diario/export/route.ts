import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { resolvePlanTier } from "@/lib/plans";
import { mapBitacoraEntryToJournalEntry } from "@/app/api/diario/_lib/bitacora-mapper";
import { generateReadingPdf } from "@/src/lib/pdf/generate-reading-pdf";
import { ReadingPdfData, ReadingPdfLocalInterpretation, ReadingPdfMentorInterpretation, ReadingPdfCard } from "@/src/lib/pdf/types";
import { JournalEntry } from "@/app/diario/types";

export const runtime = "nodejs";
export const maxDuration = 60; // Next.js serverless function max duration

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
    });
    const plan = resolvePlanTier(profile?.userPlan);
    
    // Validate plans (FREE blocks PDF)
    if (plan === "FREE") {
      return NextResponse.json(
        { error: "FEATURE_NOT_ALLOWED", feature: "EXPORT_PDF", requiredPlan: "BASIC" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { entryId } = body;
    
    if (!entryId) {
      return NextResponse.json({ error: "ID de entrada requerido" }, { status: 400 });
    }

    const rawEntry = await prisma.bitacoraEntry.findFirst({
      where: { id: entryId, userId: user.id },
      include: { reReadings: { orderBy: { createdAt: "asc" } } },
    });

    if (!rawEntry) {
      return NextResponse.json({ error: "Entrada no encontrada" }, { status: 404 });
    }

    const entry = mapBitacoraEntryToJournalEntry(rawEntry);

    // Map to normalized data contract
    const pdfData = mapJournalEntryToPdfData(entry, user.name || "Consultante", plan);

    // Generate PDF
    const pdfBuffer = await generateReadingPdf(pdfData);

    const safeFilename = `Lectura_Khael_${pdfData.consultantName}_${pdfData.spreadName}_${pdfData.date}`.replace(/[^a-zA-Z0-9_\-]/g, "_");

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFilename}.pdf"`
      },
    });

  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Error interno al generar el PDF. Tu lectura permanece guardada y puedes intentarlo nuevamente." },
      { status: 500 }
    );
  }
}

function mapJournalEntryToPdfData(entry: JournalEntry, fallbackName: string, plan: string): ReadingPdfData {
  const dateObj = new Date(entry.metadata.date);
  const formattedDate = isNaN(dateObj.getTime()) ? entry.metadata.date : dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  
  const rawSpread = entry.metadata.spreadType || entry.canvas.spreadType || "Libre";
  
  const cards: ReadingPdfCard[] = (entry.canvas.placements || []).map(p => ({
    cardId: p.cardId,
    name: p.cardName,
    imagePath: p.image,
    orientation: p.isReversed ? "invertida" : "derecha",
    positionName: p.positionName,
    order: p.order,
    x: p.x,
    y: p.y,
    rotation: (p as any).rotation || 0,
    width: (p as any).width,
    height: (p as any).height
  }));

  let localInterpretation: ReadingPdfLocalInterpretation | undefined;
  
  if (entry.reflection || entry.traditionalReading) {
    localInterpretation = {
      summary: entry.reflection.personalInterpretation,
      finalAdvice: entry.reflection.finalMessage,
      relationships: entry.traditionalReading?.cardRelationships,
      positions: entry.traditionalReading?.positionInterpretations?.map(pos => ({
        positionNumber: pos.positionNumber,
        positionName: pos.positionName,
        cardName: pos.cardName,
        orientation: pos.orientation,
        interpretation: pos.interpretation
      }))
    };
  }

  let mentorInterpretation: ReadingPdfMentorInterpretation | undefined;
  // Solo los usuarios PRO tienen mentor en PDF
  if (plan === "PRO" && entry.mentorReading) {
    mentorInterpretation = entry.mentorReading;
  }

  const consultantName = entry.metadata.consultantName || fallbackName;

  return {
    readingId: entry.id,
    spreadName: rawSpread,
    question: entry.metadata.question,
    consultantName,
    date: formattedDate,
    time: entry.metadata.time,
    
    coverTitle: "Tu lectura personalizada",
    coverSubtitle: "Una guía simbólica para comprender tu presente y orientar tus próximos pasos.",
    coverMessage: `Preparada para ${consultantName}`,
    
    cards,
    localInterpretation,
    mentorInterpretation
  };
}
