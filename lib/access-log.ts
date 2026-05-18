import { prisma } from "@/lib/prisma";

export type AccessAction = "login" | "logout" | "register" | "password_reset";

export async function logAccess(params: {
  userId: string;
  email: string;
  action: AccessAction;
  userAgent?: string | null;
}): Promise<void> {
  try {
    await prisma.accessLog.create({
      data: {
        userId: params.userId,
        email: params.email,
        action: params.action,
        userAgent: params.userAgent ?? null,
      },
    });
  } catch {
    // Non-blocking: access log failure should never break auth flow
    console.error("Failed to write access log", params.action, params.email);
  }
}
