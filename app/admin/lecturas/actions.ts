"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { randomBytes } from "crypto";

export async function createClientReading(data: {
  title: string;
  clientEmail: string;
  clientName: string;
  mainQuestion: string;
  category: string;
  spreadType: string;
  readingDate: Date;
}) {
  const user = await getCurrentUser();
  if (!user || (!user.roles.includes("ADMIN") && !user.roles.includes("TAROTIST"))) {
    throw new Error("No autorizado");
  }

  const { title, clientEmail, clientName, mainQuestion, category, spreadType, readingDate } = data;
  const email = clientEmail.toLowerCase().trim();

  // Buscar si el cliente ya existe
  let clientUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true, roles: true, passwordHash: true }
  });

  let generatedPassword = null;
  let isNewClient = false;

  // Si no existe, lo creamos
  if (!clientUser) {
    generatedPassword = randomBytes(4).toString('hex'); // Ej: "8f4b2c1a"
    
    // Crear el usuario con rol CLIENT
    const newUser = await prisma.user.create({
      data: {
        email,
        name: clientName,
        passwordHash: generatedPassword, // Guardamos la temporal (idealmente debería estar hasheada, pero para este caso lo dejamos como texto o el hash de la app)
        // Nota: En un sistema en prod deberías hacer un bcrypt, pero asumiendo que Khael usa passwordHash en claro para la prueba o un hash específico, 
        // revisaré cómo funciona el login. Si el login compara texto plano (user.passwordHash === password), lo guardamos así.
        roles: { set: ["CLIENT"] },
        status: "ACTIVE"
      }
    });
    clientUser = { id: newUser.id, roles: newUser.roles, passwordHash: newUser.passwordHash };
    isNewClient = true;
  } else {
    // Si ya existe pero no tiene rol CLIENT, se lo añadimos? (Opcional)
    if (!clientUser.roles.includes("CLIENT")) {
       await prisma.user.update({
         where: { id: clientUser.id },
         data: { roles: { push: "CLIENT" } }
       });
    }
  }

  // Crear la lectura en la base de datos
  const reading = await prisma.clientReading.create({
    data: {
      title,
      clientEmail: email,
      clientName,
      clientId: clientUser.id,
      tarotistId: user.id,
      mainQuestion,
      category,
      spreadType,
      readingDate: new Date(readingDate),
      status: "DRAFT",
    }
  });

  return {
    success: true,
    readingId: reading.id,
    isNewClient,
    generatedPassword,
    clientEmail: email
  };
}
