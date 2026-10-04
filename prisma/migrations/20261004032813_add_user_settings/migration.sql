-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'neon',
    "fontSize" TEXT NOT NULL DEFAULT 'normal',
    "compactMode" BOOLEAN NOT NULL DEFAULT false,
    "particlesOn" BOOLEAN NOT NULL DEFAULT true,
    "accentColor" TEXT NOT NULL DEFAULT '#5ee7ff',
    "aiModel" TEXT NOT NULL DEFAULT 'gemini-3.5-flash',
    "aiTemperature" DOUBLE PRECISION NOT NULL DEFAULT 0.9,
    "aiSystemPrompt" TEXT,
    "autoSaveChat" BOOLEAN NOT NULL DEFAULT true,
    "emailReminder" BOOLEAN NOT NULL DEFAULT false,
    "browserNotify" BOOLEAN NOT NULL DEFAULT false,
    "dailySummary" BOOLEAN NOT NULL DEFAULT false,
    "summaryTime" TEXT NOT NULL DEFAULT '20:00',
    "language" TEXT NOT NULL DEFAULT 'id',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Jakarta',
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_userId_key" ON "user_settings"("userId");

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
