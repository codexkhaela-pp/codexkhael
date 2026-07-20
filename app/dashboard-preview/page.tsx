import fs from "node:fs";
import path from "node:path";
import { redirect } from "next/navigation";
import { PreviewShadowContent } from "@/app/dashboard-preview/preview-shadow-content";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { resolveLevelByXp } from "@/lib/xp/service";
import { tarotCards } from "@/src/data/tarotCards";
import { getOrGenerateDailyCard } from "@/lib/carta-del-dia/service";

function readSourceHtml(): string {
  const preferred = path.join(process.cwd(), "docs", "design", "dashboard-final", "dashboard-final.html");
  const fallback = path.join(process.cwd(), "docs", "design", "dashboard-final.html");

  if (fs.existsSync(preferred)) {
    return fs.readFileSync(preferred, "utf8");
  }

  if (fs.existsSync(fallback)) {
    return fs.readFileSync(fallback, "utf8");
  }

  throw new Error("No se encontró dashboard-final.html en docs/design.");
}

function extractStyleAndBody(html: string): { css: string; body: string } {
  const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/i);
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

  if (!styleMatch || !bodyMatch) {
    throw new Error("Fuente inválida: faltan bloques style/body.");
  }

  return { css: styleMatch[1].trim(), body: bodyMatch[1].trim() };
}

function extractSections(bodyHtml: string): { mainInner: string } {
  const contentMatch = bodyHtml.match(/<div class="content-container">([\s\S]*)<\/div>\s*$/i);

  if (!contentMatch) {
    throw new Error("No se pudo extraer content-container del body fuente.");
  }

  const contentInner = contentMatch[1].trim();
  const mainInner = contentInner.replace(/<header>[\s\S]*?<\/header>/i, "").trim();

  return {
    mainInner,
  };
}

function isFeminineSex(sexo: string | null | undefined): boolean {
  const sexoNorm = (sexo ?? "varon").toLowerCase();
  return sexoNorm === "mujer" || sexoNorm === "femenino" || sexoNorm === "f";
}

function getAvatarByLevel(sexo: string | null | undefined, nivel: number): string {
  const prefijo = isFeminineSex(sexo) ? "maga" : "mago";

  let tramo = 1;
  if (nivel >= 86) tramo = 3;
  else if (nivel >= 46) tramo = 2;

  return `${prefijo}${tramo}`;
}

function getRankByLevel(nivelRaw: number, sexo: string | null | undefined): string {
  const nivel = Math.min(100, Math.max(1, Math.floor(nivelRaw || 1)));
  const feminine = isFeminineSex(sexo);

  if (nivel <= 10) return feminine ? "Iniciada" : "Iniciado";
  if (nivel <= 20) return feminine ? "Astróloga Lunar" : "Astrólogo Lunar";
  if (nivel <= 30) return feminine ? "Lectora Solar" : "Lector Solar";
  if (nivel <= 40) return "Cronos del Destino";
  if (nivel <= 50) return feminine ? "Adepta Planetaria" : "Adepto Planetario";
  if (nivel <= 60) return feminine ? "Maestra de las Estrellas" : "Maestro de las Estrellas";
  if (nivel <= 70) return feminine ? "Guardiana del Zodiaco" : "Guardián del Zodiaco";
  if (nivel <= 80) return "Magister Templi";
  if (nivel <= 90) return feminine ? "Soberana del Oráculo" : "Soberano del Oráculo";
  if (nivel <= 99) return feminine ? "Arquitecta del Velo" : "Arquitecto del Velo";
  return feminine ? "Ipsissima del Cosmos" : "Ipsissimus del Cosmos";
}

function getProgressByPercent(percentRaw: number) {
  const percent = Math.min(100, Math.max(1, Math.round(percentRaw)));
  const modulesTotal = 28;
  const lessonsTotal = 250;
  const cardsTotal = 78;

  const modulesDone = Math.max(1, Math.round((percent / 100) * modulesTotal));
  const lessonsDone = Math.max(1, Math.round((percent / 100) * lessonsTotal));
  const cardsDone = Math.max(1, Math.round((percent / 100) * cardsTotal));

  return {
    percent,
    modulesDone,
    modulesTotal,
    lessonsDone,
    lessonsTotal,
    cardsDone,
    cardsTotal,
  };
}

type ReviewCardStatus = "MAL" | "DUDA" | "OK" | "PRACTICAR" | "SUGERIDA";

type ReviewCardItem = {
  cardId: string;
  nameEs: string;
  image: string;
  status: ReviewCardStatus;
  isRealData: boolean;
};

