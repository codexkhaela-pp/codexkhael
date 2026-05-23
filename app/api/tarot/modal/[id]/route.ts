import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { resolvePlanTier } from "@/lib/plans";
import { filtrarCartaPorPlan } from "@/lib/tarot-filter";
import { getTarotCardById } from "@/lib/tarot-data";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    
    const url = new URL(req.url);
    const simulatePlan = url.searchParams.get("simulatePlan");

    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
    });
    
    let plan = resolvePlanTier(profile?.userPlan);
    
    if (process.env.NODE_ENV === "development" && simulatePlan) {
      plan = simulatePlan as any;
    }

    const carta = getTarotCardById(id);

    if (!carta) {
      return NextResponse.json({ error: "Carta no encontrada" }, { status: 404 });
    }

    const filteredCarta = filtrarCartaPorPlan(carta, plan);

    return NextResponse.json({ carta: filteredCarta, plan });
  } catch (error) {
    console.error("Error fetching tarot card modal data:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
