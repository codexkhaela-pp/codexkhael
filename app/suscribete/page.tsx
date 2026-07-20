import type { Metadata } from "next";
import { SuscribeteFlow } from "@/app/suscribete/suscribete-flow";

export const metadata: Metadata = {
  title: "Suscríbete | Códex Kahel",
  description:
    "Crea tu acceso y elige el plan ideal para comenzar tu camino dentro de Códex Kahel.",
};

export default function SuscribetePage() {
  return <SuscribeteFlow />;
}
