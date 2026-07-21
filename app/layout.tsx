import type { Metadata } from "next";
import { PanelShellGate } from "@/app/components/panel-shell-gate";
import { getCurrentUser } from "@/lib/auth-server";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodexKhael | Tarot, estudio e intuición",
  description:
    "CodexKhael es una plataforma en construcción para estudiar tarot, registrar tiradas y entrenar la interpretación intuitiva con estructura.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const isStudent = user?.roles.includes("STUDENT") ?? false;
  const isAdmin = user?.roles.includes("ADMIN") || user?.roles.includes("TAROTIST");
  const isOnlyClient = user?.roles.length === 1 && user?.roles[0] === "CLIENT";

  // Aquí no podemos usar redirect() si estamos dentro del body, pero sí antes.
  // Sin embargo, si esOnlyClient y está intentando acceder a una ruta protegida (panel),
  // esto debe manejarse en middleware o en el page.tsx respectivo.
  // Como layout corre en cada request, no debemos hacer redirect indiscriminado.

  return (
    <html lang="es">
      <head>
        <meta charSet="UTF-8" />
      </head>
      <body suppressHydrationWarning>
        <PanelShellGate isStudent={isStudent} isAdmin={isAdmin ?? false} isOnlyClient={isOnlyClient}>{children}</PanelShellGate>
      </body>
    </html>
  );
}
