import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { resolvePlanTier } from "@/lib/plans";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const newPlan = resolvePlanTier(body.plan);

    if (newPlan === "FREE") {
      return NextResponse.json({ error: "No puedes hacer downgrade a FREE desde aquí" }, { status: 400 });
    }

    // Actualizamos el plan en la base de datos
    await prisma.userProfile.update({
      where: { userId: user.id },
      data: {
        userPlan: newPlan,
        // Aquí podríamos también actualizar planStartedAt, etc.
      },
    });

    return NextResponse.json({ success: true, plan: newPlan });
  } catch (error) {
    console.error("Error upgrading plan:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
