import { PDFPage, PDFFont, rgb, Color } from "pdf-lib";
import { PDF_LAYOUT } from "./constants";
import { PageRenderer } from "./page-renderer";

interface HexColor {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): Color {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return rgb(r, g, b);
}

export class TextLayout {
  public page: PDFPage;
  public fontRegular: PDFFont;
  public fontSemiBold: PDFFont;
  
  private cursorY: number;
  private pageRenderer: PageRenderer;
  private totalPages: PDFPage[] = [];
  public disablePagination: boolean = false;

  constructor(
    initialPage: PDFPage,
    fontRegular: PDFFont,
    fontSemiBold: PDFFont,
    pageRenderer: PageRenderer,
    startY?: number
  ) {
    this.page = initialPage;
    this.totalPages.push(initialPage);
    this.fontRegular = fontRegular;
    this.fontSemiBold = fontSemiBold;
    this.pageRenderer = pageRenderer;
    this.cursorY = startY ?? (PDF_LAYOUT.pageHeightPt - PDF_LAYOUT.safeTopPt);
  }

  public getPages(): PDFPage[] {
    return this.totalPages;
  }

  public getCursorY(): number {
    return this.cursorY;
  }
  
  public setCursorY(y: number): void {
    this.cursorY = y;
  }

  public async ensureSpace(requiredSpacePt: number): Promise<void> {
    if (this.disablePagination) return;
    if (this.cursorY - requiredSpacePt < PDF_LAYOUT.safeBottomPt) {
      await this.addNewPage();
    }
  }

  public async addNewPage(): Promise<void> {
    this.page = await this.pageRenderer.createTemplatePage();
    this.totalPages.push(this.page);
    this.cursorY = PDF_LAYOUT.pageHeightPt - PDF_LAYOUT.safeTopPt;
  }

  private wordWrap(text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, fontSize);
      if (width > maxWidth) {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // A single word is longer than max width, force push
          lines.push(word);
          currentLine = "";
        }
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  public async drawParagraph(
    text: string,
    font: PDFFont,
    fontSize: number,
    colorHex: string = PDF_LAYOUT.textColor,
    align: "left" | "center" = "left",
    safeLeft: number = PDF_LAYOUT.safeLeftPt,
    safeRight: number = PDF_LAYOUT.safeRightPt,
    lineHeightMulti: number = PDF_LAYOUT.lineHeightMultiplier,
    preventOrphans: boolean = true
  ): Promise<void> {
    if (!text) return;
    
    const linesToDraw = text.split('\n').flatMap((paragraph) => {
      if (!paragraph.trim()) return [""]; // Empty line for blank spaces
      const maxWidth = PDF_LAYOUT.pageWidthPt - safeLeft - safeRight;
      return this.wordWrap(paragraph, maxWidth, font, fontSize);
    });

    const lineHeight = fontSize * lineHeightMulti;

    for (let i = 0; i < linesToDraw.length; i++) {
      const line = linesToDraw[i];
      
      // Handle orphans/widows
      if (preventOrphans && i < linesToDraw.length - 1) {
        // If this is the second to last line (a widow could form) or 
        // if this is the first line of a new paragraph (an orphan could form),
        // we demand enough space for at least 2 lines.
        const linesLeft = linesToDraw.length - i;
        if (linesLeft === 2 || i === 0) {
          await this.ensureSpace(lineHeight * 2);
        } else {
          await this.ensureSpace(lineHeight);
        }
      } else {
        await this.ensureSpace(lineHeight);
      }

      if (line.trim() !== "") {
        let x = safeLeft;
        if (align === "center") {
          const width = font.widthOfTextAtSize(line, fontSize);
          x = (PDF_LAYOUT.pageWidthPt - width) / 2;
        }

        this.page.drawText(line, {
          x,
          y: this.cursorY - fontSize,
          size: fontSize,
          font,
          color: hexToRgb(colorHex),
        });
      }

      this.cursorY -= lineHeight;
    }

    this.cursorY -= PDF_LAYOUT.paragraphSpacingPt;
  }

  public async drawSectionTitle(title: string): Promise<void> {
    this.cursorY -= PDF_LAYOUT.sectionSpacingPt;
    await this.ensureSpace(PDF_LAYOUT.sectionTitleSizePt * PDF_LAYOUT.lineHeightMultiplier + PDF_LAYOUT.paragraphSpacingPt);
    await this.drawParagraph(
      title,
      this.fontSemiBold,
      PDF_LAYOUT.sectionTitleSizePt,
      PDF_LAYOUT.textColor,
      "left"
    );
  }

  public async drawSubSectionTitle(title: string): Promise<void> {
    this.cursorY -= PDF_LAYOUT.paragraphSpacingPt;
    await this.ensureSpace(PDF_LAYOUT.subSectionTitleSizePt * PDF_LAYOUT.lineHeightMultiplier + PDF_LAYOUT.paragraphSpacingPt);
    await this.drawParagraph(
      title,
      this.fontSemiBold,
      PDF_LAYOUT.subSectionTitleSizePt,
      PDF_LAYOUT.textColor,
      "left"
    );
  }

  public async drawList(items: string[]): Promise<void> {
    for (const item of items) {
      const bullet = "• ";
      const indent = this.fontRegular.widthOfTextAtSize(bullet, PDF_LAYOUT.bodySizePt);
      
      // Check space for at least 1 line
      await this.ensureSpace(PDF_LAYOUT.bodySizePt * PDF_LAYOUT.lineHeightMultiplier);

      this.page.drawText(bullet, {
        x: PDF_LAYOUT.safeLeftPt,
        y: this.cursorY - PDF_LAYOUT.bodySizePt,
        size: PDF_LAYOUT.bodySizePt,
        font: this.fontRegular,
        color: hexToRgb(PDF_LAYOUT.textColor),
      });

      // Draw the rest of the text indented
      const oldCursor = this.cursorY;
      await this.drawParagraph(
        item,
        this.fontRegular,
        PDF_LAYOUT.bodySizePt,
        PDF_LAYOUT.textColor,
        "left",
        PDF_LAYOUT.safeLeftPt + indent, // indent left
        PDF_LAYOUT.safeRightPt,
        PDF_LAYOUT.lineHeightMultiplier,
        false
      );
    }
  }
}
