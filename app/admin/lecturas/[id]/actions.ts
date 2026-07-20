"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addCardToReading(readingId: string, cardData: any) {
  try {
    const card = await prisma.clientReadingCard.create({
      data: {
        readingId,
        canonicalCardId: cardData.canonicalCardId,
        visualCardId: cardData.visualCardId,
        cardName: cardData.cardName,
        positionIndex: cardData.positionIndex,
        positionName: cardData.positionName,
        orientation: cardData.orientation || "UPRIGHT",
        x: cardData.x || 50,
        y: cardData.y || 50,
        width: cardData.width || 12,
        height: cardData.height || 22,
        rotation: cardData.rotation || 0,
        zIndex: cardData.zIndex || 1,
        visualOrientation: cardData.visualOrientation || "UPRIGHT",
        relativeScale: cardData.relativeScale || 1.0,
      }
    });
    
    revalidatePath(`/admin/lecturas/${readingId}`);
    return { success: true, card };
  } catch (err) {
    console.error("Error adding card:", err);
    return { success: false, error: "Failed to add card" };
  }
}

export async function updateCardLayout(cardId: string, layout: { x: number, y: number, rotation: number, zIndex: number }) {
  try {
    await prisma.clientReadingCard.update({
      where: { id: cardId },
      data: layout
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: "Failed to update layout" };
  }
}

export async function deleteCard(cardId: string, readingId: string) {
  try {
    await prisma.clientReadingCard.delete({ where: { id: cardId } });
    revalidatePath(`/admin/lecturas/${readingId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: "Failed to delete card" };
  }
}

export async function updateReadingInterpretation(readingId: string, text: string) {
  try {
    await prisma.clientReading.update({
      where: { id: readingId },
      data: { generalInterpretation: text }
    });
    revalidatePath(`/admin/lecturas/${readingId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: "Failed to update interpretation" };
  }
}

export async function updateCardInterpretation(cardId: string, text: string, readingId: string) {
  try {
    await prisma.clientReadingCard.update({
      where: { id: cardId },
      data: { interpretation: text }
    });
    revalidatePath(`/admin/lecturas/${readingId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: "Failed to update interpretation" };
  }
}
