-- CreateTable
CREATE TABLE "AssistantDailyUsage" (
    "userId" UUID NOT NULL,
    "localDate" DATE NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AssistantDailyUsage_pkey" PRIMARY KEY ("userId","localDate")
);

-- AddForeignKey
ALTER TABLE "AssistantDailyUsage" ADD CONSTRAINT "AssistantDailyUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
