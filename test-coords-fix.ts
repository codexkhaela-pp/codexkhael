import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const readings = await prisma.clientReading.findMany({
    orderBy: { createdAt: 'desc' },
    take: 2,
    include: { cards: true }
  });
  
  for (const r of readings) {
    console.log(`Reading: ${r.title} (Canvas: ${r.canvasWidth}x${r.canvasHeight})`);
    for (const c of r.cards) {
      console.log(`- ${c.cardName}: x=${c.x}, y=${c.y}, scale=${c.relativeScale}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
