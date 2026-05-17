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
    description: "Revisa tiradas de practica con enfoque claro y ordenado.",
    href: "/tiradas",
  },
  {
    title: "Diario",
    description: "Registra avances, dudas y aprendizajes de cada sesion.",
    href: "/diario",
  },
  {
    title: "Practicas",
    description: "Espacio inicial para ejercicios guiados (proximamente).",
    href: null,
  },
];

export const tarotLibraryMock: TarotCard[] = [
  { name: "El Loco", arcana: "Mayor", keyword: "Inicio" },
  { name: "La Sacerdotisa", arcana: "Mayor", keyword: "Intuicion" },
  { name: "Tres de Copas", arcana: "Menor", keyword: "Vinculos" },
  { name: "Nueve de Oros", arcana: "Menor", keyword: "Autonomia" },
];

export const readingsMock: ReadingEntry[] = [
  {
    date: "2026-05-10",
    spread: "Pasado / Presente / Futuro",
    summary: "Lectura enfocada en una decision profesional.",
  },
  {
    date: "2026-05-14",
    spread: "Situacion / Bloqueo / Consejo",
    summary: "Revision de patron repetido en relaciones.",
  },
];

export const journalMock: JournalEntry[] = [
  {
    date: "2026-05-09",
    title: "Simbolos recurrentes",
    note: "Aparece la energia de inicio cuando hay miedo al cambio.",
  },
  {
    date: "2026-05-15",
    title: "Lectura mas concreta",
    note: "Mejoro al definir la pregunta antes de sacar cartas.",
  },
];

