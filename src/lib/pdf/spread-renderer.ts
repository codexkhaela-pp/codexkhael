import { PDFDocument, PDFPage } from "pdf-lib";
import { PDF_LAYOUT } from "./constants";
import { ReadingPdfCard } from "./types";
import { getCardImageBytes } from "./asset-loader";

export class SpreadRenderer {
  private doc: PDFDocument;

  constructor(doc: PDFDocument) {
    this.doc = doc;
  }

  public calculateSpreadHeight(
    cards: ReadingPdfCard[],
    availableWidth: number,
    availableHeight: number,
    canvasWidth?: number,
    canvasHeight?: number
  ): number {
    if (cards.length === 0) return 0;
    
    // Compress horizontal virtual space to bring cards closer to the center
    const VIRTUAL_CANVAS_WIDTH = canvasWidth || 800;
    const VIRTUAL_CANVAS_HEIGHT = canvasHeight || (1000 / 1.5); // maintain original vertical scale
    // 120 keeps the gaps from vanishing, while maximizing relative card size
    const BASE_CARD_WIDTH = 120;
    const BASE_CARD_HEIGHT = BASE_CARD_WIDTH * 1.7; 

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const card of cards) {
      const scale = card.relativeScale !== undefined ? card.relativeScale : 1.0; 
      const cw = BASE_CARD_WIDTH * scale;
      const ch = BASE_CARD_HEIGHT * scale;
      
      const centerX = (card.x / 100) * VIRTUAL_CANVAS_WIDTH;
      const centerY = (card.y / 100) * VIRTUAL_CANVAS_HEIGHT;
      
      const radius = Math.sqrt((cw / 2)**2 + (ch / 2)**2);
      
      if (centerX - radius < minX) minX = centerX - radius;
      if (centerY - radius < minY) minY = centerY - radius;
      if (centerX + radius > maxX) maxX = centerX + radius;
      if (centerY + radius > maxY) maxY = centerY + radius;
    }

    const padding = 20;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const spreadWidth = maxX - minX;
    const spreadHeight = maxY - minY;

    if (spreadWidth <= 0 || spreadHeight <= 0) return 0;

    const scaleX = availableWidth / spreadWidth;
    const scaleY = availableHeight / spreadHeight;
    const scale = Math.min(scaleX, scaleY, 1.2); 

    return spreadHeight * scale;
  }

  public async drawSpread(
    page: PDFPage,
    cards: ReadingPdfCard[],
    startY: number,
    canvasWidth?: number,
    canvasHeight?: number
  ): Promise<number> {
    if (cards.length === 0) return startY;

    // Compress horizontal virtual space to bring cards closer to the center
    const VIRTUAL_CANVAS_WIDTH = canvasWidth || 800;
    const VIRTUAL_CANVAS_HEIGHT = canvasHeight || (1000 / 1.5); // maintain original vertical scale
    // 120 keeps the gaps from vanishing, while maximizing relative card size
    const BASE_CARD_WIDTH = 120;
    const BASE_CARD_HEIGHT = BASE_CARD_WIDTH * 1.7;

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    const positionedCards = cards.map(card => {
      const scale = card.relativeScale !== undefined ? card.relativeScale : 1.0; 
      const cw = BASE_CARD_WIDTH * scale;
      const ch = BASE_CARD_HEIGHT * scale;
      
      const centerX = (card.x / 100) * VIRTUAL_CANVAS_WIDTH;
      const centerY = (card.y / 100) * VIRTUAL_CANVAS_HEIGHT;
      
      const radius = Math.sqrt((cw / 2)**2 + (ch / 2)**2);
      
      if (centerX - radius < minX) minX = centerX - radius;
      if (centerY - radius < minY) minY = centerY - radius;
      if (centerX + radius > maxX) maxX = centerX + radius;
      if (centerY + radius > maxY) maxY = centerY + radius;
      
      return { ...card, centerX, centerY, cw, ch };
    });

    // Add a little padding to the virtual bounding box
    const padding = 20;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const spreadWidth = maxX - minX;
    const spreadHeight = maxY - minY;

    if (spreadWidth <= 0 || spreadHeight <= 0) return startY;

    // 2. Define the available box in the PDF with smaller margins specifically for the spread 
    // to allow it to be as large as possible
    const spreadLeftMargin = 30;
    const spreadRightMargin = 30;
    const availableWidth = PDF_LAYOUT.pageWidthPt - spreadLeftMargin - spreadRightMargin;
    
    // We can use up to ~400pt or whatever fits before safe bottom
    const availableHeight = startY - PDF_LAYOUT.safeBottomPt;

    // 3. Calculate scale to fit spread into available box
    const scaleX = availableWidth / spreadWidth;
    const scaleY = availableHeight / spreadHeight;
    const scale = Math.min(scaleX, scaleY, 1.2); // limit max scale

    const finalSpreadWidth = spreadWidth * scale;
    const finalSpreadHeight = spreadHeight * scale;

    // Center horizontally
    const offsetX = spreadLeftMargin + (availableWidth - finalSpreadWidth) / 2;
    // Align to top of the available space (startY)
    const offsetY = startY;

    // Sort cards by order to draw back-to-front
    const sortedCards = [...positionedCards].sort((a, b) => a.order - b.order);

    for (const card of sortedCards) {
      if (!card.imagePath) continue;

      try {
        const imageBytes = getCardImageBytes(card.imagePath);
        const isJpg = card.imagePath.toLowerCase().endsWith(".jpg") || card.imagePath.toLowerCase().endsWith(".jpeg");
        const pdfImage = isJpg ? await this.doc.embedJpg(imageBytes) : await this.doc.embedPng(imageBytes);

        const w = card.cw * scale;
        const h = card.ch * scale;

        // Map web top-down to PDF bottom-up
        // card.centerX relative to minX
        const relX = (card.centerX - minX) * scale;
        const relY = (card.centerY - minY) * scale;

        // pdf-lib draws from bottom-left corner of the image
        // To rotate around center, we calculate the center point
        const drawCenterX = offsetX + relX;
        const drawCenterY = offsetY - relY;

        let finalRotation = 0;
        if (card.rotation) {
          finalRotation = -card.rotation; // pdf-lib is CCW
        } else if (card.orientation === "invertida" || card.orientation === ("reversed" as any)) {
          finalRotation = 180;
        }

        const { degrees } = require("pdf-lib");
        
        // pdf-lib rotates around the bottom-left corner (x,y).
        // To rotate around the center point (drawCenterX, drawCenterY),
        // we calculate where the bottom-left corner would end up.
        const theta = finalRotation * (Math.PI / 180); // in radians
        const dx = -w / 2;
        const dy = -h / 2;
        
        const newX = drawCenterX + (dx * Math.cos(theta) - dy * Math.sin(theta));
        const newY = drawCenterY + (dx * Math.sin(theta) + dy * Math.cos(theta));

        page.drawImage(pdfImage, {
          x: newX,
          y: newY,
          width: w,
          height: h,
          rotate: degrees(finalRotation),
        });
      } catch (error) {
        console.error(`Failed to load or draw card image: ${card.imagePath}`, error);
      }
    }

    return startY - finalSpreadHeight - PDF_LAYOUT.sectionSpacingPt;
  }
}
