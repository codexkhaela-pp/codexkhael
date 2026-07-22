import { generateReadingPdf } from "./src/lib/pdf/generate-reading-pdf";
import { ReadingPdfData } from "./src/lib/pdf/types";
import * as fs from "fs";

async function main() {
  const data: ReadingPdfData = {
    coverTitle: "Tu lectura personalizada",
    coverSubtitle: "Una guía simbólica para comprender tu presente\ny orientar tus próximos pasos.",
    spreadName: "TIRADA DE TRES CARTAS",
    consultantName: "André", // won't be shown in title
    date: "21/07/2026",
    time: "18:45",
    question: "Quiero saber cómo va a evolucionar mi carrera profesional este año",
    canvasWidth: 900,
    canvasHeight: 600,
    cards: [
      {
        id: "1",
        name: "El Mago",
        imagePath: "/tarot/01_magician.jpg",
        order: 0,
        orientation: "al derecho",
        x: 20, 
        y: 50,
        rotation: -5,
        relativeScale: 1.0,
      },
      {
        id: "2",
        name: "La Sacerdotisa",
        imagePath: "/tarot/02_high_priestess.jpg",
        order: 1,
        orientation: "al derecho",
        x: 50, 
        y: 50,
        rotation: 0,
        relativeScale: 1.0,
      },
      {
        id: "3",
        name: "El Loco",
        imagePath: "/tarot/00_fool.jpg",
        order: 2,
        orientation: "invertida",
        x: 80, 
        y: 50,
        rotation: 5,
        relativeScale: 1.0,
      }
    ],
    localInterpretation: {
      summary: "Esta es la interpretación general de la lectura. Las tres cartas muestran un arco de desarrollo interesante. Tienes las herramientas (El Mago), necesitas la intuición (La Sacerdotisa) y habrá un salto de fe al final (El Loco).",
      positions: [
        {
          positionNumber: 1,
          positionName: "Pasado",
          cardName: "El Mago",
          orientation: "Al derecho",
          interpretation: "Representa tus habilidades actuales."
        },
        {
          positionNumber: 2,
          positionName: "Presente",
          cardName: "La Sacerdotisa",
          orientation: "Al derecho",
          interpretation: "Representa tu intuición y lo oculto que está por revelarse."
        },
        {
          positionNumber: 3,
          positionName: "Futuro",
          cardName: "El Loco",
          orientation: "Invertida",
          interpretation: "Debes tener cuidado con los riesgos innecesarios."
        }
      ]
    }
  };

  try {
    const buffer = await generateReadingPdf(data);
    fs.writeFileSync("test_lectura_4.pdf", buffer);
    console.log("PDF generated successfully: test_lectura_4.pdf");
  } catch (error) {
    console.error("Error generating PDF:", error);
  }
}

main();