function pickRandomCards<T>(items: T[], count: number): T[] {
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildFallbackReviewCards(): ReviewCardItem[] {
  const randomCards = pickRandomCards(tarotCards, 4);
  return randomCards.map((card, index) => ({
    cardId: card.id,
    nameEs: card.nameEs,
    image: card.image,
    status: index < 2 ? "PRACTICAR" : "SUGERIDA",
    isRealData: false,
  }));
}

async function resolveReviewCards(userId: string | null): Promise<ReviewCardItem[]> {
  if (!userId) {
    return buildFallbackReviewCards();
  }

  const rows = await prisma.cardLearningProgress.findMany({
    where: { userId },
    select: {
      cardId: true,
      correctCount: true,
      incorrectCount: true,
      currentIncorrectStreak: true,
      weight: true,
    },
  });

  if (rows.length === 0) {
    return buildFallbackReviewCards();
  }

  type Aggregate = {
    cardId: string;
    totalCorrect: number;
    totalIncorrect: number;
    totalSeen: number;
    maxIncorrectStreak: number;
    maxWeight: number;
  };

  const aggregateByCard = new Map<string, Aggregate>();
  for (const row of rows) {
    const current = aggregateByCard.get(row.cardId) ?? {
      cardId: row.cardId,
      totalCorrect: 0,
      totalIncorrect: 0,
      totalSeen: 0,
      maxIncorrectStreak: 0,
      maxWeight: 1,
    };
    current.totalCorrect += row.correctCount;
    current.totalIncorrect += row.incorrectCount;
    current.totalSeen += row.correctCount + row.incorrectCount;
    current.maxIncorrectStreak = Math.max(current.maxIncorrectStreak, row.currentIncorrectStreak);
    current.maxWeight = Math.max(current.maxWeight, row.weight);
    aggregateByCard.set(row.cardId, current);
  }

  const tarotById = new Map(tarotCards.map((card) => [card.id, card]));

  const problematic = Array.from(aggregateByCard.values())
    .map((entry) => {
      const accuracy = entry.totalSeen > 0 ? entry.totalCorrect / entry.totalSeen : 1;
      const score =
        entry.totalIncorrect * 5 +
        (1 - accuracy) * 3 +
        entry.maxIncorrectStreak * 2 +
        Math.max(0, entry.maxWeight - 1) * 1.5;
      return { ...entry, accuracy, score };
    })
    .filter((entry) => {
      return (
        entry.totalSeen > 0 &&
        (entry.totalIncorrect > 0 || entry.accuracy < 0.8 || entry.maxIncorrectStreak > 0 || entry.maxWeight > 1.2)
      );
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  if (problematic.length === 0) {
    return buildFallbackReviewCards();
  }

  const cards = problematic
    .map((entry): ReviewCardItem | null => {
      const card = tarotById.get(entry.cardId);
      if (!card) return null;

      let status: ReviewCardStatus = "OK";
      if (
        entry.totalIncorrect >= Math.max(2, entry.totalCorrect) ||
        entry.accuracy < 0.45 ||
        entry.maxIncorrectStreak >= 2
      ) {
        status = "MAL";
      } else if (
        entry.totalIncorrect > 0 ||
        entry.accuracy < 0.75 ||
        entry.maxIncorrectStreak > 0 ||
        entry.maxWeight >= 1.35
      ) {
        status = "DUDA";
      }

      return {
        cardId: card.id,
        nameEs: card.nameEs,
        image: card.image,
        status,
        isRealData: true,
      };
    })
    .filter((item): item is ReviewCardItem => item !== null);

  if (cards.length === 0) {
    return buildFallbackReviewCards();
  }

  return cards;
}

function statusVisual(status: ReviewCardStatus): { dotClass: string; label: string } {
  if (status === "MAL") return { dotClass: "dot-red", label: "Mal" };
  if (status === "DUDA") return { dotClass: "dot-orange", label: "Duda" };
  if (status === "OK") return { dotClass: "dot-green", label: "Ok" };
  if (status === "PRACTICAR") return { dotClass: "dot-orange", label: "Practicar" };
  return { dotClass: "dot-green", label: "Sugerida" };
}

function buildReviewCardsHtml(cards: ReviewCardItem[]): string {
  return cards
    .map((card) => {
      const visual = statusVisual(card.status);
      const safeName = escapeHtml(card.nameEs);
      const safeImage = escapeHtml(card.image);

      return `
        <div class="repaso-node-card" data-card-id="${escapeHtml(card.cardId)}" data-origin="${card.isRealData ? "real" : "fallback"}">
          <div class="repaso-card-symbol">
            <img src="${safeImage}" alt="${safeName}" class="repaso-card-image" loading="lazy" />
          </div>
          <p class="repaso-card-name">${safeName}</p>
          <span class="status-indicator"><i class="dot ${visual.dotClass}"></i> ${visual.label}</span>
        </div>
      `;
    })
    .join("");
}
function buildRecentPracticesHtml(entries: any[]): string {
  if (entries.length === 0) {
    return `<div class="practice-node" style="justify-content: center; opacity: 0.7;">
      <div class="node-details" style="text-align: center;">
        <p style="font-size: 13px; font-style: italic;">Aún no tienes prácticas recientes</p>
      </div>
    </div>`;
  }

  return entries.map(entry => {
    const title = entry.spreadType || "Tirada Libre";
    const subtitle = entry.question ? (entry.question.length > 30 ? entry.question.substring(0, 30) + "..." : entry.question) : "Práctica de Tarot";
    const dateStr = entry.readingDate ? new Date(entry.readingDate).toLocaleDateString("es-ES", { day: "numeric", month: "short" }).replace(".", "") : "Hoy";

    return `
      <div class="practice-node">
          <div class="practice-left-group">
              <div class="mini-tarot-card-render"><span class="mini-tarot-art">🃏</span></div>
              <div class="node-details">
                  <h4>${escapeHtml(title)}</h4>
                  <p>${escapeHtml(subtitle)}</p>
              </div>
          </div>
          <div class="node-date">${dateStr}</div>
      </div>
    `;
  }).join("");
}

function buildDailyCardHtml(dailyCard: any, cardData: any): string {
  if (!dailyCard || !cardData) {
    return `<div class="parchment-container">
        <div class="parchment-content">
            <span>Tu portal de registro</span>
            <h3>El Diario del Mago</h3>
            <p>Explora tu Carta del Día, registra tu Reflexión Nocturna y monitorea tu Historial Energético.</p>
        </div>
    </div>`;
  }

  return `<div class="parchment-container" style="flex-grow: 1;">
      <div class="parchment-content">
          <span style="text-transform:uppercase; font-size:10px; letter-spacing:1px; color:#7d6f5e; font-weight:bold;">Tu Carta del Día</span>
          <h3 style="margin-bottom: 6px;">${escapeHtml(cardData.nameEs)} <span style="font-size:11px; opacity:0.8;">${dailyCard.orientation === "REVERSED" ? "· INVERTIDA" : "· DERECHA"}</span></h3>
          <p style="font-size: 13px; line-height: 1.4; margin:0;">
            ${escapeHtml(dailyCard.mensajeDia)}
          </p>
      </div>
      <div class="tarot-card-right-mock" style="padding:0; overflow:hidden; position:relative; min-width: 75px; width: 75px; height: 115px; border-radius: 6px; border: 1px solid rgba(201,166,107,0.3); flex-shrink: 0; box-shadow: 0 4px 10px rgba(0,0,0,0.5); align-self: center;">
         <img src="${cardData.image}" style="width:100%; height:100%; object-fit:cover; ${dailyCard.orientation === "REVERSED" ? "transform: rotate(180deg);" : ""}" />
      </div>
  </div>`;
}

function buildChallengeHtml(challenge: any): string {
  if (!challenge) {
    return `<div class="challenge-container-box">
        <span class="sub">Desafío Semanal</span>
        <h3>Próximamente</h3>
        <p class="desc">Nuevos desafíos para poner a prueba tu intuición llegarán pronto.</p>
        <div class="challenge-progress-meta">
            <span>Progreso</span>
            <span>0 / 0</span>
        </div>
        <div class="challenge-bar-bg">
            <div class="challenge-bar-fill" style="width: 0%;"></div>
        </div>
    </div>`;
  }

  const title = challenge.title;
  const desc = challenge.description;
  const sub = challenge.isDaily ? "Desafío Diario" : "Desafío Semanal";

  return `<div class="challenge-container-box">
        <span class="sub">${escapeHtml(sub)}</span>
        <h3>${escapeHtml(title)}</h3>
        <p class="desc">${escapeHtml(desc)}</p>
        <div class="challenge-progress-meta">
            <span>Progreso</span>
            <span>0 / 1</span>
        </div>
        <div class="challenge-bar-bg">
            <div class="challenge-bar-fill" style="width: 0%;"></div>
        </div>
    </div>`;
}

async function resolveRecentPractices(userId: string) {
  return await prisma.bitacoraEntry.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 3,
  });
}

async function resolveNextChallenge() {
  return await prisma.challenge.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });
}

