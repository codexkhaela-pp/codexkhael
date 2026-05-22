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

const LEVEL_XP_TABLE = [
  0, 200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800,
  2100, 2400, 2700, 3000, 3300, 3600, 3900, 4200, 4500, 4800,
  5250, 5700, 6150, 6600, 7050, 7500, 7950, 8400, 8850, 9300,
  9950, 10600, 11250, 11900, 12550, 13200, 13850, 14500, 15150, 15800,
  16700, 17600, 18500, 19400, 20300, 21200, 22100, 23000, 23900, 24800,
  26000, 27200, 28400, 29600, 30800, 32000, 33200, 34400, 35600, 36800,
  38400, 40000, 41600, 43200, 44800, 46400, 48000, 49600, 51200, 52800,
  54900, 57000, 59100, 61200, 63300, 65400, 67500, 69600, 71700, 73800,
  76500, 79200, 81900, 84600, 87300, 90000, 92700, 95400, 98100, 100800,
  104300, 107800, 111300, 114800, 118300, 121800, 125300, 128800, 132300, 136000,
] as const;

function getLevelTitle(level: number) {
  if (level <= 10) return "Iniciado";
  if (level <= 20) return "Astrólogo Lunar";
  if (level <= 30) return "Lector Solar";
  if (level <= 40) return "Cronos del Destino";
  if (level <= 50) return "Adepto Planetario";
  if (level <= 60) return "Maestro de las Estrellas";
  if (level <= 70) return "Guardián del Zodiaco";
  if (level <= 80) return "Magister Templi";
  if (level <= 90) return "Soberano del Oráculo";
  if (level <= 99) return "Arquitecto del Velo";
  return "Ipsissimus del Cosmos";
}

function getLevelDescription(level: number) {
  if (level <= 10) return "Primer contacto formal con el camino del tarot.";
  if (level <= 20) return "Domina la intuición subconsciente, las mareas iniciales.";
  if (level <= 30) return "Aporta luz, claridad y lecturas conscientes y directas.";
  if (level <= 40) return "Entiende el pasado, presente y futuro con precisión.";
  if (level <= 50) return "Gobierna las energías de los planetas asociados a los Arcanos.";
  if (level <= 60) return "Lecturas de alto nivel, visión macroscópica.";
  if (level <= 70) return "Domina todas las facetas de la experiencia humana.";
  if (level <= 80) return "Maestro del Templo Celestial.";
  if (level <= 90) return "Nadie cuestiona sus predicciones o lecturas.";
  if (level <= 99) return "Diseña y entiende la matriz detrás de las cartas.";
  return "El grado máximo de la iluminación hermética.";
}

