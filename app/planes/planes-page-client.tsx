"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthSession } from "@/lib/use-auth-session";
import styles from "./planes.module.css";

export function PlanesPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authSession = useAuthSession();
  const [overriddenPlan, setOverriddenPlan] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const proCardRef = useRef<HTMLElement>(null);

  const fromLimit = searchParams?.get("from") === "limit";
  const currentPlan = overriddenPlan ?? authSession.plan;

  useEffect(() => {
    if (fromLimit && proCardRef.current) {
      setTimeout(() => {
        proCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 500);
    }
  }, [fromLimit]);

  const handleUpgrade = async (planToUpgrade: string) => {
    if (isUpgrading) return;
    setIsUpgrading(true);
    try {
      const res = await fetch("/api/user/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planToUpgrade }),
      });
      if (res.ok) {
        const data = await res.json();
        setOverriddenPlan(data.plan);
        router.replace("/planes");
        router.refresh();
      } else {
        alert("Hubo un error al procesar el plan.");
      }
    } catch (err) {
      console.error(err);
      alert("Error de red al procesar el plan.");
    } finally {
      setIsUpgrading(false);
    }
  };

  if (authSession.status === "loading") {
    return <div style={{ color: "#fff", padding: "40px", textAlign: "center" }}>Cargando sesión...</div>;
  }

  const isFree = currentPlan === "FREE";
  const isBasic = currentPlan === "BASIC";
  const isPro = currentPlan === "PRO";

  return (
    <div className={styles.planesContainer}>
      {fromLimit && (
        <div className={styles.limitBanner}>
          <h2 className={styles.limitBannerTitle}>Ya usaste tus interpretaciones del día</h2>
          <p className={styles.limitBannerText}>
            🕒 <strong>Básico:</strong> hasta 20 interpretaciones por día <br />
            🔮 <strong>Pro:</strong> interpretaciones ilimitadas + explicaciones completas
          </p>
        </div>
      )}

      <header className={styles.planesHeader}>
        <h1 className={styles.planesTitle}>Desbloquea todo tu potencial en el Tarot</h1>
        <p className={styles.planesSubtitle}>Empieza gratis. Mejora cuando quieras.</p>
      </header>

      <div className={styles.grid}>
        <article className={`${styles.planCard} ${styles.cardFree}`}>
          <div className={styles.cardHeader}>
            <h2 className={styles.planName}>🟢 FREE</h2>
            <p className={styles.planSubtitle}>“Descubre el Tarot”</p>
            <p className={styles.planPrice}>Gratis</p>
          </div>
          <div className={styles.cardBody}>
            <ul className={styles.featureList}>
              <li className={styles.featureItem}><div className={styles.featureIcon}>✓</div>78 cartas disponibles</li>
              <li className={styles.featureItem}><div className={styles.featureIcon}>✓</div>Tiradas básicas (3 cartas)</li>
              <li className={styles.featureItem}><div className={styles.featureIcon}>✓</div>Bitácora hasta 20 entradas</li>
              <li className={styles.featureItem}><div className={styles.featureIcon}>✓</div>5 interpretaciones IA por día</li>
              <li className={styles.featureItem}><div className={styles.featureIcon}>✓</div>Interpretaciones simples</li>
              <li className={styles.featureItem}><div className={styles.featureIcon}>✓</div>1 tirada guiada</li>
            </ul>
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.btnFree}`}
              disabled={isBasic || isPro || isUpgrading}
              onClick={() => router.push("/dashboard-preview")}
            >
              {isFree ? "Plan actual" : "Plan actual"}
            </button>
          </div>
        </article>

        <article className={`${styles.planCard} ${styles.cardBasic}`}>
          <div className={styles.cardHeader}>
            <div className={styles.popularBadge}>Más popular</div>
            <h2 className={styles.planName}>🔵 BÁSICO</h2>
            <p className={styles.planSubtitle}>“Desarrolla tu intuición”</p>
            <p className={styles.planPrice}>
              <span className={styles.planCurrency}>S/</span> 9.90
              <span className={styles.planPeriod}>/mes</span>
            </p>
          </div>
          <div className={styles.cardBody}>
            <ul className={styles.featureList}>
              <li className={styles.featureItem}><div className={styles.featureIcon}>✓</div>Tiradas ilimitadas</li>
              <li className={styles.featureItem}><div className={styles.featureIcon}>✓</div>Bitácora ilimitada</li>
              <li className={styles.featureItem}><div className={styles.featureIcon}>✓</div>Relecturas (comentarios)</li>
              <li className={styles.featureItem}><div className={styles.featureIcon}>✓</div>Historial completo</li>
              <li className={styles.featureItem}><div className={styles.featureIcon}>✓</div>XP + racha</li>
              <li className={styles.featureItem}><div className={styles.featureIcon}>✓</div>Alertas de cartas difíciles</li>
              <li className={styles.featureItem}><div className={styles.featureIcon}>✓</div>20 interpretaciones IA por día</li>
              <li className={styles.featureItem}><div className={styles.featureIcon}>✓</div>Interpretaciones más completas</li>
              <li className={styles.featureItem}><div className={styles.featureIcon}>✓</div>Guardado de tiradas en canvas</li>
            </ul>
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.btnBasic}`}
              disabled={isBasic || isPro || isUpgrading}
              onClick={() => handleUpgrade("BASIC")}
            >
              {isBasic ? "Plan actual" : isPro ? "Plan actual" : "Actualizar a Básico"}
            </button>
          </div>
        </article>

        <article ref={proCardRef} className={`${styles.planCard} ${styles.cardPro}`}>
          <div className={styles.cardHeader}>
            <div className={styles.recommendedBadge}>Avanzado</div>
            <h2 className={styles.planName}>🟣 PRO</h2>
            <p className={styles.planSubtitle}>“Maestría y guía avanzada”</p>
            <p className={styles.planPrice}>
              <span className={styles.planCurrency}>S/</span> 24.90
              <span className={styles.planPeriod}>/mes</span>
            </p>
          </div>
          <div className={styles.cardBody}>
            <ul className={styles.featureList}>
              <li className={styles.featureItem}><div className={styles.featureIcon}>✓</div>IA sin límites</li>
              <li className={styles.featureItem}><div className={styles.featureIcon}>✓</div>Interpretaciones guiadas paso a paso (modo mentor)</li>
              <li className={styles.featureItem}><div className={styles.featureIcon}>✓</div>Análisis de patrones</li>
              <li className={styles.featureItem}><div className={styles.featureIcon}>✓</div>Insights automáticos</li>
              <li className={styles.featureItem}><div className={styles.featureIcon}>✓</div>Exportar a PDF (grimorio)</li>
              <li className={styles.featureItem}><div className={styles.featureIcon}>✓</div>Tiradas avanzadas</li>
              <li className={styles.featureItem}><div className={styles.featureIcon}>✓</div>Acceso anticipado a nuevas funciones</li>
              <li className={styles.featureItem} style={{ color: "#f5d769", marginTop: "8px" }}><div className={styles.featureIcon}>⭐</div>Respuestas detalladas y explicadas</li>
              <li className={styles.featureItem} style={{ fontStyle: "italic", opacity: 0.8 }}><div className={styles.featureIcon}>✓</div>Incluye todo lo del plan Básico</li>
            </ul>
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.btnPro}`}
              disabled={isPro || isUpgrading}
              onClick={() => handleUpgrade("PRO")}
            >
              {isPro ? "Plan actual" : "Ir a Pro"}
            </button>
          </div>
        </article>
      </div>

      <div className={styles.planesFooter}>
        <p>✦ Cancela en cualquier momento</p>
        <p>✦ Tus datos siempre son tuyos</p>
      </div>
    </div>
  );
}
