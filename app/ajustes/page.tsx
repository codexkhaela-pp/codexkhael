import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { AjustesClient } from "./components/ajustes-client";

export default async function AjustesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [dbUser, userProfile] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true, name: true },
    }),
    prisma.userProfile.findUnique({
      where: { userId: user.id },
      select: { displayName: true },
    }),
  ]);

  if (!dbUser) {
    redirect("/login");
  }

  // Obtenemos la suscripción activa si la hay, sino plan gratuito.
  const activeSubscription = await prisma.userSubscription.findFirst({
    where: { userId: user.id, status: "ACTIVE" },
    include: { plan: true },
  });

  const planName = activeSubscription?.plan?.name || "Gratuito";
  const displayName = userProfile?.displayName || dbUser.name || user.email.split("@")[0];

  return (
    <AjustesClient
      initialDisplayName={displayName}
      email={dbUser.email}
      planName={planName}
    />
  );
}
