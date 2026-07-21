import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { ReadingEditor } from "./reading-editor";
import { tarotCards } from "@/src/data/tarotCards";
import { ArrowLeft } from "lucide-react";
import styles from "./reading-editor.module.css";

export default async function AdminLecturaDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || (!user.roles.includes("ADMIN") && !user.roles.includes("TAROTIST"))) {
    redirect("/login");
  }

  const { id } = await params;
  const reading = await prisma.clientReading.findUnique({
    where: { id },
    include: {
      cards: {
        orderBy: { positionIndex: "asc" },
      },
      client: {
        select: { email: true }
      }
    },
  });

  if (!reading) {
    notFound();
  }

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <Link href="/admin/lecturas" className={styles.heroBackButton}>
            <ArrowLeft size={14} /> Volver al Gestor
          </Link>
          <h1 className={styles.heroTitle}>
            Lectura de
            <span className={styles.heroTitleHighlight}>{reading.title}</span>
          </h1>
          <div className={styles.heroSubtitle}>
            Consultante: <span>{reading.clientName}</span>
            {reading.client?.email && (
              <>
                <span className={styles.dotSeparator}>&bull;</span>
                <span>{reading.client.email}</span>
              </>
            )}
            <span className={styles.dotSeparator}>&bull;</span>
            <span>{reading.spreadType}</span>
          </div>
        </div>
        <div className={styles.heroRight}>
          <img 
            src="/assets/landing/imagen_principal.png" 
            alt="Estudio de Tarot" 
            className={styles.heroImage} 
          />
        </div>
      </div>
      
      <ReadingEditor reading={reading} availableCards={tarotCards} />
    </div>
  );
}
