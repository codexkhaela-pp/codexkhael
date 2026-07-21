import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MisLecturasDebugPage() {
  const readings = await prisma.clientReading.findMany();
  const users = await prisma.user.findMany({ select: { id: true, email: true }});
  
  return (
    <div style={{ padding: 40, fontFamily: 'monospace', color: 'white' }}>
      <h1>ALL READINGS</h1>
      <pre>{JSON.stringify(readings.map(r => ({ id: r.id, clientEmail: r.clientEmail, clientId: r.clientId, status: r.status })), null, 2)}</pre>
      <h1>ALL USERS</h1>
      <pre>{JSON.stringify(users, null, 2)}</pre>
    </div>
  );
}
