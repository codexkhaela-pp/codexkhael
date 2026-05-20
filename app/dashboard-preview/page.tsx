import fs from "node:fs";
import path from "node:path";
import { DashboardSidebar } from "@/app/components/dashboard-sidebar";

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

function getAvatarByLevel(sexo: string | null | undefined, nivel: number): string {
  const sexoNorm = (sexo ?? "varon").toLowerCase();
  const prefijo = sexoNorm === "mujer" ? "maga" : "mago";

  let tramo = 1;
  if (nivel >= 86) tramo = 3;
  else if (nivel >= 46) tramo = 2;

  return `${prefijo}${tramo}`;
}

function applyAssetReplacements(html: string, logoSrc: string, avatarSrc: string): string {
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
    );
}

export default function DashboardPreviewPage() {
  const sourceHtml = readSourceHtml();
  const { css, body } = extractStyleAndBody(sourceHtml);

  const user: { sexo?: string | null; nivel?: number } = {};
  const nivelUsuario = user?.nivel ?? 12;
  const avatarName = getAvatarByLevel(user?.sexo, nivelUsuario);
  const avatarSrc = `/assets/avatar/${avatarName}.png`;
  const logoSrc = "/assets/logo/logo-codex.png";

  const replacedBody = applyAssetReplacements(body, logoSrc, avatarSrc);
  const { contentInner } = extractSections(replacedBody);

  const adjustedCss = css.replace(/body\s*\{/g, ".dashboardShell {") + `
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
        <DashboardSidebar logoSrc={logoSrc} activeKey="inicio" />
        <main
          className="content-container mainContent"
          style={{ width: "calc(100vw - 260px)", minWidth: 0, marginLeft: 0 }}
          dangerouslySetInnerHTML={{ __html: contentInner }}
        />
      </div>
    </>
  );
}
