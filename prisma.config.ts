import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma CLI should prefer local development secrets from .env.local.
loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    // Prefer DIRECT_URL for migrate/introspect (non-pooled); fallback to DATABASE_URL.
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
