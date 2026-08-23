export type ChallengeCategory =
  | "TODOS"
  | "DIARIOS"
  | "GUIADOS"
  | "QUE_FALTA"
  | "DETECCION_ERRORES"
  | "INTERPRETACION_LIBRE";

export type ChallengeItem = {
  id: string;
  type: "DAILY" | "GUIDED" | "COMPLETE_CARD" | "ERROR_DETECTION" | "VEIL_READING" | "HARD_DECISION";
  typeLabel: string;
  typeTone: "gold" | "violet" | "blue" | "red" | "green";
  category: Exclude<ChallengeCategory, "TODOS">;
  icon: string;
  name: string;
  description: string;
  difficulty: "Fácil" | "Media" | "Difícil";
  xpReward: number;
  status?: "LOCKED" | "COMPLETED" | "AVAILABLE" | "IN_PROGRESS" | string;
};

export type InterpreterRank = {
  position: number;
  name: string;
  xp: number;
  avatar: string;
};

export type ChallengeQuestion = {
  id: string;
  cardsJson: Array<{ cardId: string; orientation: "UPRIGHT" | "REVERSED" }>;
  questionText: string;
  optionsJson: string[];
  correctAnswer: string;
  explanation: string;
  order: number;
};

export type ChallengeDetail = {
  id: string;
  type: ChallengeItem["type"];
  title: string;
  description: string;
  difficulty: string;
  baseXp: number;
  isDaily: boolean;
  isRepeatable: boolean;
  maxDailyXp: number | null;
  questions: ChallengeQuestion[];
  nextResetAt?: string;
};

export type UserProgressData = {
  totalXp: number;
  currentLevel: number;
  currentStreak: number;
  bestStreak: number;
  levelTitle: string;
  levelDescription: string;
  xpCurrentLevel: number;
  xpNextLevel: number;
  xpProgressPercent: number;
};

export type ChallengeAttemptAnswer = {
  id: string;
  attemptId: string;
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  answeredAt: string;
};

export type ChallengeAttemptPayload = {
  id: string;
  challengeId: string;
  status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
  score: number;
  correctCount: number;
  incorrectCount: number;
  earnedXp: number;
  challenge: ChallengeDetail;
  answers: ChallengeAttemptAnswer[];
};
