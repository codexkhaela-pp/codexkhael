import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodexKhael | Tarot, estudio e intuicion",
  description:
    "CodexKhael es una plataforma en construccion para estudiar tarot, registrar tiradas y entrenar la interpretacion intuitiva con estructura.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

