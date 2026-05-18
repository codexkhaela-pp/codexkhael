import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAccess } from "@/lib/access-log";

export const runtime = "nodejs";

type RegisterBody = {
  email?: string;
  password?: string;
  name?: string;
};

function normalizeEmail(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export async function POST(request: Request) {
  let body: RegisterBody;
  try {
    body = (await request.json()) as RegisterBody;
  } catch {
    return NextResponse.json({ error: "Body JSON inválido." }, { status: 400 });
  }

  const email = normalizeEmail(body.email);
  const password = body.password ?? "";
  const name = body.name?.trim() || null;

  if (!email.includes("@") || password.length < 8) {
    return NextResponse.json({ error: "Datos de registro inválidos." }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (exists) {
    return NextResponse.json({ error: "El usuario ya existe." }, { status: 409 });
  }

  const createdUser = await prisma.user.create({
    data: {
      email,
      name,
      status: "ACTIVE",
      // Temporary plain password until hash/auth module is implemented.
      passwordHash: password,
    },
    select: { id: true, email: true },
  });

  const [studentRole, freePlan] = await Promise.all([
    prisma.role.findUnique({ where: { name: "STUDENT" }, select: { id: true } }),
    prisma.plan.findUnique({ where: { name: "FREE" }, select: { id: true } }),
  ]);

  if (studentRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: createdUser.id,
          roleId: studentRole.id,
        },
      },
      update: {},
      create: {
        userId: createdUser.id,
        roleId: studentRole.id,
      },
    });
  }

  if (freePlan) {
    await prisma.userSubscription.create({
      data: {
        userId: createdUser.id,
        planId: freePlan.id,
        status: "ACTIVE",
      },
    });
  }

  const userAgent = request.headers.get("user-agent") ?? null;
  await logAccess({ userId: createdUser.id, email: createdUser.email, action: "register", userAgent });

  return NextResponse.json({ ok: true, user: createdUser }, { status: 201 });
}
