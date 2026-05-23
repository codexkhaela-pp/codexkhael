import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { resolvePlanTier } from "@/lib/plans";
import puppeteer from "puppeteer";
import { mapBitacoraEntryToJournalEntry } from "@/app/api/diario/_lib/bitacora-mapper";

export const runtime = "nodejs";
export const maxDuration = 60; // Next.js serverless function max duration just in case

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
    
    // Validate PRO plan
    if (plan !== "PRO") {
      return NextResponse.json(
        { error: "FEATURE_NOT_ALLOWED", feature: "EXPORT_PDF", requiredPlan: "PRO" },
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
    
    // Build HTML template
    const htmlContent = buildHtmlForPdf(entry);

    // Launch puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    
    const page = await browser.newPage();
    
    // We set content directly. No network calls needed if we inline everything.
    await page.setContent(htmlContent, { waitUntil: "load" });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0px", right: "0px", bottom: "0px", left: "0px" }
    });

    await browser.close();

    // Return the binary PDF
    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=\"Lectura_Tarot.pdf\""
      },
    });

  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Error interno al generar el PDF." },
      { status: 500 }
    );
  }
}

function buildHtmlForPdf(entry: any): string {
  // Extract data with fallbacks
  const dateObj = new Date(entry.metadata.date);
  const formattedDate = isNaN(dateObj.getTime()) ? entry.metadata.date : dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  
  const time = entry.metadata.time || "----";
  const spread = entry.metadata.spreadType || "Libre";
  const emotional = entry.metadata.emotionalState || "----";
  const place = entry.metadata.place || "----";
  const question = entry.metadata.question || "Sin pregunta específica registrada.";
  
  const interpretation = entry.reflection.personalInterpretation || "";
  const finalMessage = entry.reflection.finalMessage || "";
  const suggestedAction = entry.reflection.suggestedAction || "";
  
  // Re-reading info
  const lastRereading = entry.rereadings && entry.rereadings.length > 0 ? entry.rereadings[entry.rereadings.length - 1] : null;
  
  let didComeTrue = "";
  let reviewDate = "----";
  let reflection = "";
  let learned = "";
  
  if (lastRereading) {
    didComeTrue = lastRereading.didComeTrue;
    const rDate = new Date(lastRereading.rereadingDate);
    reviewDate = isNaN(rDate.getTime()) ? lastRereading.rereadingDate : rDate.toLocaleDateString('es-ES');
    reflection = lastRereading.reflection || "";
    learned = lastRereading.lessonLearned || "";
  }
  
  // Render placements for the map
  const renderPlacements = entry.canvas.placements.map((p: any) => {
    return `
      <div style="margin-bottom: 8px;">
        <strong>${p.positionName || 'Carta'}:</strong> ${p.cardName} ${p.isReversed ? '(Invertida)' : ''}
      </div>
    `;
  }).join("");

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Registro de Lecturas</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap');
    
    :root {
      --gold: #A58A59;
      --gold-light: #C9A66B;
      --bg: #FDFBF7;
      --text: #2C2A28;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Cormorant Garamond', serif;
      background-color: var(--bg);
      color: var(--text);
      width: 210mm;
      height: 297mm;
      padding: 15mm;
      position: relative;
    }

    /* Paper texture overlay (subtle) */
    body::before {
      content: "";
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background-image: url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noiseFilter)" opacity="0.05"/></svg>');
      pointer-events: none;
      z-index: 0;
    }

    /* Main Border Frame */
    .frame {
      border: 1px solid var(--gold);
      padding: 10mm;
      height: 100%;
      position: relative;
      z-index: 1;
    }

    /* Corner Ornaments (Simple geometric approximation for the PDF) */
    .frame::before, .frame::after {
      content: "";
      position: absolute;
      width: 20px;
      height: 20px;
      border: 1px solid var(--gold);
    }
    .frame::before { top: 4px; left: 4px; border-right: none; border-bottom: none; }
    .frame::after { bottom: 4px; right: 4px; border-left: none; border-top: none; }
    
    .frame-inner-tr { position: absolute; top: 4px; right: 4px; width: 20px; height: 20px; border: 1px solid var(--gold); border-left: none; border-bottom: none; }
    .frame-inner-bl { position: absolute; bottom: 4px; left: 4px; width: 20px; height: 20px; border: 1px solid var(--gold); border-right: none; border-top: none; }

    /* Typography */
    h1 {
      font-family: 'Cinzel', serif;
      font-size: 28pt;
      font-weight: 400;
      text-align: center;
      letter-spacing: 2px;
      margin-bottom: 20px;
      color: var(--text);
    }
    
    h3 {
      font-family: 'Cinzel', serif;
      font-size: 11pt;
      font-weight: 600;
      color: var(--text);
      display: inline-block;
      margin-right: 5px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .value {
      font-style: italic;
      color: var(--text);
      border-bottom: 1px dotted var(--gold-light);
      display: inline-block;
      min-width: 50px;
      padding-bottom: 2px;
    }

    /* Header Info */
    .header-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 15px;
      font-size: 11pt;
    }

    .header-info-line2 {
      display: flex;
      justify-content: flex-start;
      gap: 40px;
      margin-bottom: 25px;
      font-size: 11pt;
    }

    /* Blocks */
    .block {
      border: 1px solid var(--gold);
      border-radius: 8px;
      padding: 12px 15px;
      margin-bottom: 15px;
      background: rgba(255, 255, 255, 0.4);
    }

    .block-title {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }

    .icon-star {
      color: var(--gold);
      font-size: 14pt;
      margin-right: 8px;
    }

    .lines {
      width: 100%;
      min-height: 40px;
      line-height: 24px;
      background-image: repeating-linear-gradient(transparent, transparent 23px, rgba(165,138,89, 0.3) 24px);
      font-style: italic;
    }

    /* Map Block */
    .map-block {
      border: 1px dashed var(--gold);
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 15px;
      min-height: 180px;
      position: relative;
      text-align: center;
    }
    
    .map-block::after {
      content: "✧";
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 80pt;
      color: rgba(165,138,89, 0.08);
      z-index: 0;
    }

    .map-content {
      position: relative;
      z-index: 1;
      text-align: left;
      font-style: italic;
      font-size: 12pt;
    }

    /* Two columns */
    .two-cols {
      display: flex;
      gap: 15px;
      margin-bottom: 15px;
    }
    
    .col-half {
      flex: 1;
      border: 1px solid var(--gold);
      border-radius: 8px;
      padding: 12px 15px;
      background: rgba(255, 255, 255, 0.4);
    }

    /* Footer Block */
    .footer-block {
      border: 1px solid var(--gold);
      border-radius: 8px;
      padding: 12px 15px;
      display: flex;
      gap: 20px;
      background: rgba(255, 255, 255, 0.4);
    }

    .footer-col {
      flex: 1;
    }

    .checkbox {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 1px solid var(--gold);
      margin-right: 5px;
      position: relative;
      top: 2px;
    }

    .checkbox.checked {
      background-color: var(--gold);
    }

    .checkbox-label {
      font-size: 10pt;
      margin-right: 15px;
      font-family: 'Cinzel', serif;
      letter-spacing: 1px;
    }

    /* Center Ornaments */
    .center-ornament {
      text-align: center;
      color: var(--gold);
      margin: 10px 0;
      font-size: 14pt;
      letter-spacing: 8px;
    }
  </style>
