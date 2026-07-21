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

  const existingUser = await prisma.user.findUnique({ 
    where: { email },
    include: { roles: { select: { role: { select: { name: true } } } } }
  });

  let userId: string;

  if (existingUser) {
    // Check if they are already a student
    const isAlreadyStudent = existingUser.roles.some((r: any) => r.role.name === "STUDENT");
    if (isAlreadyStudent) {
      return NextResponse.json({ error: "El usuario ya está registrado en Codex." }, { status: 409 });
    }

    // If they exist but aren't a student, verify password (temporary plain text logic)
    if (existingUser.passwordHash !== password) {
      return NextResponse.json({ 
        error: "Este correo ya existe como Consultante. Usa tu contraseña actual para unirte a Codex, o inicie sesión primero." 
      }, { status: 401 });
    }

    userId = existingUser.id;
  } else {
    const createdUser = await prisma.user.create({
      data: {
        email,
        name,
        status: "ACTIVE",
        passwordHash: password,
      }
    });
    userId = createdUser.id;
  }

  const [studentRole, freePlan] = await Promise.all([
    prisma.role.findUnique({ where: { name: "STUDENT" }, select: { id: true } }),
    prisma.plan.findUnique({ where: { name: "FREE" }, select: { id: true } }),
  ]);

  if (studentRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: userId,
          roleId: studentRole.id,
        },
      },
      update: {},
      create: {
        userId: userId,
        roleId: studentRole.id,
      },
    });
  }

  if (freePlan) {
    await prisma.userSubscription.create({
      data: {
        userId: userId,
        planId: freePlan.id,
        status: "ACTIVE",
      },
    });
  }

  const userAgent = request.headers.get("user-agent") ?? null;
  await logAccess({ userId: userId, email: email, action: "register", userAgent });

  return NextResponse.json({ ok: true, userId: userId }, { status: 201 });
}
