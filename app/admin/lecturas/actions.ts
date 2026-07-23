"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { randomBytes } from "crypto";

export async function searchClients(query: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser || (!currentUser.roles.includes("ADMIN") && !currentUser.roles.includes("TAROTIST"))) {
    throw new Error("No autorizado");
  }

  if (!query || query.trim().length < 2) {
    return [];
  }

  return prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } }
      ]
    },
    select: {
      id: true,
      name: true,
      email: true,
      birthDate: true,
      phone: true
    },
    take: 10
  });
}

export async function createClientReading(data: {
  title: string;
  clientEmail: string;
  clientName: string;
  clientBirthDate?: Date | null;
  clientPhone?: string | null;
  mainQuestion: string;
  category: string;
  spreadType: string;
  readingDate: Date;
  realDeckName?: string;
  realDeckPublisher?: string;
  realDeckAuthor?: string;
  realDeckIllustrator?: string;
  realDeckYear?: string;
}) {
  const user = await getCurrentUser();
  if (!user || (!user.roles.includes("ADMIN") && !user.roles.includes("TAROTIST"))) {
    throw new Error("No autorizado");
  }

  const { 
    title, clientEmail, clientName, clientBirthDate, clientPhone, mainQuestion, 
    category, spreadType, readingDate,
    realDeckName, realDeckPublisher, realDeckAuthor, realDeckIllustrator, realDeckYear
  } = data;
  const email = clientEmail.toLowerCase().trim();

  // Buscar si el cliente ya existe
  let clientUser = await prisma.user.findUnique({
    where: { email },
    select: { 
      id: true, 
      roles: {
        select: {
          role: { select: { name: true } }
        }
      }, 
      passwordHash: true 
    }
  });

  let generatedPassword = null;
  let isNewClient = false;

  // Si no existe, lo creamos
  if (!clientUser) {
    generatedPassword = randomBytes(4).toString('hex'); // Ej: "8f4b2c1a"
    
    // Obtener role CLIENT
    const clientRole = await prisma.role.findUnique({ where: { name: "CLIENT" } });
    
    // Crear el usuario
    const newUser = await prisma.user.create({
      data: {
        email,
        name: clientName,
        passwordHash: generatedPassword, 
        status: "ACTIVE",
        birthDate: clientBirthDate ? new Date(clientBirthDate) : null,
        phone: clientPhone || null,
        requiresPasswordChange: true,
        roles: clientRole ? {
          create: {
            roleId: clientRole.id
          }
        } : undefined
      },
      include: {
        roles: {
          select: { role: { select: { name: true } } }
        }
      }
    });
    clientUser = { id: newUser.id, roles: newUser.roles, passwordHash: newUser.passwordHash };
    isNewClient = true;
  } else {
    // Si ya existe pero no tiene rol CLIENT
    const hasClientRole = clientUser.roles.some((r: any) => r.role.name === "CLIENT");
    if (!hasClientRole) {
       const clientRole = await prisma.role.findUnique({ where: { name: "CLIENT" } });
       if (clientRole) {
         await prisma.userRole.create({
           data: {
             userId: clientUser.id,
             roleId: clientRole.id
           }
         });
       }
    }
    
    // Actualizar datos del cliente (cumpleaños y teléfono) si se proporcionan y no están vacíos
    const updateData: any = {};
    if (clientName && clientName.trim() !== "") {
      updateData.name = clientName;
    }
    if (clientBirthDate) {
      updateData.birthDate = new Date(clientBirthDate);
    }
    if (clientPhone !== undefined) {
      updateData.phone = clientPhone;
    }
    
    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: clientUser.id },
        data: updateData
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
      realDeckName,
      realDeckPublisher,
      realDeckAuthor,
      realDeckIllustrator,
      realDeckYear,
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
