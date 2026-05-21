import type { Metadata } from "next";
import { PanelShellGate } from "@/app/components/panel-shell-gate";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodexKhael | Tarot, estudio e intuición",
  description:
    "CodexKhael es una plataforma en construcción para estudiar tarot, registrar tiradas y entrenar la interpretación intuitiva con estructura.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <meta charSet="UTF-8" />
      </head>
      <body suppressHydrationWarning>
        <PanelShellGate>{children}</PanelShellGate>
      </body>
    </html>
  );
}
