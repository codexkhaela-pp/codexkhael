export type TarotSpreadPosition = {
  id: number;
  label: string;
  subtitle?: string;
  x: number;
  y: number;
  overlay?: boolean;
  rotate?: boolean;
};

export type TarotSpread = {
  id: string;
  name: string;
  description: string;
  cardCount: number;
  layout:
    | "single"
    | "row"
    | "line"
    | "grid"
    | "horseshoe"
    | "cross-simple"
    | "celtic-cross"
    | "custom-grid"
    | "tree-of-life"
    | "decision"
    | "relationships"
    | "work-finance"
    | "full-moon"
    | "pendulum";
  positions: TarotSpreadPosition[];
};

export const tarotSpreads: TarotSpread[] = [
  {
    id: "situation-blockage-advice",
    name: "3 cartas",
    description: "Situación, bloqueo y consejo para una guía práctica inmediata.",
    cardCount: 3,
    layout: "row",
    positions: [
      { id: 1, label: "Situación", subtitle: "La energía actual", x: 0, y: 0 },
      { id: 2, label: "Bloqueo", subtitle: "Lo que te detiene", x: 1, y: 0 },
      { id: 3, label: "Consejo", subtitle: "La guía para avanzar", x: 2, y: 0 },
    ],
  },
  {
    id: "five-cards",
    name: "5 cartas",
    description: "Lectura de contexto amplio con origen, foco y dirección.",
    cardCount: 5,
    layout: "line",
    positions: [
      { id: 1, label: "Origen", x: 0, y: 0 },
      { id: 2, label: "Situación", x: 1, y: 0 },
      { id: 3, label: "Núcleo", x: 2, y: 0 },
      { id: 4, label: "Aprendizaje", x: 3, y: 0 },
      { id: 5, label: "Dirección", x: 4, y: 0 },
    ],
  },
  {
    id: "horseshoe",
    name: "Herradura",
    description: "Lectura evolutiva en forma de arco para ver el proceso completo.",
    cardCount: 7,
    layout: "horseshoe",
    positions: [
      { id: 1, label: "Pasado", x: 0, y: 3 },
      { id: 2, label: "Presente", x: 1, y: 2 },
      { id: 3, label: "Futuro cercano", x: 2, y: 1 },
      { id: 4, label: "Desafío", x: 3, y: 0 },
      { id: 5, label: "Influencia", x: 4, y: 1 },
      { id: 6, label: "Esperanzas", x: 5, y: 2 },
      { id: 7, label: "Resultado", x: 6, y: 3 },
    ],
  },
  {
    id: "celtic-cross",
    name: "Cruz Celta",
    description: "Profundiza patrones, fuerzas cruzadas y proyección de resultado.",
    cardCount: 10,
    layout: "celtic-cross",
    positions: [
      { id: 1, label: "De dónde vengo", x: 0, y: 1 },
      { id: 2, label: "Situación actual", x: 1, y: 1 },
      { id: 3, label: "A dónde voy", x: 2, y: 1 },
      { id: 4, label: "El reto", x: 1, y: 1, overlay: true, rotate: true },
      { id: 5, label: "Lo que hay en mi mente", x: 1, y: 0 },
      { id: 6, label: "Lo que hay en mi piso / inconsciente", x: 1, y: 2 },
      { id: 7, label: "Cómo veo yo la situación", x: 4, y: 0 },
      { id: 8, label: "Cómo me ven los demás", x: 4, y: 1 },
      { id: 9, label: "Dudas y temores", x: 4, y: 2 },
      { id: 10, label: "Resultado final", x: 4, y: 3 },
    ],
  },
  {
    id: "line-seven",
    name: "Línea de 7 cartas",
    description: "Secuencia temporal para seguir una evolución paso a paso.",
    cardCount: 7,
    layout: "line",
    positions: [
      { id: 1, label: "Inicio", x: 0, y: 0 },
      { id: 2, label: "Impulso", x: 1, y: 0 },
      { id: 3, label: "Desarrollo", x: 2, y: 0 },
      { id: 4, label: "Punto medio", x: 3, y: 0 },
      { id: 5, label: "Tensión", x: 4, y: 0 },
      { id: 6, label: "Resolución", x: 5, y: 0 },
      { id: 7, label: "Síntesis", x: 6, y: 0 },
    ],
  },
  {
    id: "tree-of-life",
    name: "Árbol de la Vida",
    description: "Forma simbólica piramidal para entender el balance interior y exterior.",
    cardCount: 10,
    layout: "tree-of-life",
    positions: [
      { id: 1, label: "Kether (Corona)", x: 2, y: 0 },
      { id: 2, label: "Chokmah (Sabiduría)", x: 1, y: 1 },
      { id: 3, label: "Binah (Entendimiento)", x: 3, y: 1 },
      { id: 4, label: "Chesed (Misericordia)", x: 0, y: 2 },
      { id: 5, label: "Geburah (Severidad)", x: 2, y: 2 },
      { id: 6, label: "Tiphareth (Belleza)", x: 4, y: 2 },
      { id: 7, label: "Netzach (Victoria)", x: 1, y: 3 },
      { id: 8, label: "Hod (Esplendor)", x: 2, y: 3 },
      { id: 9, label: "Yesod (Fundación)", x: 3, y: 3 },
      { id: 10, label: "Malkuth (Reino)", x: 2, y: 4 },
    ],
  },
  {
    id: "decision",
    name: "Decisión",
    description: "Muestra claramente la estructura de elección y el consejo.",
    cardCount: 5,
    layout: "decision",
    positions: [
      { id: 1, label: "La decisión", x: 1, y: 0 },
      { id: 2, label: "Opción A", x: 0, y: 1 },
      { id: 3, label: "Centro", x: 1, y: 1 },
      { id: 4, label: "Opción B", x: 2, y: 1 },
      { id: 5, label: "Consejo final", x: 1, y: 2 },
    ],
  },
  {
    id: "relationships",
    name: "Relaciones",
    description: "Energías frente a frente para evaluar un vínculo.",
    cardCount: 5,
    layout: "relationships",
    positions: [
      { id: 1, label: "Tú", x: 1, y: 0 },
      { id: 2, label: "Tu energía", x: 0, y: 1 },
      { id: 3, label: "Vínculo", x: 1, y: 1 },
      { id: 4, label: "Su energía", x: 2, y: 1 },
      { id: 5, label: "Resultado del vínculo", x: 1, y: 2 },
    ],
  },
  {
    id: "work-finance",
    name: "Trabajo y Finanzas",
    description: "Estabilidad y practicidad para asuntos materiales.",
    cardCount: 5,
    layout: "work-finance",
    positions: [
      { id: 1, label: "Situación actual", x: 1, y: 0 },
      { id: 2, label: "Desafíos", x: 0, y: 1 },
      { id: 3, label: "Recursos", x: 1, y: 1 },
      { id: 4, label: "Posibilidades", x: 2, y: 1 },
      { id: 5, label: "Resultado", x: 1, y: 2 },
    ],
  },
  {
    id: "full-moon",
    name: "Luna Llena",
    description: "Lectura de ciclos evocando una forma semicircular.",
    cardCount: 5,
    layout: "full-moon",
    positions: [
      { id: 1, label: "Nueva fase", x: 0, y: 2 },
      { id: 2, label: "Crecimiento", x: 1, y: 1 },
      { id: 3, label: "Culminación", x: 2, y: 0 },
      { id: 4, label: "Liberación", x: 3, y: 1 },
      { id: 5, label: "Raíz oculta", x: 4, y: 2 },
    ],
  },
  {
    id: "pendulum",
    name: "Péndulo",
    description: "Pregunta central con respuestas directas alrededor.",
    cardCount: 5,
    layout: "pendulum",
    positions: [
      { id: 1, label: "Pregunta", x: 1, y: 0 },
      { id: 2, label: "Sí", x: 0, y: 1 },
      { id: 3, label: "No", x: 1, y: 1 },
      { id: 4, label: "Tal vez", x: 2, y: 1 },
      { id: 5, label: "Consejo final", x: 1, y: 2 },
    ],
  },
];
