import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: { email: true, status: true }
    });
    console.log("Usuarios en la base de datos:");
    console.table(users);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
