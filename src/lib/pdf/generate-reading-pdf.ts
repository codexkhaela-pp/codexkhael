import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { ReadingPdfData } from "./types";
import { PageRenderer } from "./page-renderer";
import { TextLayout } from "./text-layout";
import { SpreadRenderer } from "./spread-renderer";
import { getFontRegularBytes, getFontSemiBoldBytes } from "./asset-loader";
import { PDF_LAYOUT, COVER_LAYOUT } from "./constants";

export async function generateReadingPdf(data: ReadingPdfData): Promise<Buffer> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  // Configure metadata
  doc.setTitle(data.coverTitle || "Lectura personalizada de tarot");
  doc.setAuthor("Khael Tarotista");
  doc.setSubject("Lectura de tarot");
  doc.setCreator("Codex Khael");
  doc.setProducer("Codex Khael");
  doc.setKeywords(["tarot", "lectura", "Khael Tarotista", "Codex Khael"]);
  doc.setCreationDate(new Date());
  doc.setModificationDate(new Date());

  // Validaciones obligatorias (fail-fast)
  if (!data.localInterpretation || !data.localInterpretation.summary) {
    throw new Error("Interpretación local faltante.");
  }
  if (!data.cards || data.cards.length === 0) {
    throw new Error("La tirada no contiene cartas.");
  }

  // Comprobar recursos
  const fontRegBytes = getFontRegularBytes();
  const fontSemiBytes = getFontSemiBoldBytes();
  const fontRegular = await doc.embedFont(fontRegBytes);
  const fontSemiBold = await doc.embedFont(fontSemiBytes);

  const pageRenderer = new PageRenderer(doc);
  const spreadRenderer = new SpreadRenderer(doc);

  // 1. Cover Page
  const coverPage = await pageRenderer.createCoverPage();
  const coverLayout = new TextLayout(coverPage, fontRegular, fontSemiBold, pageRenderer, PDF_LAYOUT.coverSafeTopPt);
  coverLayout.disablePagination = true; // Cover components should never trigger a new page

  if (data.coverTitle) {
    coverLayout.setCursorY(COVER_LAYOUT.titleYPt); 
    await coverLayout.drawParagraph(data.coverTitle, fontSemiBold, PDF_LAYOUT.titleSizePt + 4, PDF_LAYOUT.coverTextColor, "center", PDF_LAYOUT.coverSafeLeftPt, PDF_LAYOUT.coverSafeRightPt);
  }
  if (data.coverSubtitle) {
    coverLayout.setCursorY(COVER_LAYOUT.subtitleYPt);
    await coverLayout.drawParagraph(data.coverSubtitle, fontRegular, PDF_LAYOUT.sectionTitleSizePt, PDF_LAYOUT.coverTextColor, "center", PDF_LAYOUT.coverSafeLeftPt, PDF_LAYOUT.coverSafeRightPt);
  }

  // 2. Main Content Page
  const mainPage = await pageRenderer.createTemplatePage();
  const textLayout = new TextLayout(mainPage, fontRegular, fontSemiBold, pageRenderer);

  // Info header
  const titleText = data.spreadName.toUpperCase();
  await textLayout.drawParagraph(titleText, fontSemiBold, PDF_LAYOUT.titleSizePt, PDF_LAYOUT.textColor, "center");
  
  textLayout.setCursorY(textLayout.getCursorY() + 5); // reduce gap slightly before date
  const metadataText = `${data.date}${data.time ? ` • ${data.time}` : ""}`;
  await textLayout.drawParagraph(metadataText, fontRegular, PDF_LAYOUT.metadataSizePt, PDF_LAYOUT.textColor, "center");

  if (data.question) {
    textLayout.setCursorY(textLayout.getCursorY() - 10);
    await textLayout.drawParagraph(`Pregunta: "${data.question}"`, fontRegular, PDF_LAYOUT.bodySizePt, PDF_LAYOUT.textColor, "center");
  }

  textLayout.setCursorY(textLayout.getCursorY() - PDF_LAYOUT.sectionSpacingPt);

  // Draw spread
  // Check if we need to jump to next page to keep spread whole
  const exactSpreadHeight = spreadRenderer.calculateSpreadHeight(
    data.cards,
    PDF_LAYOUT.pageWidthPt - PDF_LAYOUT.safeLeftPt - PDF_LAYOUT.safeRightPt,
    textLayout.getCursorY() - PDF_LAYOUT.safeBottomPt, // initial available height check
    data.canvasWidth,
    data.canvasHeight
  );
  
  // If the spread doesn't fit on the current page, force a new page.
  // We use a small margin (e.g. 50pt) to ensure the title also doesn't get squeezed.
  if (textLayout.getCursorY() - exactSpreadHeight < PDF_LAYOUT.safeBottomPt) {
    await textLayout.ensureSpace(textLayout.getCursorY()); // will trigger new page
  }
  
  const newYAfterSpread = await spreadRenderer.drawSpread(
    textLayout.page, 
    data.cards, 
    textLayout.getCursorY(),
    data.canvasWidth,
    data.canvasHeight
  );
  textLayout.setCursorY(newYAfterSpread);

  // 3. Local Interpretation
  if (data.localInterpretation && (data.localInterpretation.summary || (data.localInterpretation.positions && data.localInterpretation.positions.length > 0))) {
    await textLayout.addNewPage();
    
    if (data.localInterpretation.summary) {
      await textLayout.drawSectionTitle("LECTURA GENERAL");
      await textLayout.drawParagraph(data.localInterpretation.summary, fontRegular, PDF_LAYOUT.bodySizePt);
    }
    
    if (data.localInterpretation.positions && data.localInterpretation.positions.length > 0) {
      for (const pos of data.localInterpretation.positions) {
        if (!pos.interpretation || pos.interpretation.trim() === "") continue;
        
        const title = pos.positionName ? `Carta ${pos.positionNumber} - ${pos.positionName}` : `Carta ${pos.positionNumber}`;
        await textLayout.drawSubSectionTitle(title);
        await textLayout.drawParagraph(`${pos.cardName} (${pos.orientation})`, fontSemiBold, PDF_LAYOUT.bodySizePt);
        await textLayout.drawParagraph(pos.interpretation, fontRegular, PDF_LAYOUT.bodySizePt);
      }
    }
    
    if (data.localInterpretation.relationships) {
      await textLayout.drawSubSectionTitle("Relación entre cartas");
      await textLayout.drawParagraph(data.localInterpretation.relationships, fontRegular, PDF_LAYOUT.bodySizePt);
    }
    
    if (data.localInterpretation.finalAdvice) {
      await textLayout.drawSubSectionTitle("Consejo Final");
      await textLayout.drawParagraph(data.localInterpretation.finalAdvice, fontRegular, PDF_LAYOUT.bodySizePt);
    }
  }

  // 4. Mentor Interpretation
  if (data.mentorInterpretation && Object.keys(data.mentorInterpretation).length > 0) {
    await textLayout.drawSectionTitle("Reflexiones del Mentor");
    
    const mentor = data.mentorInterpretation;
    const renderMentorSection = async (title: string, text?: string) => {
      if (text) {
        await textLayout.drawSubSectionTitle(title);
        await textLayout.drawParagraph(text, fontRegular, PDF_LAYOUT.bodySizePt);
      }
    };

    await renderMentorSection("Respuesta Directa", mentor.directAnswer);
    await renderMentorSection("Punto Ciego", mentor.blindSpot);
    await renderMentorSection("Dinámica Profunda", mentor.deepDynamic);
    await renderMentorSection("Riesgo Principal", mentor.mainRisk);
    await renderMentorSection("Oportunidad Real", mentor.realOpportunity);
    await renderMentorSection("Consejo", mentor.mentorAdvice);
    await renderMentorSection("Acción a 7 días", mentor.sevenDayAction);
    await renderMentorSection("Pregunta para Reflexionar", mentor.reflectionQuestion);
    await renderMentorSection("Opción Preferida", mentor.preferredOption);
    await renderMentorSection("Por qué es preferida", mentor.preferredOptionReason);
    await renderMentorSection("Riesgo Alternativo", mentor.alternativeOptionRisk);
    await renderMentorSection("Advertencia", mentor.warning);
  }

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}
