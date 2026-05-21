-- CreateEnum
CREATE TYPE "XpSourceType" AS ENUM ('CHALLENGE_COMPLETED', 'QUIZ_COMPLETED', 'COURSE_LESSON_COMPLETED', 'JOURNAL_ENTRY_CREATED', 'STREAK_BONUS', 'MANUAL_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "ChallengeType" AS ENUM ('DAILY', 'GUIDED', 'COMPLETE_CARD', 'ERROR_DETECTION', 'VEIL_READING', 'HARD_DECISION');

-- CreateEnum
CREATE TYPE "ChallengeAttemptStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "bestStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "currentLevel" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "currentStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastStreakDate" TIMESTAMP(3),
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'America/Lima',
ADD COLUMN     "totalXp" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "LevelConfig" (
    "id" UUID NOT NULL,
    "level" INTEGER NOT NULL,
    "requiredTotalXp" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LevelConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserXpTransaction" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "sourceType" "XpSourceType" NOT NULL,
    "sourceId" TEXT,
    "xpAmount" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserXpTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Challenge" (
    "id" UUID NOT NULL,
    "type" "ChallengeType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "baseXp" INTEGER NOT NULL,
    "isDaily" BOOLEAN NOT NULL DEFAULT false,
    "isRepeatable" BOOLEAN NOT NULL DEFAULT true,
    "maxDailyXp" INTEGER,
    "activeFrom" TIMESTAMP(3),
    "activeTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeQuestion" (
    "id" UUID NOT NULL,
    "challengeId" UUID NOT NULL,
    "cardsJson" JSONB NOT NULL,
    "questionText" TEXT NOT NULL,
    "optionsJson" JSONB NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChallengeQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserChallengeAttempt" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "challengeId" UUID NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" "ChallengeAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "incorrectCount" INTEGER NOT NULL DEFAULT 0,
    "earnedXp" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserChallengeAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserChallengeAnswer" (
    "id" UUID NOT NULL,
    "attemptId" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "selectedAnswer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserChallengeAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LevelConfig_level_key" ON "LevelConfig"("level");

-- CreateIndex
CREATE INDEX "LevelConfig_isActive_level_idx" ON "LevelConfig"("isActive", "level");

-- CreateIndex
CREATE INDEX "UserXpTransaction_userId_createdAt_idx" ON "UserXpTransaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserXpTransaction_sourceType_sourceId_idx" ON "UserXpTransaction"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "Challenge_isActive_type_idx" ON "Challenge"("isActive", "type");

-- CreateIndex
CREATE INDEX "Challenge_isDaily_isActive_idx" ON "Challenge"("isDaily", "isActive");

-- CreateIndex
CREATE INDEX "ChallengeQuestion_challengeId_order_index_idx" ON "ChallengeQuestion"("challengeId", "order_index");

-- CreateIndex
CREATE INDEX "UserChallengeAttempt_userId_startedAt_idx" ON "UserChallengeAttempt"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "UserChallengeAttempt_challengeId_status_idx" ON "UserChallengeAttempt"("challengeId", "status");

-- CreateIndex
CREATE INDEX "UserChallengeAnswer_attemptId_answeredAt_idx" ON "UserChallengeAnswer"("attemptId", "answeredAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserChallengeAnswer_attemptId_questionId_key" ON "UserChallengeAnswer"("attemptId", "questionId");

-- AddForeignKey
ALTER TABLE "UserXpTransaction" ADD CONSTRAINT "UserXpTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeQuestion" ADD CONSTRAINT "ChallengeQuestion_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserChallengeAttempt" ADD CONSTRAINT "UserChallengeAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserChallengeAttempt" ADD CONSTRAINT "UserChallengeAttempt_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserChallengeAnswer" ADD CONSTRAINT "UserChallengeAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "UserChallengeAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserChallengeAnswer" ADD CONSTRAINT "UserChallengeAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ChallengeQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