</head>
<body>
  <div class="frame">
    <div class="frame-inner-tr"></div>
    <div class="frame-inner-bl"></div>

    <div class="center-ornament">✧ ☽ ☼ ☾ ✧</div>
    
    <h1>REGISTRO DE LECTURAS</h1>
    
    <div class="center-ornament" style="font-size: 10pt; margin-top:-20px; margin-bottom: 25px;">— ✧ —</div>

    <div class="header-info">
      <div><h3>FECHA:</h3> <span class="value">${formattedDate}</span></div>
      <div><h3>HORA:</h3> <span class="value">${time}</span></div>
      <div><h3>TIRADA UTILIZADA:</h3> <span class="value">${spread}</span></div>
    </div>
    
    <div class="header-info-line2">
      <div><h3>ESTADO EMOCIONAL:</h3> <span class="value">${emotional}</span></div>
      <div><h3>LUGAR / CONTEXTO:</h3> <span class="value">${place}</span></div>
    </div>

    <!-- Pregunta -->
    <div class="block">
      <div class="block-title">
        <span class="icon-star">✧</span><h3>PREGUNTA / INTENCIÓN</h3>
      </div>
      <div class="lines">${question}</div>
    </div>

    <div class="center-ornament" style="font-size: 10pt; margin: 5px 0;">— ✧ MAPA DE LA TIRADA ✧ —</div>

    <!-- Mapa -->
    <div class="map-block">
      <div class="map-content">
        ${renderPlacements || "Dibuja o escribe aquí tus cartas y su posición."}
      </div>
    </div>

    <!-- Interpretación -->
    <div class="block">
      <div class="block-title">
        <span class="icon-star">✧</span><h3>INTERPRETACIÓN</h3>
      </div>
      <div class="lines">${interpretation}</div>
    </div>

    <!-- Conclusión & Consejo -->
    <div class="two-cols">
      <div class="col-half">
        <div class="block-title">
          <span class="icon-star">☽</span><h3>MENSAJE FINAL / CONCLUSIÓN</h3>
        </div>
        <div class="lines">${finalMessage}</div>
      </div>
      <div class="col-half">
        <div class="block-title">
          <span class="icon-star">⚔</span><h3>ACCIÓN / CONSEJO</h3>
        </div>
        <div class="lines">${suggestedAction}</div>
      </div>
    </div>

    <!-- Relectura -->
    <div class="footer-block">
      <div class="footer-col" style="flex: 1.2">
        <div class="center-ornament" style="font-size: 10pt; margin:0 0 10px 0; text-align: left;">— RELECTURA FUTURA ☽☼☾ —</div>
        
        <h3 style="display:block; margin-bottom: 5px; font-size: 9pt;">¿SE CUMPLIÓ LA LECTURA?</h3>
        <div>
          <span class="checkbox ${didComeTrue === 'si' ? 'checked' : ''}"></span><span class="checkbox-label">SÍ</span>
          <span class="checkbox ${didComeTrue === 'no' ? 'checked' : ''}"></span><span class="checkbox-label">NO</span>
          <span class="checkbox ${didComeTrue === 'parcial' || didComeTrue === 'pendiente' ? 'checked' : ''}"></span><span class="checkbox-label">EN PROCESO</span>
        </div>
        
        <h3 style="display:block; margin-top: 15px; margin-bottom: 5px; font-size: 9pt;">FECHA DE REVISIÓN:</h3>
        <div class="value">${reviewDate}</div>
      </div>

      <div class="footer-col" style="flex: 1.5; border-left: 1px dashed var(--gold-light); padding-left: 15px;">
        <h3 style="display:block; margin-bottom: 5px; font-size: 9pt;">REFLEXIÓN POSTERIOR</h3>
        <div class="lines" style="min-height: 80px;">${reflection}</div>
      </div>

      <div class="footer-col" style="flex: 1.5; border-left: 1px dashed var(--gold-light); padding-left: 15px;">
        <h3 style="display:block; margin-bottom: 5px; font-size: 9pt;">¿QUÉ APRENDÍ?</h3>
        <div class="lines" style="min-height: 80px;">${learned}</div>
      </div>
    </div>

  </div>
</body>
</html>
  `;
}
