import { prisma } from "./src/lib/prisma";

async function main() {
  const reading = await prisma.clientReading.findFirst({
    where: {
      cards: { some: {} }
    }
  });

  if (reading) {
    console.log(reading.id);
  } else {
    console.log("No readings with cards found");
  }
}
main();
