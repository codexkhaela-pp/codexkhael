-- CreateEnum
CREATE TYPE "CardOrientation" AS ENUM ('UPRIGHT', 'REVERSED');

-- CreateEnum
CREATE TYPE "LearningQuizMode" AS ENUM ('IMAGE_TO_MEANING', 'MEANING_TO_CARD', 'MIXED');

-- CreateEnum
CREATE TYPE "LearningQuizQuestionType" AS ENUM ('IMAGE_TO_MEANING', 'MEANING_TO_CARD');

-- CreateEnum
CREATE TYPE "LearningDeckScope" AS ENUM ('FULL_DECK', 'MAJOR_ARCANA', 'MINOR_ARCANA', 'WANDS', 'CUPS', 'SWORDS', 'PENTACLES', 'COURT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "LearningOrientationScope" AS ENUM ('UPRIGHT_ONLY', 'REVERSED_ONLY', 'BOTH');

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "displayName" TEXT,
    "sexo" TEXT,
    "avatarType" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "learningStreak" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningQuizSession" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "mode" "LearningQuizMode" NOT NULL,
    "questionCount" INTEGER NOT NULL,
    "selectedDeckScope" "LearningDeckScope" NOT NULL,
    "selectedCardIdsJson" JSONB,
    "orientationScope" "LearningOrientationScope" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "totalCorrect" INTEGER NOT NULL DEFAULT 0,
    "totalIncorrect" INTEGER NOT NULL DEFAULT 0,
    "scorePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningQuizSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningQuizQuestion" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "cardId" TEXT NOT NULL,
    "orientation" "CardOrientation" NOT NULL,
    "questionType" "LearningQuizQuestionType" NOT NULL,
    "promptText" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "optionsJson" JSONB NOT NULL,
    "selectedAnswer" TEXT,
    "isCorrect" BOOLEAN,
    "answeredAt" TIMESTAMP(3),
    "order_index" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningQuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardLearningProgress" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "cardId" TEXT NOT NULL,
    "orientation" "CardOrientation" NOT NULL,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "incorrectCount" INTEGER NOT NULL DEFAULT 0,
    "currentCorrectStreak" INTEGER NOT NULL DEFAULT 0,
    "currentIncorrectStreak" INTEGER NOT NULL DEFAULT 0,
    "bestCorrectStreak" INTEGER NOT NULL DEFAULT 0,
    "masteryLevel" INTEGER NOT NULL DEFAULT 0,
    "isMastered" BOOLEAN NOT NULL DEFAULT false,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "lastSeenAt" TIMESTAMP(3),
    "lastCorrectAt" TIMESTAMP(3),
    "lastIncorrectAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CardLearningProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "UserProfile_userId_idx" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "LearningQuizSession_userId_idx" ON "LearningQuizSession"("userId");

-- CreateIndex
CREATE INDEX "LearningQuizSession_startedAt_idx" ON "LearningQuizSession"("startedAt");

-- CreateIndex
CREATE INDEX "LearningQuizSession_finishedAt_idx" ON "LearningQuizSession"("finishedAt");

-- CreateIndex
CREATE INDEX "LearningQuizQuestion_sessionId_idx" ON "LearningQuizQuestion"("sessionId");

-- CreateIndex
CREATE INDEX "LearningQuizQuestion_cardId_orientation_idx" ON "LearningQuizQuestion"("cardId", "orientation");

-- CreateIndex
CREATE INDEX "LearningQuizQuestion_order_index_idx" ON "LearningQuizQuestion"("order_index");

-- CreateIndex
CREATE UNIQUE INDEX "CardLearningProgress_userId_cardId_orientation_key" ON "CardLearningProgress"("userId", "cardId", "orientation");

-- CreateIndex
CREATE INDEX "CardLearningProgress_userId_idx" ON "CardLearningProgress"("userId");

-- CreateIndex
CREATE INDEX "CardLearningProgress_userId_orientation_idx" ON "CardLearningProgress"("userId", "orientation");

-- CreateIndex
CREATE INDEX "CardLearningProgress_isMastered_weight_idx" ON "CardLearningProgress"("isMastered", "weight");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningQuizSession" ADD CONSTRAINT "LearningQuizSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningQuizQuestion" ADD CONSTRAINT "LearningQuizQuestion_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LearningQuizSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardLearningProgress" ADD CONSTRAINT "CardLearningProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