function applyAssetReplacements(
  html: string,
  logoSrc: string,
  avatarSrc: string,
  displayName: string,
  level: number,
  rankTitle: string,
  streakDays: number,
  progress: ReturnType<typeof getProgressByPercent>,
  reviewCards: ReviewCardItem[],
  recentPractices: any[],
  challenge: any,
  dailyCard: any,
  cardData: any
): string {
  const reviewCardsHtml = buildReviewCardsHtml(reviewCards);
  const recentPracticesHtml = buildRecentPracticesHtml(recentPractices);
  const challengeHtml = buildChallengeHtml(challenge);
  const dailyCardHtml = buildDailyCardHtml(dailyCard, cardData);

  return html
    .replace(
      /<div class="logo-symbol">[\s\S]*?<\/div>/i,
      `<img src="${logoSrc}" alt="Codex Khael" class="logo-symbol-img" />`,
    )
    .replace(/<div class="logo-text">[\s\S]*?<\/div>/i, "")
    .replace(
      /<div class="user-mini-avatar">[\s\S]*?<\/div>/i,
      `<div class="user-mini-avatar"><img src="${avatarSrc}" alt="Avatar del usuario" class="user-mini-avatar-img" /></div>`,
    )
    .replace(
      /<div class="avatar-img">[\s\S]*?<\/div>/i,
      `<div class="avatar-img"><img src="${avatarSrc}" alt="Avatar del usuario" class="avatar-photo" /></div>`,
    )
    .replace(
      /(<div class="welcome-text">[\s\S]*?<h2>[\s\S]*?<\/h2>\s*<h1>)([\s\S]*?)(<\/h1>)/i,
      `$1${displayName}$3`,
    )
    .replace(/NIVEL\s*\d+/i, `NIVEL ${level}`)
    .replace(/(<div class="streak-number">\s*<i class="streak-fire">[^<]*<\/i>\s*)\d+/i, `$1${streakDays}`)
    .replace(
      /(<div class="progress-text-block">[\s\S]*?<h3>[\s\S]*?<\/h3>\s*<h2>)([\s\S]*?)(<\/h2>)/i,
      `$1${rankTitle}$3`,
    )
    .replace(/(<div class="circle-inner-mask">)\d+%?(<\/div>)/i, `$1${progress.percent}%$2`)
    .replace(/(<strong>)\d+(<span[^>]*>\/28<\/span><\/strong>)/i, `$1${progress.modulesDone}$2`)
    .replace(/(<strong>)\d+(<span[^>]*>\/250<\/span><\/strong>)/i, `$1${progress.lessonsDone}$2`)
    .replace(/(<strong>)\d+(<span[^>]*>\/78<\/span><\/strong>)/i, `$1${progress.cardsDone}$2`)
    .replace(
      /<div class="mini-cards-row-flex">[\s\S]*?<\/div>(\s*<button class="btn-action-trigger">Ver todas las cartas<\/button>)/i,
      `<div class="mini-cards-row-flex">${reviewCardsHtml}</div>$1`,
    )
    .replace(
      /<div class="practice-items-stack">[\s\S]*?<\/div>(\s*<button class="btn-action-trigger">Ver todas mis prácticas<\/button>)/i,
      `<div class="practice-items-stack">${recentPracticesHtml}</div>\n<a href="/bitacora" style="text-decoration:none;">$1</a>`
    )
    .replace(
      /<div class="parchment-container">[\s\S]*?<\/div>\s*<\/div>/i,
      dailyCardHtml
    )
    .replace(
      /(<article class="card">\s*<div class="card-title">✍ )Mi Bitácora(<\/div>[\s\S]*?)<button class="btn-action-trigger">Ir a mi bitácora<\/button>/i,
      `$1Mi Carta del Día$2<a href="/diario" style="text-decoration:none; margin-top: auto;"><button class="btn-action-trigger">Registrar mi experiencia</button></a>`
    )
    .replace(
      /<article class="card">\s*<div class="card-title">âš¡ Accesos RÃ¡pidos<\/div>/i,
      `<article class="card quick-access-card"><div class="card-title">âš¡ Accesos RÃ¡pidos</div>`
    )
    .replace(
      /<div class="quick-actions-quad">[\s\S]*?<\/div>(\s*<button class="btn-action-trigger">Explorar Atajos<\/button>)/i,
      `<div class="quick-actions-quad">
          <a href="/tiradas" style="text-decoration:none; color:inherit; display:block;">
            <div class="action-node">
                <h4>Nueva Tirada</h4>
                <p>Mazo Interactivo</p>
            </div>
          </a>
          <a href="/bitacora" style="text-decoration:none; color:inherit; display:block;">
            <div class="action-node">
                <h4>Bitácora</h4>
                <p>Historial</p>
            </div>
          </a>
          <div class="action-node" style="opacity: 0.4; cursor: not-allowed; border-color: rgba(255,255,255,0.01);">
              <h4>Mis Cursos</h4>
              <p>Próximamente</p>
          </div>
          <a href="/aprendizaje" style="text-decoration:none; color:inherit; display:block;">
            <div class="action-node">
                <h4>Repaso</h4>
                <p>Memoria Activa</p>
            </div>
          </a>
      </div>`
    )
    .replace(
      /<div class="challenge-container-box">[\s\S]*?<\/div>/i,
      challengeHtml
    )
    .replace(
      /(<article class="card">\s*<div class="card-title">✨ Mi Próximo Desafío<\/div>[\s\S]*?)<button class="btn-action-trigger">Ver desafíos<\/button>/i,
      `$1<a href="/desafios" style="text-decoration:none;"><button class="btn-action-trigger">Ver desafíos</button></a>`
    );
}

