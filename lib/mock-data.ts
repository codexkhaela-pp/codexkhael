export type DashboardCard = {
  title: string;
  description: string;
  href: string | null;
};

export type TarotCard = {
  name: string;
  arcana: "Mayor" | "Menor";
  keyword: string;
};

export type ReadingEntry = {
  date: string;
  spread: string;
  summary: string;
};

export type JournalEntry = {
  date: string;
  title: string;
  note: string;
};

export const dashboardCards: DashboardCard[] = [
  {
    title: "Biblioteca de cartas",
    description: "Consulta y organiza significados base y notas de estudio.",
    href: "/cartas",
  },
  {
    title: "Mis tiradas",
    description: "Revisa tiradas de práctica con enfoque claro y ordenado.",
    href: "/tiradas",
  },
  {
    title: "Diario Energético",
    description: "Registra cómo se manifestó tu Carta del Día y conserva tu entrada personal.",
    href: "/diario",
  },
  {
    title: "Prácticas",
    description: "Espacio inicial para ejercicios guiados (próximamente).",
    href: null,
  },
];

export const tarotLibraryMock: TarotCard[] = [
  { name: "El Loco", arcana: "Mayor", keyword: "Inicio" },
  { name: "La Sacerdotisa", arcana: "Mayor", keyword: "Intuición" },
  { name: "Tres de Copas", arcana: "Menor", keyword: "Vínculos" },
  { name: "Nueve de Oros", arcana: "Menor", keyword: "Autonomía" },
];

export const readingsMock: ReadingEntry[] = [
  {
    date: "2026-05-10",
    spread: "Pasado / Presente / Futuro",
    summary: "Lectura enfocada en una decisión profesional.",
  },
  {
    date: "2026-05-14",
    spread: "Situación / Bloqueo / Consejo",
    summary: "Revisión de patrón repetido en relaciones.",
  },
];

export const journalMock: JournalEntry[] = [
  {
    date: "2026-05-09",
    title: "Símbolos recurrentes",
    note: "Aparece la energía de inicio cuando hay miedo al cambio.",
  },
  {
    date: "2026-05-15",
    title: "Lectura más concreta",
    note: "Mejoró al definir la pregunta antes de sacar cartas.",
  },
];
