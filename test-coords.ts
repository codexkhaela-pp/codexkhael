import { prisma } from "./lib/prisma";

async function main() {
  const readings = await prisma.clientReading.findMany({
    take: 5,
    include: { cards: true }
  });
  
  for (const r of readings) {
    console.log(`Reading: ${r.title}`);
    for (const c of r.cards) {
      console.log(`- ${c.cardName}: x=${c.x}, y=${c.y}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