async function resolvePreviewUser() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?next=/dashboard-preview");
  }

  const [profile, userRow] = await Promise.all([
    prisma.userProfile.findUnique({
      where: { userId: currentUser.id },
      select: { displayName: true, sexo: true, level: true, currentLevel: true, totalXp: true, currentStreak: true },
    }),
    prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { name: true, email: true },
    }),
  ]);

  const fallbackName = userRow?.name?.trim() || userRow?.email?.split("@")[0] || "CodexKhael.app";

  const totalXp = profile?.totalXp ?? 0;
  const levelResolved = await resolveLevelByXp(totalXp);
  const currentLevel = profile?.currentLevel ?? profile?.level ?? levelResolved.level;
  const xpCurrentLevel = levelResolved.requiredTotalXp;
  const xpNextLevel = levelResolved.nextLevelRequiredXp;
  const progressPercent =
    xpNextLevel > xpCurrentLevel
      ? Math.round((Math.max(0, totalXp - xpCurrentLevel) / Math.max(1, xpNextLevel - xpCurrentLevel)) * 100)
      : 100;

  return {
    userId: currentUser.id,
    displayName: profile?.displayName?.trim() || fallbackName,
    sexo: profile?.sexo ?? null,
    nivel: currentLevel,
    totalXp,
    currentStreak: profile?.currentStreak ?? 0,
    rankTitle: levelResolved.title,
    progressPercent,
  };
}

