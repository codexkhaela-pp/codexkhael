import { PrismaClient } from './src/generated/prisma';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "prisma+postgres://localhost:51213/?api_key=eyJkYXRhYmFzZVVybCI6InBvc3RncmVzOi8vcG9zdGdyZXM6cG9zdGdyZXNAbG9jYWxob3N0OjUxMjE0L3RlbXBsYXRlMT9zc2xtb2RlPWRpc2FibGUmY29ubmVjdGlvbl9saW1pdD0xMCZjb25uZWN0X3RpbWVvdXQ9MCZtYXhfaWRsZV9jb25uZWN0aW9uX2xpZmV0aW1lPTAmcG9vbF90aW1lb3V0PTAmc29ja2V0X3RpbWVvdXQ9MCIsIm5hbWUiOiJkZWZhdWx0Iiwic2hhZG93RGF0YWJhc2VVcmwiOiJwb3N0Z3JlczovL3Bvc3RncmVzOnBvc3RncmVzQGxvY2FsaG9zdDo1MTIxNS90ZW1wbGF0ZTE_c3NsbW9kZT1kaXNhYmxlJmNvbm5lY3Rpb25fbGltaXQ9MTAmY29ubmVjdF90aW1lb3V0PTAmbWF4X2lkbGVfY29ubmVjdGlvbl9saWZldGltZT0wJnBvb2xfdGltZW91dD0wJnNvY2tldF90aW1lb3V0PTAifQ"
    }
  }
});

async function main() {
  const readings = await prisma.clientReading.findMany({
    orderBy: { createdAt: 'desc' },
    take: 2,
    include: { cards: true }
  });
  
  for (const r of readings) {
    console.log(`Reading: ${r.title} (Canvas: ${r.canvasWidth}x${r.canvasHeight})`);
    for (const c of r.cards) {
      console.log(`- ${c.cardName} (${c.positionName}): x=${c.x}, y=${c.y}, rot=${c.rotation}, scale=${c.relativeScale}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
