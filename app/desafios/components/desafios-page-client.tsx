"use client";

import { useEffect, useMemo, useState } from "react";
import { DesafiosHero } from "@/app/desafios/components/desafios-hero";
import { DailyChallengeCard } from "@/app/desafios/components/daily-challenge-card";
import { ChallengeFilters } from "@/app/desafios/components/challenge-filters";
import { ChallengesGrid } from "@/app/desafios/components/challenges-grid";
import { UserChallengeProgressPanel } from "@/app/desafios/components/user-challenge-progress-panel";
import { TopInterpretersPanel } from "@/app/desafios/components/top-interpreters-panel";
import { RewardsBanner } from "@/app/desafios/components/rewards-banner";
import type {
  ChallengeCategory,
  ChallengeDetail,
  ChallengeItem,
  InterpreterRank,
  UserProgressData,
} from "@/app/desafios/components/types";
import { toChallengeItem } from "@/app/desafios/components/challenge-mappers";
import styles from "@/app/desafios/desafios.module.css";

type ChallengesApiResponse = {
  items: ChallengeDetail[];
  error?: string;
};

type RankingApiResponse = {
  items: Array<{ position: number; displayName: string; xp: number }>;
  error?: string;
};

const fallbackAvatars = [
  "/assets/avatar/maga2.png",
  "/assets/avatar/mago3.png",
  "/assets/avatar/maga1.png",
  "/assets/avatar/maga3.png",
  "/assets/avatar/mago2.png",
];

export function DesafiosPageClient() {
  const [activeFilter, setActiveFilter] = useState<ChallengeCategory>("TODOS");
  const [rankingPeriod, setRankingPeriod] = useState<"weekly" | "monthly" | "global">("weekly");

  const [challenges, setChallenges] = useState<ChallengeDetail[]>([]);
  const [progress, setProgress] = useState<UserProgressData | null>(null);
  const [ranking, setRanking] = useState<InterpreterRank[]>([]);

  const [loadingChallenges, setLoadingChallenges] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [loadingRanking, setLoadingRanking] = useState(true);

  const [errorChallenges, setErrorChallenges] = useState<string | null>(null);
  const [errorProgress, setErrorProgress] = useState<string | null>(null);
  const [errorRanking, setErrorRanking] = useState<string | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadChallenges() {
      setLoadingChallenges(true);
      setErrorChallenges(null);
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const response = await fetch(`/api/desafios?timezone=${encodeURIComponent(tz)}`, { cache: "no-store", credentials: "same-origin" });
        const data = (await response.json()) as ChallengesApiResponse;
        if (!response.ok) throw new Error(data.error ?? "No se pudieron cargar los desafíos.");
        if (!cancelled) setChallenges(data.items ?? []);
      } catch (error) {
        if (!cancelled) setErrorChallenges(error instanceof Error ? error.message : "Error cargando desafíos.");
      } finally {
        if (!cancelled) setLoadingChallenges(false);
      }
    }
    loadChallenges();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    let cancelled = false;
    async function loadProgress() {
      setLoadingProgress(true);
      setErrorProgress(null);
      try {
        const response = await fetch("/api/me/progreso", { cache: "no-store", credentials: "same-origin" });
        const data = (await response.json()) as UserProgressData & { error?: string };
        if (!response.ok) throw new Error(data.error ?? "No se pudo cargar tu progreso.");
        if (!cancelled) setProgress(data);
      } catch (error) {
        if (!cancelled) setErrorProgress(error instanceof Error ? error.message : "Error cargando progreso.");
      } finally {
        if (!cancelled) setLoadingProgress(false);
      }
    }
    loadProgress();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadRanking() {
      setLoadingRanking(true);
      setErrorRanking(null);
      try {
        const response = await fetch(`/api/desafios/ranking?period=${rankingPeriod}`, {
          cache: "no-store",
          credentials: "same-origin",
        });
        const data = (await response.json()) as RankingApiResponse;
        if (!response.ok) throw new Error(data.error ?? "No se pudo cargar el ranking.");
        if (!cancelled) {
          const mapped = (data.items ?? []).map((entry, index) => ({
            position: entry.position,
            name: entry.displayName,
            xp: entry.xp,
            avatar: fallbackAvatars[index % fallbackAvatars.length],
          }));
          setRanking(mapped);
        }
      } catch (error) {
        if (!cancelled) setErrorRanking(error instanceof Error ? error.message : "Error cargando ranking.");
      } finally {
        if (!cancelled) setLoadingRanking(false);
      }
    }
    loadRanking();
    return () => {
      cancelled = true;
    };
  }, [rankingPeriod]);

  const challengeItems = useMemo<ChallengeItem[]>(() => challenges.map(toChallengeItem), [challenges]);
  const dailyChallenge = useMemo(() => challenges.find((challenge) => challenge.isDaily) ?? null, [challenges]);

  const filteredChallenges = useMemo(() => {
    if (activeFilter === "TODOS") return challengeItems;
    return challengeItems.filter((item) => item.category === activeFilter);
  }, [activeFilter, challengeItems]);

  return (
    <section className={styles.pageGrid}>
      <DesafiosHero />

      <section className={styles.leftColumn}>
        {loadingChallenges ? (
          <section className={styles.dailyCard}>
            <p className={styles.loading}>Cargando desafío del día...</p>
          </section>
        ) : errorChallenges ? (
          <section className={styles.dailyCard}>
            <p className={styles.error}>{errorChallenges}</p>
          </section>
        ) : (
          <DailyChallengeCard challenge={dailyChallenge} onReset={() => setRefreshKey((prev) => prev + 1)} />
        )}

        <section className={styles.availableCard}>
          <h2 className={styles.sectionTitle}>✧ Desafíos disponibles</h2>
          <ChallengeFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />

          {loadingChallenges ? <p className={styles.loading}>Cargando desafíos...</p> : null}
          {errorChallenges ? <p className={styles.error}>{errorChallenges}</p> : null}
          {!loadingChallenges && !errorChallenges && filteredChallenges.length === 0 ? (
            <p className={styles.emptyState}>No hay desafíos disponibles.</p>
          ) : null}

          {!loadingChallenges && !errorChallenges ? <ChallengesGrid challenges={filteredChallenges} /> : null}
        </section>
      </section>

      <aside className={styles.rightColumn}>
        <UserChallengeProgressPanel progress={progress} loading={loadingProgress} error={errorProgress} />
        <TopInterpretersPanel
          interpreters={ranking}
          period={rankingPeriod}
          onChangePeriod={setRankingPeriod}
          loading={loadingRanking}
          error={errorRanking}
        />
      </aside>

    </section>
  );
}
