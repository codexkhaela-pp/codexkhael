import { Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { AppSession } from "@/lib/auth";

type PrismaSessionClient = Prisma.TransactionClient | typeof prisma;

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_SECONDS * 1000;

export function buildSessionExpiry(from = new Date()): Date {
  return new Date(from.getTime() + SESSION_MAX_AGE_MS);
}

export function getRequestIpAddress(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for")?.trim();
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }

  return request.headers.get("x-real-ip")?.trim() || null;
}

export async function revokeActiveUserSessions(
  db: PrismaSessionClient,
  userId: string,
  revokedAt = new Date(),
): Promise<void> {
  await db.authSession.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt,
      lastSeenAt: revokedAt,
    },
  });
}

export async function createAuthSession(
  db: PrismaSessionClient,
  params: {
    userId: string;
    sessionToken: string;
    userAgent?: string | null;
    ipAddress?: string | null;
    now?: Date;
  },
) {
  const now = params.now ?? new Date();

  return db.authSession.create({
    data: {
      userId: params.userId,
      sessionToken: params.sessionToken,
      userAgent: params.userAgent ?? null,
      ipAddress: params.ipAddress ?? null,
      lastSeenAt: now,
      expiresAt: buildSessionExpiry(now),
    },
    select: {
      id: true,
      userId: true,
      sessionToken: true,
      expiresAt: true,
    },
  });
}

export async function findActiveAuthSession(session: AppSession) {
  const now = new Date();

  return prisma.authSession.findFirst({
    where: {
      userId: session.userId,
      sessionToken: session.sessionToken,
      revokedAt: null,
      expiresAt: {
        gt: now,
      },
      ...(session.sessionId ? { id: session.sessionId } : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          roles: {
            select: {
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function revokeCurrentAuthSession(session: AppSession, revokedAt = new Date()): Promise<void> {
  await prisma.authSession.updateMany({
    where: {
      userId: session.userId,
      sessionToken: session.sessionToken,
      revokedAt: null,
      ...(session.sessionId ? { id: session.sessionId } : {}),
    },
    data: {
      revokedAt,
      lastSeenAt: revokedAt,
    },
  });
}
