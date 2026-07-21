import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const readings = await prisma.clientReading.findMany();
  console.log("ALL READINGS:");
  readings.forEach(r => console.log(r.id, r.clientName, r.clientEmail, r.clientId, r.status));

  const user = await prisma.user.findUnique({ where: { email: 'andrearroyoj@gmail.com' }});
  console.log("ANDRE USER ID:", user?.id, "EMAIL:", user?.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
