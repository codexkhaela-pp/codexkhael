import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { ReadingEditor } from "./reading-editor";
import { tarotCards } from "@/src/data/tarotCards";

export default async function AdminLecturaDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || (!user.roles.includes("ADMIN") && !user.roles.includes("TAROTIST"))) {
    redirect("/login");
  }

  const { id } = await params;
  const reading = await prisma.clientReading.findUnique({
    where: { id },
    include: {
      cards: {
        orderBy: { positionIndex: "asc" },
      },
      client: {
        select: { email: true }
      }
    },
  });

  if (!reading) {
    notFound();
  }

  return (
    <div className="panel-container" style={{ maxWidth: "100%", padding: "1rem" }}>
      <header className="panel-header" style={{ marginBottom: "1rem" }}>
        <h1 className="panel-title">{reading.title}</h1>
        <p className="panel-subtitle">
          Consultante: {reading.clientName} ({reading.client?.email}) &bull; {reading.spreadType}
        </p>
      </header>
      
      <ReadingEditor reading={reading} availableCards={tarotCards} />
    </div>
  );
}
