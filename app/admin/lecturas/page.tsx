import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { ClientReadingsManager } from "./client-readings-manager";

export default async function AdminLecturasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  
  const hasAccess = user.roles.includes("ADMIN") || user.roles.includes("TAROTIST");
  if (!hasAccess) redirect("/dashboard-preview");

  const readings = await prisma.clientReading.findMany({
    where: { tarotistId: user.id },
    orderBy: { readingDate: "desc" },
    select: {
      id: true,
      clientName: true,
      clientEmail: true,
      title: true,
      category: true,
      mainQuestion: true,
      spreadType: true,
      customSpreadName: true,
      totalCards: true,
      readingDate: true,
      status: true,
      client: {
        select: {
          phone: true
        }
      }
    }
  });

  return <ClientReadingsManager readings={readings} />;
}