const BASE_CHALLENGES = [
  {
    type: "DAILY",
    title: "Desafío Diario",
    description: "Tirada diaria de calibración intuitiva.",
    difficulty: "Media",
    baseXp: 50,
    isDaily: true,
    isRepeatable: true,
    maxDailyXp: 50,
    questions: [
      {
        order: 1,
        cardsJson: [
          { cardId: "major-00", orientation: "UPRIGHT" },
          { cardId: "major-03", orientation: "REVERSED" },
          { cardId: "major-19", orientation: "UPRIGHT" },
        ],
        questionText: "¿Qué tono general tiene el día para el consultante?",
        optionsJson: [
          "Inicio luminoso con ajuste emocional",
          "Cierre total y bloqueo definitivo",
          "Ruptura inevitable sin aprendizaje",
          "Estancamiento absoluto sin salida",
        ],
        correctAnswer: "Inicio luminoso con ajuste emocional",
        explanation: "El Loco y El Sol aportan apertura y claridad, con la Emperatriz invertida pidiendo cuidado emocional.",
      },
    ],
  },
  {
    type: "GUIDED",
    title: "La Decisión Difícil",
    description: "Interpreta una decisión compleja con contexto guiado.",
    difficulty: "Fácil",
    baseXp: 40,
    isDaily: false,
    isRepeatable: true,
    maxDailyXp: 120,
    questions: [
      {
        order: 1,
        cardsJson: [
          { cardId: "major-01", orientation: "UPRIGHT" },
          { cardId: "major-02", orientation: "UPRIGHT" },
          { cardId: "major-07", orientation: "REVERSED" },
        ],
        questionText: "¿Cuál es la mejor estrategia para decidir sin precipitarse?",
        optionsJson: [
          "Integrar intuición y acción gradual",
          "Ignorar señales internas y avanzar",
          "Esperar pasivamente sin decidir",
          "Delegar toda la decisión en terceros",
        ],
        correctAnswer: "Integrar intuición y acción gradual",
        explanation: "Mago + Sacerdotisa piden equilibrio entre voluntad e intuición; Carro invertido advierte contra impulsividad.",
      },
      {
        order: 2,
        cardsJson: [
          { cardId: "major-11", orientation: "UPRIGHT" },
          { cardId: "major-14", orientation: "UPRIGHT" },
          { cardId: "major-15", orientation: "REVERSED" },
        ],
        questionText: "¿Qué debe priorizar el consultante para sostener su decisión?",
        optionsJson: [
          "Balance, ética y autocontrol",
          "Control rígido de todo el entorno",
          "Riesgo alto para resultados rápidos",
          "Evitar cualquier cambio por miedo",
        ],
        correctAnswer: "Balance, ética y autocontrol",
        explanation: "Justicia y Templanza señalan equilibrio y criterio; Diablo invertido pide soltar dependencias.",
      },
    ],
  },
  {
    type: "COMPLETE_CARD",
    title: "Carta que completa",
    description: "Identifica la carta que completa una secuencia interpretativa.",
    difficulty: "Media",
    baseXp: 45,
    isDaily: false,
    isRepeatable: true,
    maxDailyXp: 135,
    questions: [
      {
        order: 1,
        cardsJson: [
          { cardId: "major-00", orientation: "UPRIGHT" },
          { cardId: "major-10", orientation: "UPRIGHT" },
          { cardId: "major-13", orientation: "UPRIGHT" },
        ],
        questionText: "¿Qué carta completa mejor la secuencia de transformación?",
        optionsJson: ["La Estrella", "El Colgado", "La Torre", "La Luna"],
        correctAnswer: "La Estrella",
        explanation: "Tras giro y cierre de ciclo, La Estrella integra esperanza y dirección renovada.",
      },
    ],
  },
  {
    type: "ERROR_DETECTION",
    title: "¿Qué está mal?",
    description: "Detecta el error principal de una interpretación.",
    difficulty: "Difícil",
    baseXp: 60,
    isDaily: false,
    isRepeatable: true,
    maxDailyXp: 180,
    questions: [
      {
        order: 1,
        cardsJson: [
          { cardId: "major-16", orientation: "UPRIGHT" },
          { cardId: "major-18", orientation: "REVERSED" },
          { cardId: "major-21", orientation: "UPRIGHT" },
        ],
        questionText: "La lectura dice: 'Todo está en calma, no hay cambios'. ¿Cuál es el error?",
        optionsJson: [
          "Ignora la ruptura necesaria previa al cierre",
          "Se enfoca demasiado en símbolos positivos",
          "Da exceso de peso a la carta final",
          "No considera la orientación de las cartas",
        ],
        correctAnswer: "Ignora la ruptura necesaria previa al cierre",
        explanation: "La Torre + Luna invertida obligan a reconocer crisis y claridad posterior antes del Mundo.",
      },
    ],
  },
  {
    type: "VEIL_READING",
    title: "Lectura del Velo",
    description: "Interpretación libre con foco en coherencia simbólica.",
    difficulty: "Media",
    baseXp: 55,
    isDaily: false,
    isRepeatable: true,
    maxDailyXp: 165,
    questions: [
      {
        order: 1,
        cardsJson: [
          { cardId: "major-09", orientation: "UPRIGHT" },
          { cardId: "major-12", orientation: "REVERSED" },
          { cardId: "major-17", orientation: "UPRIGHT" },
        ],
        questionText: "¿Qué enfoque integra mejor la tirada completa?",
        optionsJson: [
          "Pausa consciente, cambio de perspectiva y fe en el proceso",
          "Forzar resultados inmediatos para salir del bloqueo",
          "Descartar la introspección y priorizar lo externo",
          "Evitar toda toma de decisión en el corto plazo",
        ],
        correctAnswer: "Pausa consciente, cambio de perspectiva y fe en el proceso",
        explanation: "Ermitaño + Colgado invertido + Estrella sugieren maduración interna y visión renovada.",
      },
    ],
  },
  {
    type: "HARD_DECISION",
    title: "Cruce del Destino",
    description: "Desafío de alta exigencia para decisiones críticas.",
    difficulty: "Difícil",
    baseXp: 60,
    isDaily: false,
    isRepeatable: true,
    maxDailyXp: 180,
    questions: [
      {
        order: 1,
        cardsJson: [
          { cardId: "major-04", orientation: "UPRIGHT" },
          { cardId: "major-06", orientation: "REVERSED" },
          { cardId: "major-20", orientation: "UPRIGHT" },
        ],
        questionText: "¿Qué decisión estratégica recomienda la tirada?",
        optionsJson: [
          "Definir estructura clara y responder al llamado con responsabilidad",
          "Evitar compromisos para no generar conflicto",
          "Posponer indefinidamente la decisión central",
          "Delegar la autoridad para evitar presión",
        ],
        correctAnswer: "Definir estructura clara y responder al llamado con responsabilidad",
        explanation: "Emperador y Juicio señalan responsabilidad activa; Enamorados invertida pide corregir indecisión.",
      },
    ],
  },
] as const;

