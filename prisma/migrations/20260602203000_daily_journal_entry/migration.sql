-- CreateEnum
CREATE TYPE "DailyJournalStatus" AS ENUM ('EMPTY', 'PARTIAL', 'COMPLETED');

-- CreateTable
CREATE TABLE "DailyJournalEntry" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "date" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "cardName" TEXT NOT NULL,
    "orientation" "CardOrientation" NOT NULL,
    "cardImageUrl" TEXT NOT NULL,
    "dailyMessage" TEXT NOT NULL,
    "morningIntention" TEXT,
    "experience" TEXT,
    "manifestedAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "intensity" INTEGER,
    "nightReflection" TEXT,
    "status" "DailyJournalStatus" NOT NULL DEFAULT 'EMPTY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyJournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyJournalEntry_userId_date_key" ON "DailyJournalEntry"("userId", "date");

-- CreateIndex
CREATE INDEX "DailyJournalEntry_userId_date_idx" ON "DailyJournalEntry"("userId", "date");

-- AddForeignKey
ALTER TABLE "DailyJournalEntry" ADD CONSTRAINT "DailyJournalEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
