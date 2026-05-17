import type { Metadata } from "next";
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
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

