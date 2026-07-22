import { NextRequest, NextResponse } from "next/server";
import { generateReadingPdf } from "@/src/lib/pdf/generate-reading-pdf";
import { ReadingPdfData, ReadingPdfCard } from "@/src/lib/pdf/types";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { tarotCards } from "@/src/data/tarotCards";


export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch commercial reading from DB
    const reading = await prisma.clientReading.findUnique({
      where: { id },
      include: {
        cards: {
          orderBy: { positionIndex: "asc" }
        },
        sections: {
          orderBy: { order: "asc" }
        },
        client: true
      }
    });

    if (!reading) {
      return NextResponse.json({ error: "Lectura no encontrada" }, { status: 404 });
    }

    // Map to PDF data contract
    const formattedDate = format(new Date(reading.readingDate), "dd/MM/yyyy", { locale: es });
    const formattedTime = reading.startTime ? format(new Date(reading.startTime), "HH:mm", { locale: es }) : undefined;

    // Find general interpretation section (assume first section or type "Resumen general")
    const summarySection = reading.sections.find(s => s.sectionType.toLowerCase().includes("general")) 
                        || reading.sections[0];
    // Find final conclusion section
    const conclusionSection = reading.sections.find(s => s.sectionType.toLowerCase().includes("conclu"));

    // Map cards
    const mappedCards: ReadingPdfCard[] = reading.cards.map((card, idx) => {
      const cardDef = tarotCards.find(tc => tc.id === card.visualCardId);
      const realImagePath = cardDef ? cardDef.image : "/tarot/the_fool.jpg";
      
      return {
        id: card.id,
        name: card.cardName,
        imagePath: realImagePath,
        order: idx,
        orientation: card.orientation.toLowerCase(),
        x: card.x,
        y: card.y,
        rotation: card.rotation,
        relativeScale: card.relativeScale
      };
    });

    const pdfData: ReadingPdfData = {
      coverTitle: reading.title,
      coverSubtitle: "Una guía simbólica para comprender tu presente\ny orientar tus próximos pasos.",
      spreadName: reading.customSpreadName || reading.spreadType,
      consultantName: reading.clientName || reading.client?.name || "Consultante",
      date: formattedDate,
      time: formattedTime,
      question: reading.mainQuestion,
      canvasWidth: reading.canvasWidth || undefined,
      canvasHeight: reading.canvasHeight || undefined,
      cards: mappedCards,
      localInterpretation: {
        summary: summarySection?.content || reading.spreadDescription || "Interpretación general no disponible.",
        positions: reading.cards.map(c => ({
          positionNumber: c.positionIndex + 1,
          positionName: c.positionName,
          cardName: c.cardName,
          orientation: c.orientation === "REVERSED" ? "Invertida" : "Al derecho",
          interpretation: c.interpretation || c.positionMeaning || ""
        })),
        finalAdvice: conclusionSection?.content
      },
      // commercial readings probably don't have mentor interpretation by default in the same way,
      // but if we do, we map it here.
    };

    const pdfBuffer = await generateReadingPdf(pdfData);

    const safeTitle = reading.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const filename = `lectura-${safeTitle}-${format(new Date(), "yyyyMMdd")}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });

  } catch (error: any) {
    console.error("Error exporting ClientReading PDF:", error);
    return NextResponse.json(
      { error: "Error generando el PDF", details: error.message },
      { status: 500 }
    );
  }
}