async function seedLevelConfig() {
  for (let level = 1; level <= 100; level += 1) {
    const requiredTotalXp = LEVEL_XP_TABLE[level - 1] ?? 0;
    await prisma.levelConfig.upsert({
      where: { level },
      update: {
        requiredTotalXp,
        title: getLevelTitle(level),
        description: getLevelDescription(level),
        isActive: true,
      },
      create: {
        level,
        requiredTotalXp,
        title: getLevelTitle(level),
        description: getLevelDescription(level),
        isActive: true,
      },
    });
  }
}

async function seedChallenges() {
  for (const challengeSeed of BASE_CHALLENGES) {
    const existing = await prisma.challenge.findFirst({
      where: { title: challengeSeed.title },
      select: { id: true },
    });

    const challenge = existing
      ? await prisma.challenge.update({
          where: { id: existing.id },
          data: {
            type: challengeSeed.type,
            description: challengeSeed.description,
            difficulty: challengeSeed.difficulty,
            baseXp: challengeSeed.baseXp,
            isDaily: challengeSeed.isDaily,
            isRepeatable: challengeSeed.isRepeatable,
            maxDailyXp: challengeSeed.maxDailyXp,
            isActive: true,
          },
        })
      : await prisma.challenge.create({
          data: {
            type: challengeSeed.type,
            title: challengeSeed.title,
            description: challengeSeed.description,
            difficulty: challengeSeed.difficulty,
            baseXp: challengeSeed.baseXp,
            isDaily: challengeSeed.isDaily,
            isRepeatable: challengeSeed.isRepeatable,
            maxDailyXp: challengeSeed.maxDailyXp,
            isActive: true,
          },
        });

    const existingQuestions = await prisma.challengeQuestion.findMany({
      where: { challengeId: challenge.id },
      orderBy: { order: "asc" },
      select: { id: true, order: true },
    });

    for (const questionSeed of challengeSeed.questions) {
      const existingQuestion = existingQuestions.find((entry) => entry.order === questionSeed.order);
      if (existingQuestion) {
        await prisma.challengeQuestion.update({
          where: { id: existingQuestion.id },
          data: {
            cardsJson: questionSeed.cardsJson,
            questionText: questionSeed.questionText,
            optionsJson: questionSeed.optionsJson,
            correctAnswer: questionSeed.correctAnswer,
            explanation: questionSeed.explanation,
          },
        });
      } else {
        await prisma.challengeQuestion.create({
          data: {
            challengeId: challenge.id,
            cardsJson: questionSeed.cardsJson,
            questionText: questionSeed.questionText,
            optionsJson: questionSeed.optionsJson,
            correctAnswer: questionSeed.correctAnswer,
            explanation: questionSeed.explanation,
            order: questionSeed.order,
          },
        });
      }
    }
  }
}

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

  // ── Plans ──────────────────────────────────────────────────────────────────
  const ALL_PLAN_PERMISSION_CODES = new Set<PermissionCode>([
    "BITACORA_CREATE",
    "BITACORA_VIEW",
    "TIRADA_CREATE",
    "TIRADA_VIEW",
  ]);

  const PLANS = [
    {
      name: "FREE",
      type: "FREE" as const,
      price: 0,
      currency: "USD",
      permissionCodes: FREE_PLAN_PERMISSION_CODES,
      limits: [
        { code: "AI_PER_DAY",       value: 5  },
        { code: "READINGS_PER_DAY", value: 3  },
        { code: "BITACORA_LIMIT",   value: 20 },
      ],
    },
    {
      name: "BASIC",
      type: "BASIC" as const,
      price: 9.99,
      currency: "USD",
      permissionCodes: ALL_PLAN_PERMISSION_CODES,
      limits: [
        { code: "AI_PER_DAY",       value: 20 },
        { code: "READINGS_PER_DAY", value: 10 },
        { code: "BITACORA_LIMIT",   value: -1 }, // -1 = unlimited
      ],
    },
    {
      name: "PRO",
      type: "PRO" as const,
      price: 19.99,
      currency: "USD",
      permissionCodes: ALL_PLAN_PERMISSION_CODES,
      limits: [
        { code: "AI_PER_DAY",       value: 200 },
        { code: "READINGS_PER_DAY", value: 200 },
        { code: "BITACORA_LIMIT",   value: -1  },
      ],
    },
  ] as const;

  const seededPlans: { id: string; name: string }[] = [];

  for (const planDef of PLANS) {
    const plan = await prisma.plan.upsert({
      where: { name: planDef.name },
      update: {
        type: planDef.type,
        status: "ACTIVE",
        price: planDef.price,
        currency: planDef.currency,
      },
      create: {
        name: planDef.name,
        type: planDef.type,
        status: "ACTIVE",
        price: planDef.price,
        currency: planDef.currency,
      },
      select: { id: true, name: true },
    });

    seededPlans.push(plan);

    // Upsert PlanLimit records
    for (const limitDef of planDef.limits) {
      const existing = await prisma.planLimit.findFirst({
        where: { planId: plan.id, code: limitDef.code },
      });
      if (existing) {
        await prisma.planLimit.update({
          where: { id: existing.id },
          data: { value: limitDef.value },
        });
      } else {
        await prisma.planLimit.create({
          data: { planId: plan.id, code: limitDef.code, value: limitDef.value },
        });
      }
    }

    // Sync plan permissions
    for (const permission of permissions.values()) {
      if (planDef.permissionCodes.has(permission.code as PermissionCode)) {
        await prisma.planPermission.upsert({
          where: {
            planId_permissionId: { planId: plan.id, permissionId: permission.id },
          },
          update: {},
          create: { planId: plan.id, permissionId: permission.id },
        });
      } else {
        await prisma.planPermission.deleteMany({
          where: { planId: plan.id, permissionId: permission.id },
        });
      }
    }
  }

  const freePlan = seededPlans.find((p) => p.name === "FREE")!;
  // ── End Plans ───────────────────────────────────────────────────────────────

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
  }

  await seedLevelConfig();
  await seedChallenges();

  console.log("Seed completed successfully.");
  console.log(`Admin user: ${adminUser.email}`);
  console.log("Admin password (temporary): KhaelCodex147");
  for (const plan of seededPlans) {
    console.log(`Plan seeded: ${plan.name} (id: ${plan.id})`);
  }
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
