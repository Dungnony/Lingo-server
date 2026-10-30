-- CreateEnum
CREATE TYPE "WordReportReason" AS ENUM ('MEANING', 'PRONUNCIATION', 'EXAMPLE', 'OTHER');

-- AlterTable
ALTER TABLE "Word" ADD COLUMN     "reviewedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "WordReport" (
    "id" UUID NOT NULL,
    "wordId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "reason" "WordReportReason" NOT NULL,
    "note" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "WordReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WordReport_resolvedAt_createdAt_idx" ON "WordReport"("resolvedAt", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WordReport_wordId_userId_key" ON "WordReport"("wordId", "userId");

-- AddForeignKey
ALTER TABLE "WordReport" ADD CONSTRAINT "WordReport_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordReport" ADD CONSTRAINT "WordReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
