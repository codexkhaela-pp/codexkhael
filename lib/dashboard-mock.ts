// Dashboard mock data used by the visual layer only.
// Keep domain logic in existing modules.

export type ProgressStats = {
  level: string;
  levelNumber: number;
  nextLevel: string;
  progressPercent: number;
  modulesCompleted: number;
  modulesTotal: number;
  lessonsCompleted: number;
  lessonsTotal: number;
  cardsStudied: number;
  cardsTotal: number;
  streakDays: number;
};

export type RecentReading = {
  id: string;
  name: string;
  category: string;
  date: string;
  cardCount: number;
};

export type JournalEntryPreview = {
  id: string;
  date: string;
  consultant: string;
  question: string;
  cardName: string;
  cardImage: string;
};

export type ReviewCard = {
  id: string;
  nameEs: string;
  image: string;
  difficulty: "dificil" | "repasar" | "facil";
};

export type WeeklyChallengeItem = {
  id: string;
  title: string;
  description: string;
  status: string;
};

export type QuickAccess = {
  id: string;
  label: string;
  sub: string;
  href?: string;
  icon: string;
  disabled?: boolean;
};

export const progressMock: ProgressStats = {
  level: "Arcana Mayor",
  levelNumber: 12,
  nextLevel: "Arcana Superior",
  progressPercent: 65,
  modulesCompleted: 18,
  modulesTotal: 28,
  lessonsCompleted: 142,
  lessonsTotal: 250,
  cardsStudied: 46,
  cardsTotal: 78,
  streakDays: 19,
};

export const recentReadingsMock: RecentReading[] = [
  { id: "r1", name: "Tirada de la Cruz Celta", category: "Practica libre", date: "2026-05-17", cardCount: 10 },
  { id: "r2", name: "Tirada de 3 Cartas", category: "Amor y relaciones", date: "2026-05-16", cardCount: 3 },
  { id: "r3", name: "Tirada Si o No", category: "Pregunta concreta", date: "2026-05-15", cardCount: 1 },
  { id: "r4", name: "Tirada de la Herradura", category: "Trabajo y proyectos", date: "2026-05-14", cardCount: 7 },
  { id: "r5", name: "Tirada Espejo", category: "Autoconocimiento", date: "2026-05-13", cardCount: 5 },
  { id: "r6", name: "Tirada Lunar", category: "Emociones", date: "2026-05-12", cardCount: 4 },
  { id: "r7", name: "Tirada de Decisiones", category: "Elecciones", date: "2026-05-11", cardCount: 6 },
  { id: "r8", name: "Tirada de Pareja", category: "Relacion", date: "2026-05-10", cardCount: 5 },
  { id: "r9", name: "Tirada Solar", category: "Direccion vital", date: "2026-05-09", cardCount: 3 },
  { id: "r10", name: "Tirada del Dia", category: "Ritual diario", date: "2026-05-08", cardCount: 1 },
  { id: "r11", name: "Tirada de Expansión", category: "Proposito", date: "2026-05-07", cardCount: 8 },
  { id: "r12", name: "Tirada de Camino", category: "Planeacion", date: "2026-05-06", cardCount: 4 },
];

export const journalEntriesMock: JournalEntryPreview[] = [
  {
    id: "j1",
    date: "2026-05-17",
    consultant: "Valeria",
    question: "Como desbloquear mi energia para tomar esta decision?",
    cardName: "La Estrella",
    cardImage: "/tarot/the_star.jpg",
  },
  {
    id: "j2",
    date: "2026-05-16",
    consultant: "Mateo",
    question: "Que debo priorizar esta semana en lo laboral?",
    cardName: "El Mago",
    cardImage: "/tarot/the_magician.jpg",
  },
  {
    id: "j3",
    date: "2026-05-15",
    consultant: "Camila",
    question: "Como avanzar sin repetir patrones antiguos?",
    cardName: "La Rueda de la Fortuna",
    cardImage: "/tarot/wheel_of_fortune.jpg",
  },
  {
    id: "j4",
    date: "2026-05-14",
    consultant: "Luciano",
    question: "Que energia necesito para cerrar este ciclo?",
    cardName: "La Muerte",
    cardImage: "/tarot/death.jpg",
  },
  {
    id: "j5",
    date: "2026-05-13",
    consultant: "Sofia",
    question: "Cual es la leccion mas importante detras de este conflicto?",
    cardName: "La Justicia",
    cardImage: "/tarot/justice.jpg",
  },
];

export const reviewCardsMock: ReviewCard[] = [
  { id: "major-16", nameEs: "La Torre", image: "/tarot/the_tower.jpg", difficulty: "dificil" },
  { id: "major-05", nameEs: "El Hierofante", image: "/tarot/the_hierophant.jpg", difficulty: "repasar" },
  { id: "major-18", nameEs: "La Luna", image: "/tarot/the_moon.jpg", difficulty: "repasar" },
  { id: "major-20", nameEs: "El Juicio", image: "/tarot/judgement.jpg", difficulty: "facil" },
  { id: "major-00", nameEs: "El Loco", image: "/tarot/the_fool.jpg", difficulty: "facil" },
];

export const weeklyChallengeMock: WeeklyChallengeItem[] = [
  {
    id: "w1",
    title: "Interpretacion intuitiva",
    description: "Realiza 5 tiradas espontaneas en la semana.",
    status: "3/5",
  },
  {
    id: "w2",
    title: "Lectura de simbolos",
    description: "Analiza simbolos recurrentes en 3 cartas.",
    status: "1/3",
  },
  {
    id: "w3",
    title: "Sintesis final",
    description: "Escribe una conclusion breve por cada tirada.",
    status: "0/3",
  },
];

export const quickAccessMock: QuickAccess[] = [
  { id: "new-reading", label: "Nueva Tirada", sub: "Realiza una tirada", href: "/tiradas", icon: "✦" },
  { id: "write-journal", label: "Escribir en Bitacora", sub: "Registra tu dia", href: "/diario", icon: "✍" },
  { id: "my-courses", label: "Mis Cursos", sub: "Continua aprendiendo", icon: "◈" },
  {
    id: "daily-review",
    label: "Repaso Diario",
    sub: "Fortalece tu memoria",
    href: "/cartas?estado=aprendizaje",
    icon: "◍",
  },
  { id: "explore-cards", label: "Explorar Cartas", sub: "Conoce su significado", href: "/cartas", icon: "⬡" },
  { id: "challenges", label: "Desafios", sub: "Proximamente", href: "/desafios", icon: "⚑", disabled: true },
];
