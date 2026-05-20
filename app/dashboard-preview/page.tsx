import fs from "node:fs";
import path from "node:path";
import { DashboardSidebar } from "@/app/components/dashboard-sidebar";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

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

function extractSections(bodyHtml: string): { contentInner: string } {
  const contentMatch = bodyHtml.match(/<div class="content-container">([\s\S]*)<\/div>\s*$/i);

  if (!contentMatch) {
    throw new Error("No se pudo extraer content-container del body fuente.");
  }

  return {
    contentInner: contentMatch[1].trim(),
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

function getProgressByLevel(nivelRaw: number) {
  const level = Math.max(1, Math.floor(nivelRaw || 1));
  const percent = Math.min(100, Math.max(1, level));

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

function applyAssetReplacements(
  html: string,
  logoSrc: string,
  avatarSrc: string,
  displayName: string,
  level: number,
  rankTitle: string,
  progress: ReturnType<typeof getProgressByLevel>,
): string {
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
    .replace(
      /(<div class="progress-text-block">[\s\S]*?<h3>[\s\S]*?<\/h3>\s*<h2>)([\s\S]*?)(<\/h2>)/i,
      `$1${rankTitle}$3`,
    )
    .replace(/(<div class="circle-inner-mask">)\d+%?(<\/div>)/i, `$1${progress.percent}%$2`)
    .replace(/(<strong>)\d+(<span[^>]*>\/28<\/span><\/strong>)/i, `$1${progress.modulesDone}$2`)
    .replace(/(<strong>)\d+(<span[^>]*>\/250<\/span><\/strong>)/i, `$1${progress.lessonsDone}$2`)
    .replace(/(<strong>)\d+(<span[^>]*>\/78<\/span><\/strong>)/i, `$1${progress.cardsDone}$2`);
}

async function resolvePreviewUser() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return {
      displayName: "CodexKhael.app",
      sexo: null as string | null,
      nivel: 12,
    };
  }

  const [profile, userRow] = await Promise.all([
    prisma.userProfile.findUnique({
      where: { userId: currentUser.id },
      select: { displayName: true, sexo: true, level: true },
    }),
    prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { name: true, email: true },
    }),
  ]);

  const fallbackName = userRow?.name?.trim() || userRow?.email?.split("@")[0] || "CodexKhael.app";

  return {
    displayName: profile?.displayName?.trim() || fallbackName,
    sexo: profile?.sexo ?? null,
    nivel: profile?.level ?? 12,
  };
}

export default async function DashboardPreviewPage() {
  const sourceHtml = readSourceHtml();
  const { css, body } = extractStyleAndBody(sourceHtml);

  const previewUser = await resolvePreviewUser();
  const avatarName = getAvatarByLevel(previewUser.sexo, previewUser.nivel);
  const avatarSrc = `/assets/avatar/${avatarName}.png`;
  const logoSrc = "/assets/logo/logo-codex.png";
  const rankTitle = getRankByLevel(previewUser.nivel, previewUser.sexo);
  const progress = getProgressByLevel(previewUser.nivel);

  const replacedBody = applyAssetReplacements(
    body,
    logoSrc,
    avatarSrc,
    previewUser.displayName,
    previewUser.nivel,
    rankTitle,
    progress,
  );
  const { contentInner } = extractSections(replacedBody);

  const adjustedCss =
    css
      .replace(/body\s*\{/g, ".dashboardShell {")
      .replace(
        /background:\s*conic-gradient\(var\(--gold\)\s*0%\s*\d+%,\s*#18142c\s*\d+%\s*100%\);/i,
        `background: conic-gradient(var(--gold) 0% ${progress.percent}%, #18142c ${progress.percent}% 100%);`,
      )
      .replace(
        /(\.horizontal-bar-fill\s*\{[\s\S]*?width:\s*)\d+%/i,
        `$1${progress.percent}%`,
      ) +
    `
    .dashboardShell {
      padding-left: 260px !important;
      width: 100vw !important;
    }

    .dashboardShell > .content-container {
      width: calc(100vw - 260px) !important;
      min-width: 0 !important;
      margin-left: 0 !important;
    }

    main {
      padding: 10px 15px;
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
  `;

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@1,400;1,500&display=swap"
        rel="stylesheet"
      />

      <style dangerouslySetInnerHTML={{ __html: adjustedCss }} />

      <div className="dashboardShell">
        <DashboardSidebar logoSrc={logoSrc} activeKey="inicio" footerMessage={`Nivel ${previewUser.nivel}: ${rankTitle}`} />
        <main
          className="content-container mainContent"
          style={{ width: "calc(100vw - 260px)", minWidth: 0, marginLeft: 0 }}
          dangerouslySetInnerHTML={{ __html: contentInner }}
        />
      </div>
    </>
  );
}
