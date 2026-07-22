import { PDFDocument, PDFPage, PDFFont, PDFImage } from "pdf-lib";
import { PDF_LAYOUT } from "./constants";
import { getPdfCoverBytes, getPdfTemplateBytes } from "./asset-loader";

export class PageRenderer {
  private doc: PDFDocument;
  private templateImageCache: PDFImage | null = null;
  private coverImageCache: PDFImage | null = null;

  constructor(doc: PDFDocument) {
    this.doc = doc;
  }

  public async getCoverImage(): Promise<PDFImage> {
    if (this.coverImageCache) return this.coverImageCache;
    const coverBytes = getPdfCoverBytes();
    this.coverImageCache = await this.doc.embedPng(coverBytes);
    return this.coverImageCache;
  }

  public async getTemplateImage(): Promise<PDFImage> {
    if (this.templateImageCache) return this.templateImageCache;
    const templateBytes = getPdfTemplateBytes();
    this.templateImageCache = await this.doc.embedPng(templateBytes);
    return this.templateImageCache;
  }

  public async createCoverPage(): Promise<PDFPage> {
    const page = this.doc.addPage([PDF_LAYOUT.pageWidthPt, PDF_LAYOUT.pageHeightPt]);
    const coverImage = await this.getCoverImage();
    
    // Scale proportionally and center to avoid white margins or deformations
    this.drawImageProportionally(page, coverImage);
    
    return page;
  }

  public async createTemplatePage(): Promise<PDFPage> {
    const page = this.doc.addPage([PDF_LAYOUT.pageWidthPt, PDF_LAYOUT.pageHeightPt]);
    const templateImage = await this.getTemplateImage();
    
    this.drawImageProportionally(page, templateImage);
    
    return page;
  }

  private drawImageProportionally(page: PDFPage, image: PDFImage) {
    const imgWidth = image.width;
    const imgHeight = image.height;
    
    const pageRatio = PDF_LAYOUT.pageWidthPt / PDF_LAYOUT.pageHeightPt;
    const imgRatio = imgWidth / imgHeight;
    
    let drawWidth = PDF_LAYOUT.pageWidthPt;
    let drawHeight = PDF_LAYOUT.pageHeightPt;
    let x = 0;
    let y = 0;

    // We want to "cover" the entire page, meaning no white borders.
    // If the image is taller than the page ratio, scale to width.
    if (imgRatio > pageRatio) {
      // Image is wider than page. Scale to height, then center horizontally.
      drawHeight = PDF_LAYOUT.pageHeightPt;
      drawWidth = imgWidth * (drawHeight / imgHeight);
      x = (PDF_LAYOUT.pageWidthPt - drawWidth) / 2;
    } else {
      // Image is taller than page. Scale to width, then center vertically.
      drawWidth = PDF_LAYOUT.pageWidthPt;
      drawHeight = imgHeight * (drawWidth / imgWidth);
      y = (PDF_LAYOUT.pageHeightPt - drawHeight) / 2;
    }

    page.drawImage(image, {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
    });
  }
}
