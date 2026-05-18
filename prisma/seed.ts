import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// This project uses `generator client { provider = "prisma-client" output = "../src/generated/prisma" }`,
// so PrismaClient must be imported from the generated path above.
const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Missing DIRECT_URL / DATABASE_URL for seed execution.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const ROLE_NAMES = ["ADMIN", "TAROTIST", "STUDENT", "CLIENT"] as const;

const PERMISSIONS = [
  { code: "BITACORA_CREATE", description: "Create bitacora entries" },
  { code: "BITACORA_VIEW", description: "View bitacora entries" },
  { code: "TIRADA_CREATE", description: "Create tiradas" },
  { code: "TIRADA_VIEW", description: "View tiradas" },
  { code: "COSTOS_VIEW", description: "View pricing and costs" },
  { code: "USERS_MANAGE", description: "Manage users and roles" },
  { code: "PLANS_MANAGE", description: "Manage plans and permissions" },
] as const;

type PermissionCode = (typeof PERMISSIONS)[number]["code"];

const FREE_PLAN_PERMISSION_CODES = new Set<PermissionCode>([
  "BITACORA_CREATE",
  "BITACORA_VIEW",
  "TIRADA_CREATE",
  "TIRADA_VIEW",
]);

const ADMIN_EMAIL = "codexkhael.app@gmail.com";
// TEMPORARY ONLY:
// - `passwordHash` is temporary seed data for local/dev bootstrap.
// - Do NOT use this value in production.
// - Replace with real hashed credentials once authentication is implemented.
const ADMIN_PASSWORD_HASH = "KhaelCodex147";

async function main() {
  const roles = new Map<string, { id: string; name: string }>();
  for (const roleName of ROLE_NAMES) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
      select: { id: true, name: true },
    });

    roles.set(role.name, role);
  }

  const permissions = new Map<string, { id: string; code: PermissionCode }>();
  for (const permissionItem of PERMISSIONS) {
    const permission = await prisma.permission.upsert({
      where: { code: permissionItem.code },
      update: { description: permissionItem.description },
      create: {
        code: permissionItem.code,
        description: permissionItem.description,
      },
      select: { id: true, code: true },
    });

    permissions.set(permission.code, permission as { id: string; code: PermissionCode });
  }

  const freePlan = await prisma.plan.upsert({
    where: { name: "FREE" },
    update: {
      type: "FREE",
      status: "ACTIVE",
      price: 0,
      currency: "USD",
    },
    create: {
      name: "FREE",
      type: "FREE",
      status: "ACTIVE",
      price: 0,
      currency: "USD",
    },
    select: { id: true, name: true },
  });

  const adminRole = roles.get("ADMIN");
  if (!adminRole) {
    throw new Error("ADMIN role was not created");
  }

  const adminUser = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      name: "Admin Temporal",
      status: "ACTIVE",
      passwordHash: ADMIN_PASSWORD_HASH,
    },
    create: {
      email: ADMIN_EMAIL,
      name: "Admin Temporal",
      status: "ACTIVE",
      passwordHash: ADMIN_PASSWORD_HASH,
    },
    select: { id: true, email: true },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  for (const permission of permissions.values()) {
    // ADMIN role receives all permissions.
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });

    // FREE plan receives only the non-admin tarot usage permissions.
    if (FREE_PLAN_PERMISSION_CODES.has(permission.code)) {
      await prisma.planPermission.upsert({
        where: {
          planId_permissionId: {
            planId: freePlan.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          planId: freePlan.id,
          permissionId: permission.id,
        },
      });
    } else {
      // Cleanup keeps seed idempotent and enforces FREE-plan permission scope.
      await prisma.planPermission.deleteMany({
        where: {
          planId: freePlan.id,
          permissionId: permission.id,
        },
      });
    }
  }

  console.log("Seed completed successfully.");
  console.log(`Admin user: ${adminUser.email}`);
  console.log("Admin password (temporary): KhaelCodex147");
  console.log(`Plan: ${freePlan.name}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
