import { prisma } from "@/lib/prisma";

export default async function DebugPage() {
  const readings = await prisma.clientReading.findMany();
  const users = await prisma.user.findMany({ select: { id: true, email: true }});
  
  return (
    <pre>
      {JSON.stringify({ readings, users }, null, 2)}
    </pre>
  );
}