export default async function DashboardPreviewPage() {
  const sourceHtml = readSourceHtml();
  const { css, body } = extractStyleAndBody(sourceHtml);

  const previewUser = await resolvePreviewUser();
  const avatarName = getAvatarByLevel(previewUser.sexo, previewUser.nivel);
  const avatarSrc = `/assets/avatar/${avatarName}.png`;
  const logoSrc = "/assets/logo/logo-codex.png";
  const rankTitle = previewUser.rankTitle || getRankByLevel(previewUser.nivel, previewUser.sexo);
  const progress = getProgressByPercent(previewUser.progressPercent);
  const reviewCards = await resolveReviewCards(previewUser.userId);
  const recentPractices = await resolveRecentPractices(previewUser.userId);
  const challenge = await resolveNextChallenge();
  const dailyCard = await getOrGenerateDailyCard(previewUser.userId);
  const cardData = tarotCards.find(c => c.id === dailyCard?.cardId);

  const replacedBody = applyAssetReplacements(
    body,
    logoSrc,
    avatarSrc,
    previewUser.displayName,
    previewUser.nivel,
    rankTitle,
    previewUser.currentStreak,
    progress,
    reviewCards,
    recentPractices,
    challenge,
    dailyCard,
    cardData
  );
  const { mainInner } = extractSections(replacedBody);

  const premiumDashboardOverrides = String.raw`
      :host {
        --bg-base: #09090f;
        --bg-surface: #111118;
        --purple-dark: #111118;
        --purple-card: #111118;
        --purple-inner: #15131d;
        --purple-accent: rgba(200, 165, 106, 0.14);
        --gold: #c8a56a;
        --gold-bright: #f3ebdd;
        --gold-border: rgba(200, 165, 106, 0.22);
        --gold-border-heavy: rgba(200, 165, 106, 0.34);
        --gold-glow: rgba(200, 165, 106, 0.09);
        --text-light: #f3ebdd;
        --text-muted: #cfc8bb;
        color-scheme: dark;
        display: block;
        height: 100%;
        overflow: auto;
        position: relative;
        background-color: #09090f !important;
        background-image:
          radial-gradient(circle at 16% 14%, rgba(200, 165, 106, 0.08) 0%, transparent 24%),
          radial-gradient(circle at 82% 11%, rgba(200, 165, 106, 0.05) 0%, transparent 22%),
          radial-gradient(circle at 78% 78%, rgba(200, 165, 106, 0.04) 0%, transparent 20%),
          linear-gradient(180deg, rgba(255, 255, 255, 0.015) 0%, rgba(255, 255, 255, 0) 18%),
          #09090f;
      }

      :host::before,
      :host::after {
        content: "";
        position: fixed;
        inset: 0;
        pointer-events: none;
      }

      :host::before {
        opacity: 0.06;
        background-image:
          radial-gradient(circle at 22% 36%, rgba(243, 235, 221, 0.85) 0 1px, transparent 1.4px),
          radial-gradient(circle at 74% 28%, rgba(243, 235, 221, 0.78) 0 1px, transparent 1.4px),
          radial-gradient(circle at 64% 70%, rgba(243, 235, 221, 0.6) 0 1px, transparent 1.6px),
          radial-gradient(circle at 34% 80%, rgba(243, 235, 221, 0.55) 0 1px, transparent 1.4px);
        background-size: 220px 220px, 280px 280px, 340px 340px, 300px 300px;
        mix-blend-mode: screen;
      }

      :host::after {
        background:
          radial-gradient(circle at center, transparent 56%, rgba(0, 0, 0, 0.22) 100%),
          linear-gradient(180deg, rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0.02) 26%, rgba(0, 0, 0, 0.28));
      }

      :host::-webkit-scrollbar {
        width: 10px;
      }

      :host::-webkit-scrollbar-thumb {
        background: rgba(200, 165, 106, 0.26);
        border-radius: 999px;
        border: 2px solid rgba(9, 9, 15, 0.88);
      }

      main {
        position: relative;
        max-width: none;
        margin: 0;
        width: 100%;
        padding: clamp(14px, 1.2vw, 20px);
        display: flex;
        flex-direction: column;
        gap: clamp(18px, 2vw, 24px);
      }

      main > section,
      main > footer {
        width: 100%;
      }

      .logo-symbol-img {
        width: 180px;
        max-width: 100%;
        height: auto;
        display: block;
        object-fit: contain;
      }

      .user-mini-avatar-img {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
        object-position: center 22%;
        border-radius: 50%;
      }

      .avatar-img {
        overflow: hidden;
        position: relative;
      }

      .avatar-photo {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
        object-position: center 22%;
        transform: scale(1.55);
        transform-origin: center 22%;
        border-radius: 50%;
      }

      .welcome-banner {
        position: relative;
        isolation: isolate;
        display: grid;
        grid-template-columns: minmax(0, 1.45fr) 110px minmax(240px, 0.8fr);
        align-items: center;
        gap: clamp(18px, 2vw, 28px);
        padding: clamp(24px, 2.4vw, 34px);
        overflow: hidden;
        border-radius: 30px;
        border: 1px solid rgba(200, 165, 106, 0.22);
        background:
          radial-gradient(circle at 14% 20%, rgba(200, 165, 106, 0.1), transparent 32%),
          radial-gradient(circle at 76% 18%, rgba(243, 235, 221, 0.04), transparent 26%),
          linear-gradient(135deg, rgba(17, 17, 24, 0.98), rgba(21, 19, 29, 0.92));
        box-shadow:
          0 26px 70px rgba(0, 0, 0, 0.4),
          inset 0 1px 0 rgba(255, 255, 255, 0.025);
      }

      .welcome-banner::before {
        content: "";
        position: absolute;
        inset: 0;
        background:
          linear-gradient(90deg, rgba(9, 9, 15, 0.04), rgba(243, 235, 221, 0.02), rgba(9, 9, 15, 0.04)),
          radial-gradient(circle at 86% 18%, rgba(200, 165, 106, 0.11) 0%, transparent 28%);
        opacity: 0.95;
        pointer-events: none;
      }

      .welcome-banner::after {
        content: "✦";
        position: absolute;
        right: 26px;
        bottom: 18px;
        color: rgba(200, 165, 106, 0.3);
        font-size: 16px;
        letter-spacing: 0.2em;
      }

      .user-profile,
      .streak-card,
      .mystic-moon-svg {
        position: relative;
        z-index: 1;
      }

      .user-profile {
        display: flex;
        align-items: center;
        gap: clamp(18px, 2vw, 28px);
        min-width: 0;
      }

      .avatar-container {
        width: clamp(92px, 8vw, 112px);
        height: clamp(92px, 8vw, 112px);
      }

      .avatar-img {
        border: 1.5px solid rgba(200, 165, 106, 0.42);
        background: linear-gradient(180deg, rgba(17, 17, 24, 0.96), rgba(21, 19, 29, 0.96));
        box-shadow:
          0 0 0 8px rgba(200, 165, 106, 0.05),
          0 18px 34px rgba(0, 0, 0, 0.42);
      }

      .avatar-container::after {
        content: "";
        position: absolute;
        inset: -12px;
        border-radius: 50%;
        border: 1px dashed rgba(200, 165, 106, 0.16);
        pointer-events: none;
      }

      .level-badge {
        bottom: -10px;
        background: rgba(9, 9, 15, 0.9);
        border: 1px solid rgba(200, 165, 106, 0.3);
        color: #f3ebdd;
        letter-spacing: 0.22em;
        padding: 4px 14px;
        border-radius: 999px;
      }

      .welcome-text {
        gap: 8px;
        min-width: 0;
      }

      .welcome-text h2 {
        color: rgba(207, 200, 187, 0.84);
        font-size: 12px;
        line-height: 1.2;
        text-transform: uppercase;
        letter-spacing: 0.28em;
      }

      .welcome-text h1 {
        font-family: var(--font-serif);
        font-size: clamp(2rem, 3vw, 3rem);
        line-height: 0.98;
        font-weight: 600;
        letter-spacing: 0.04em;
        color: #f3ebdd;
      }

      .welcome-text p {
        max-width: 34ch;
        color: #c8a56a;
        font-family: var(--font-italic);
        font-size: clamp(0.98rem, 1.35vw, 1.08rem);
        line-height: 1.5;
      }

      .mystic-moon-svg {
        width: 110px;
        height: 110px;
        justify-self: center;
        opacity: 0.34;
        filter: drop-shadow(0 0 18px rgba(200, 165, 106, 0.12));
      }

      .streak-card {
        min-width: 0;
        width: 100%;
        max-width: 260px;
        justify-self: end;
        padding: 20px 22px 18px;
        border-radius: 22px;
        border: 1px solid rgba(200, 165, 106, 0.2);
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent),
          rgba(9, 9, 15, 0.62);
        backdrop-filter: blur(16px);
        box-shadow: 0 18px 42px rgba(0, 0, 0, 0.34);
      }

      .streak-card span {
        color: rgba(207, 200, 187, 0.72);
        letter-spacing: 0.24em;
        font-size: 10px;
      }

      .streak-number {
        color: #f3ebdd;
        margin: 10px 0 8px;
      }

      .streak-fire {
        color: #c8a56a;
        text-shadow: 0 0 12px rgba(200, 165, 106, 0.3);
      }

      .streak-progress-container {
        height: 5px;
        background: rgba(243, 235, 221, 0.06);
      }

      .streak-progress-bar {
        background: linear-gradient(90deg, rgba(200, 165, 106, 0.45), #c8a56a, #f3ebdd);
      }

      .dashboard-grid,
      .bottom-layout-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: clamp(18px, 1.8vw, 24px);
      }

      .card {
        position: relative;
        isolation: isolate;
        min-width: 0;
        padding: 24px;
        border-radius: 22px;
        border: 1px solid rgba(200, 165, 106, 0.22);
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.018), rgba(255, 255, 255, 0)),
          rgba(17, 17, 24, 0.86);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
        backdrop-filter: blur(16px);
        transition:
          transform 240ms ease,
          border-color 240ms ease,
          box-shadow 240ms ease,
          background-color 240ms ease;
      }

      .card::before {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: radial-gradient(circle at top right, rgba(200, 165, 106, 0.08), transparent 34%);
        pointer-events: none;
        opacity: 0.9;
      }

      .card:hover {
        transform: translateY(-4px);
        border-color: rgba(200, 165, 106, 0.32);
        box-shadow: 0 28px 72px rgba(0, 0, 0, 0.42);
      }

      .card > * {
        position: relative;
        z-index: 1;
      }

      .card-title {
        margin-bottom: 20px;
        color: #c8a56a;
        font-family: var(--font-sans);
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.28em;
        text-transform: uppercase;
      }

      .btn-action-trigger {
        width: 100%;
        margin-top: auto;
        padding: 13px 16px;
        border-radius: 14px;
        border: 1px solid rgba(200, 165, 106, 0.3);
        background: rgba(255, 255, 255, 0.02);
        color: #f3ebdd;
        font-family: var(--font-sans);
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.24em;
        text-transform: uppercase;
        box-shadow: none;
      }

      .btn-action-trigger:hover {
        transform: translateY(-2px);
        background: rgba(200, 165, 106, 0.08);
        border-color: rgba(200, 165, 106, 0.44);
        color: #f3ebdd;
        box-shadow: 0 16px 28px rgba(0, 0, 0, 0.22);
      }

      .progress-content-wrapper {
        align-items: center;
        gap: 18px;
        margin-bottom: 18px;
      }

      .progress-text-block h3,
      .stat-node span,
      .challenge-container-box span.sub,
      .node-date {
        color: rgba(207, 200, 187, 0.72);
      }

      .progress-text-block h3 {
        text-transform: uppercase;
        letter-spacing: 0.18em;
        font-size: 10px;
      }

      .progress-text-block h2 {
        font-size: clamp(1.3rem, 2vw, 1.7rem);
        line-height: 1.08;
        color: #f3ebdd;
      }

      .circle-progress-box {
        width: 92px;
        height: 92px;
      }

      .circle-visual-render {
        background: conic-gradient(#c8a56a 0% 65%, rgba(243, 235, 221, 0.08) 65% 100%);
        box-shadow:
          inset 0 0 0 1px rgba(200, 165, 106, 0.12),
          0 12px 24px rgba(0, 0, 0, 0.18);
      }

      .circle-inner-mask {
        width: 74px;
        height: 74px;
        background: #0f0f15;
        color: #f3ebdd;
        font-size: 1rem;
      }

      .horizontal-bar-decor,
      .challenge-bar-bg {
        background: rgba(243, 235, 221, 0.06);
        border-radius: 999px;
      }

      .horizontal-bar-decor {
        height: 5px;
        margin-bottom: 18px;
      }

      .horizontal-bar-fill,
      .challenge-bar-fill {
        background: linear-gradient(90deg, rgba(200, 165, 106, 0.35), #c8a56a, #f3ebdd);
      }

      .stats-strip {
        gap: 10px;
        margin-bottom: 18px;
        padding: 14px 12px;
        border-radius: 16px;
        background: rgba(21, 19, 29, 0.92);
        border: 1px solid rgba(200, 165, 106, 0.12);
      }

      .stat-node strong {
        color: #f3ebdd;
      }

      .practice-items-stack {
        gap: 12px;
        margin-bottom: 18px;
      }

      .practice-node {
        padding: 14px 16px;
        border-radius: 16px;
        background: rgba(21, 19, 29, 0.95);
        border: 1px solid rgba(200, 165, 106, 0.12);
        transition: transform 220ms ease, border-color 220ms ease, background-color 220ms ease;
      }

      .practice-node:hover {
        transform: translateY(-2px);
        border-color: rgba(200, 165, 106, 0.24);
        background: rgba(24, 21, 33, 0.98);
      }

      .practice-left-group {
        gap: 12px;
        min-width: 0;
      }

      .node-details {
        min-width: 0;
      }

      .node-details h4 {
        color: #f3ebdd;
        font-size: 13px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .node-details p {
        color: #cfc8bb;
        opacity: 0.78;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .mini-tarot-card-render {
        width: 38px;
        height: 56px;
        border-radius: 8px;
        background: linear-gradient(180deg, rgba(17, 17, 24, 0.98), rgba(21, 19, 29, 0.98));
        border-color: rgba(200, 165, 106, 0.24);
      }

      .mini-tarot-card-render::before {
        border-color: rgba(200, 165, 106, 0.2);
      }

      .mini-tarot-art {
        color: #c8a56a;
      }

      .card:has(.parchment-container) {
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0)),
          rgba(17, 17, 24, 0.88);
      }

      .parchment-container {
        align-items: center;
        gap: 16px;
        min-height: 188px;
        margin-bottom: 18px;
        padding: 18px;
        border-radius: 18px;
        border: 1px solid rgba(215, 192, 156, 0.8);
        box-shadow:
          0 16px 34px rgba(0, 0, 0, 0.28),
          inset 0 1px 0 rgba(255, 255, 255, 0.28);
        background:
          linear-gradient(180deg, rgba(255, 251, 242, 0.92), rgba(241, 231, 210, 0.98)),
          radial-gradient(circle at top left, rgba(255, 255, 255, 0.58), transparent 36%);
      }

      .parchment-container::before {
        inset: 7px;
        border-color: rgba(130, 108, 80, 0.2);
      }

      .parchment-container::after {
        inset: 10px;
        border-color: rgba(130, 108, 80, 0.16);
      }

      .parchment-content span {
        color: #7d6a50;
        letter-spacing: 0.2em;
      }

      .parchment-content h3 {
        margin-bottom: 8px;
        color: #251c15;
        font-size: 18px;
      }

      .parchment-content p {
        color: #4b4033;
        font-size: 13px;
      }

      .tarot-card-right-mock {
        min-width: 82px !important;
        width: 82px !important;
        height: 126px !important;
        border-radius: 10px !important;
        border-color: rgba(130, 108, 80, 0.32) !important;
        box-shadow: 0 14px 28px rgba(0, 0, 0, 0.22) !important;
      }

      .mini-cards-row-flex {
        gap: 10px;
        margin-bottom: 18px;
      }

      .repaso-node-card {
        width: 24%;
        min-width: 0;
        padding: 10px 8px;
        border-radius: 16px;
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.018), rgba(255, 255, 255, 0)),
          rgba(21, 19, 29, 0.95);
        border: 1px solid rgba(200, 165, 106, 0.14);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
        transition: transform 220ms ease, border-color 220ms ease, box-shadow 220ms ease;
      }

      .repaso-node-card:hover {
        transform: translateY(-3px);
        border-color: rgba(200, 165, 106, 0.28);
        box-shadow: 0 18px 30px rgba(0, 0, 0, 0.24);
      }

      .repaso-card-symbol {
        width: 100%;
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 2px;
      }

      .repaso-card-image {
        width: 88%;
        aspect-ratio: 0.68;
        border-radius: 9px;
        object-fit: cover;
        border: 1px solid rgba(197, 168, 128, 0.34);
        box-shadow: 0 12px 22px rgba(0, 0, 0, 0.26);
      }

      .repaso-card-name {
        margin: 8px 0 6px;
        padding: 0 4px;
        color: #f3ebdd;
        font-size: 10px;
        line-height: 1.25;
        text-align: center;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        min-height: 26px;
      }

      .repaso-node-card span.status-indicator {
        color: rgba(207, 200, 187, 0.8);
        font-size: 9.5px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }

      .dot-red {
        background: #cf785f;
        box-shadow: 0 0 6px rgba(207, 120, 95, 0.7);
      }

      .dot-orange {
        background: #c8a56a;
        box-shadow: 0 0 6px rgba(200, 165, 106, 0.68);
      }

      .dot-green {
        background: #8db786;
        box-shadow: 0 0 6px rgba(141, 183, 134, 0.68);
      }

      .quick-access-card {
        justify-content: flex-start;
      }

      .quick-access-card .quick-actions-quad {
        margin-top: auto;
        margin-bottom: auto;
      }

      .card:has(.quick-actions-quad) {
        justify-content: flex-start;
      }

      .card:has(.quick-actions-quad) .card-title {
        margin-bottom: 0;
      }

      .card:has(.quick-actions-quad) .quick-actions-quad {
        flex: 1;
        align-content: center;
        margin: 0;
      }

      .quick-actions-quad {
        gap: 12px;
      }

      .action-node {
        position: relative;
        min-height: 108px;
        padding: 18px 16px 16px 54px;
        border-radius: 18px;
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.015), rgba(255, 255, 255, 0)),
          rgba(21, 19, 29, 0.94);
        border: 1px solid rgba(200, 165, 106, 0.14);
        transition: transform 220ms ease, border-color 220ms ease, background-color 220ms ease, box-shadow 220ms ease;
      }

      .action-node::before {
        content: "✦";
        position: absolute;
        left: 16px;
        top: 16px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 1px solid rgba(200, 165, 106, 0.24);
        display: grid;
        place-items: center;
        color: #c8a56a;
        font-size: 11px;
        background: rgba(200, 165, 106, 0.06);
      }

      .action-node:hover {
        transform: translateY(-3px);
        border-color: rgba(200, 165, 106, 0.28);
        background: rgba(24, 21, 33, 0.98);
        box-shadow: 0 18px 28px rgba(0, 0, 0, 0.2);
      }

      .action-node h4 {
        color: #f3ebdd;
        font-size: 13px;
        margin-bottom: 4px;
      }

      .action-node p {
        color: rgba(207, 200, 187, 0.8);
        font-size: 11px;
        line-height: 1.45;
      }

      .challenge-container-box {
        margin-bottom: 18px;
        padding: 18px;
        border-radius: 18px;
        border: 1px solid rgba(200, 165, 106, 0.14);
        background:
          radial-gradient(circle at top center, rgba(200, 165, 106, 0.08), transparent 36%),
          rgba(21, 19, 29, 0.95);
      }

      .challenge-container-box span.sub {
        letter-spacing: 0.22em;
        font-size: 10px;
      }

      .challenge-container-box h3 {
        margin-bottom: 6px;
        font-size: 18px;
        color: #f3ebdd;
      }

      .challenge-container-box p.desc {
        margin-bottom: 14px;
        color: #cfc8bb;
      }

      .challenge-progress-meta {
        color: #f3ebdd;
      }

      footer {
        padding: 4px 0 8px;
      }

      .footer-banner-strip {
        min-width: min(100%, 980px);
        max-width: 100%;
        padding: 16px 28px;
        border-radius: 999px;
        background:
          linear-gradient(90deg, rgba(9, 9, 15, 0), rgba(21, 19, 29, 0.92) 14%, rgba(21, 19, 29, 0.92) 86%, rgba(9, 9, 15, 0)),
          transparent;
        border-top: 1px solid rgba(200, 165, 106, 0.18);
        border-bottom: 1px solid rgba(200, 165, 106, 0.18);
        box-shadow: none;
      }

      .footer-banner-strip p {
        color: #c8a56a;
        font-size: 14px;
      }

      footer span.decorative-star {
        color: rgba(200, 165, 106, 0.72);
      }

      .welcome-banner,
      .card,
      .footer-banner-strip {
        animation: panelFade 0.55s ease both;
      }

      .dashboard-grid > .card:nth-child(1) { animation-delay: 70ms; }
      .dashboard-grid > .card:nth-child(2) { animation-delay: 120ms; }
      .dashboard-grid > .card:nth-child(3) { animation-delay: 170ms; }
      .bottom-layout-grid > .card:nth-child(1) { animation-delay: 220ms; }
      .bottom-layout-grid > .card:nth-child(2) { animation-delay: 270ms; }
      .bottom-layout-grid > .card:nth-child(3) { animation-delay: 320ms; }

      @keyframes panelFade {
        from {
          opacity: 0;
          transform: translateY(14px);
        }

        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @media (max-width: 1320px) {
        .welcome-banner {
          grid-template-columns: minmax(0, 1fr) 88px minmax(210px, 0.76fr);
        }
      }

      @media (max-width: 1180px) {
        .dashboard-grid,
        .bottom-layout-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .welcome-banner {
          grid-template-columns: minmax(0, 1fr) minmax(220px, 0.72fr);
        }

        .mystic-moon-svg {
          display: none;
        }
      }

      @media (max-width: 860px) {
        main {
          padding: 16px 14px 24px;
        }

        .dashboard-grid,
        .bottom-layout-grid {
          grid-template-columns: 1fr;
        }

        .welcome-banner {
          grid-template-columns: 1fr;
          align-items: flex-start;
        }

        .streak-card {
          max-width: none;
          justify-self: stretch;
        }

        .progress-content-wrapper,
        .parchment-container,
        .practice-node {
          flex-direction: column;
          align-items: flex-start;
        }

        .tarot-card-right-mock {
          align-self: center;
        }

        .mini-cards-row-flex {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .repaso-node-card {
          width: 100%;
        }
      }

      @media (max-width: 560px) {
        .welcome-banner,
        .card {
          padding: 18px;
          border-radius: 20px;
        }

        .user-profile {
          flex-direction: column;
          align-items: flex-start;
        }

        .welcome-text h1 {
          font-size: 2.2rem;
        }

        .stats-strip,
        .quick-actions-quad {
          grid-template-columns: 1fr;
        }

        .mini-cards-row-flex {
          grid-template-columns: 1fr 1fr;
        }

        .action-node {
          min-height: 92px;
        }

        .footer-banner-strip {
          border-radius: 22px;
          padding: 14px 18px;
        }
      }

      @media (max-width: 390px) {
        main {
          padding-inline: 10px;
        }

        .welcome-text h1 {
          font-size: 1.9rem;
        }

        .mini-cards-row-flex {
          grid-template-columns: 1fr;
        }
      }
    `;

  const adjustedCss = css
    .replace(
      /background:\s*conic-gradient\(var\(--gold\)\s*0%\s*\d+%,\s*#18142c\s*\d+%\s*100%\);/i,
      `background: conic-gradient(var(--gold) 0% ${progress.percent}%, #18142c ${progress.percent}% 100%);`,
    )
    .replace(/(\.horizontal-bar-fill\s*\{[\s\S]*?width:\s*)\d+%/i, `$1${progress.percent}%`) + premiumDashboardOverrides;

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@1,400;1,500&display=swap"
        rel="stylesheet"
      />

      <div style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}>
        <PreviewShadowContent css={adjustedCss} html={mainInner} />
      </div>
    </>
  );
}
