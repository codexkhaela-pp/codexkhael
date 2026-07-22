const { PrismaClient } = require("./src/generated/prisma");

async function main() {
  const prisma = new PrismaClient();
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
