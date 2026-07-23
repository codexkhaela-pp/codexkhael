import { PrismaClient } from "@/src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const CONNECTION_ENV_NAMES = [
  "DIRECT_URL",
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "POSTGRES_URL",
] as const;

function readConnectionVariable(name: (typeof CONNECTION_ENV_NAMES)[number]): string | null {
  const rawValue = process.env[name];
  if (!rawValue) {
    return null;
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    return null;
  }

  // Handles accidental quoted values in environment settings.
  const unquoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1).trim()
      : trimmed;

  return unquoted || null;
}

function resolveConnectionString(): string | null {
  for (const envName of CONNECTION_ENV_NAMES) {
    const value = readConnectionVariable(envName);
    if (value) {
      return value;
    }
  }
  return null;
}

const connectionString = resolveConnectionString();

if (!connectionString) {
  throw new Error(
    `Database connection string is missing. Configure one of: ${CONNECTION_ENV_NAMES.join(", ")}`,
  );
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: connectionString! }),
  });
}

function hasExpectedDelegates(client: PrismaClient): boolean {
  // In dev, Next can retain a singleton created before `prisma generate`.
  // Recreate it if the cached client predates the current schema.
  const schemaVersion = 3; // Incremented from 2 to 3 to invalidate cached prisma instance
  if ((client as any)._schemaVersion !== schemaVersion) {
    (client as any)._schemaVersion = schemaVersion;
    return false;
  }
  return typeof (client as PrismaClient & { dailyJournalEntry?: unknown }).dailyJournalEntry !== "undefined";
}

const cachedPrisma = globalForPrisma.prisma;

export const prisma =
  cachedPrisma && hasExpectedDelegates(cachedPrisma)
    ? cachedPrisma
    : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
