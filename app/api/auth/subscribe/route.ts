import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAccess } from "@/lib/access-log";

export const runtime = "nodejs";

type SubscribeBody = {
  name?: string;
  email?: string;
  password?: string;
  plan?: string;
};

type SupportedPlan = "FREE" | "BASIC" | "PRO";

function normalizeEmail(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function normalizePlan(value: string | undefined): SupportedPlan | null {
  if (value === "FREE" || value === "BASIC" || value === "PRO") {
    return value;
  }
  return null;
}

export async function POST(request: Request) {
  let body: SubscribeBody;
  try {
    body = (await request.json()) as SubscribeBody;
  } catch {
    return NextResponse.json({ error: "Body JSON inválido." }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const email = normalizeEmail(body.email);
  const password = body.password ?? "";
  const plan = normalizePlan(body.plan);

  if (!name || !email.includes("@") || password.length < 8 || !plan) {
    return NextResponse.json({ error: "Datos de suscripción inválidos." }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return NextResponse.json({ error: "El usuario ya existe." }, { status: 409 });
  }

  const [studentRole, selectedPlan] = await Promise.all([
    prisma.role.findUnique({ where: { name: "STUDENT" }, select: { id: true } }),
    prisma.plan.findUnique({ where: { name: plan }, select: { id: true, name: true } }),
  ]);

  if (!selectedPlan) {
    return NextResponse.json({ error: "El plan seleccionado no existe." }, { status: 404 });
  }

  const isFreePlan = plan === "FREE";
  const userStatus = isFreePlan ? "ACTIVE" : "INACTIVE";
  const subscriptionStatus = isFreePlan ? "ACTIVE" : "TRIAL";
  const now = new Date();

  const createdUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        name,
        status: userStatus,
        // Temporary plain password until hash/auth module is implemented.
        passwordHash: password,
      },
      select: { id: true, email: true, name: true, status: true },
    });

    if (studentRole) {
      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: studentRole.id,
        },
      });
    }

    await tx.userProfile.create({
      data: {
        userId: user.id,
        displayName: name,
        userPlan: plan,
        billingType: isFreePlan ? null : "MONTHLY",
        planStartedAt: isFreePlan ? now : null,
      },
    });

    await tx.userSubscription.create({
      data: {
        userId: user.id,
        planId: selectedPlan.id,
        status: subscriptionStatus,
        startDate: now,
      },
    });

    return user;
  });

  const userAgent = request.headers.get("user-agent") ?? null;
  await logAccess({
    userId: createdUser.id,
    email: createdUser.email,
    action: "register",
    userAgent,
  });

  if (!isFreePlan) {
    return NextResponse.json(
      {
        ok: true,
        requiresPayment: true,
        message:
          "Tu cuenta fue creada y quedó registrada en el plan seleccionado. Está inactiva hasta confirmar el pago.",
      },
      { status: 201 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      requiresPayment: false,
      message: "Tu cuenta fue creada en el plan Free. Ya puedes iniciar sesión.",
    },
    { status: 201 },
  );
}
