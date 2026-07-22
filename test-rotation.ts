import { PDFDocument, rgb, degrees } from 'pdf-lib';
import * as fs from 'fs';

async function main() {
  const doc = await PDFDocument.create();
  const page = doc.addPage([500, 500]);
  
  // Draw a center point reference
  page.drawCircle({ x: 250, y: 250, size: 5, color: rgb(1, 0, 0) });

  const w = 100;
  const h = 200;

  // We want the visual center to be at 250, 250
  // My math for theta = -90 (clockwise 90)
  const drawCenterX = 250;
  const drawCenterY = 250;
  const newX = drawCenterX - h/2; // 250 - 100 = 150
  const newY = drawCenterY + w/2; // 250 + 50 = 300

  // Draw a blue rectangle to simulate the image BEFORE rotation
  // It starts at (150, 300) and goes to (250, 500). Wait.
  // x=150, y=300, w=100, h=200.
  // Bottom-left is (150, 300).
  page.drawRectangle({
    x: newX,
    y: newY,
    width: w,
    height: h,
    color: rgb(0, 0, 1),
    opacity: 0.2
  });

  // Draw a green rectangle with rotation
  page.drawRectangle({
    x: newX,
    y: newY,
    width: w,
    height: h,
    rotate: degrees(-90),
    color: rgb(0, 1, 0),
    opacity: 0.5
  });

  const bytes = await doc.save();
  fs.writeFileSync('rotation-test.pdf', bytes);
  console.log('Saved rotation-test.pdf');
}
main();
