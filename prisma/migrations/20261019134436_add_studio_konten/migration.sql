-- CreateTable
CREATE TABLE "studio_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brand" TEXT NOT NULL DEFAULT '',
    "niche" TEXT NOT NULL DEFAULT '',
    "audience" TEXT NOT NULL DEFAULT '',
    "voice" TEXT NOT NULL DEFAULT '',
    "pillars" TEXT NOT NULL DEFAULT '',
    "hashtags" TEXT NOT NULL DEFAULT '',
    "cta" TEXT NOT NULL DEFAULT '',
    "platforms" TEXT[] DEFAULT ARRAY['tiktok', 'instagram']::TEXT[],
    "times" JSONB NOT NULL DEFAULT '{"tiktok":"19:00","instagram":"12:00","facebook":"09:00","youtube":"17:00"}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "studio_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "studio_cards" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "stage" TEXT NOT NULL DEFAULT 'ide',
    "platforms" TEXT[] DEFAULT ARRAY['tiktok', 'instagram']::TEXT[],
    "format" TEXT NOT NULL DEFAULT 'short',
    "pillar" TEXT NOT NULL DEFAULT '',
    "hook" TEXT NOT NULL DEFAULT '',
    "script" JSONB NOT NULL DEFAULT '[]',
    "captions" JSONB NOT NULL DEFAULT '{}',
    "tags" JSONB NOT NULL DEFAULT '{}',
    "ytTitle" TEXT NOT NULL DEFAULT '',
    "ytDesc" TEXT NOT NULL DEFAULT '',
    "cta" TEXT NOT NULL DEFAULT '',
    "schedule" TIMESTAMP(3),
    "checklist" JSONB NOT NULL DEFAULT '[]',
    "perf" JSONB NOT NULL DEFAULT '{"views":"","likes":"","comments":"","shares":""}',
    "prompts" JSONB NOT NULL DEFAULT '{}',
    "pOpt" JSONB NOT NULL DEFAULT '{"lang":"en","style":"Sinematik realistis","voice":"Hangat dan santai"}',
    "example" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "studio_cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "studio_profiles_userId_key" ON "studio_profiles"("userId");

-- CreateIndex
CREATE INDEX "studio_cards_userId_stage_idx" ON "studio_cards"("userId", "stage");

-- CreateIndex
CREATE INDEX "studio_cards_userId_schedule_idx" ON "studio_cards"("userId", "schedule");

-- AddForeignKey
ALTER TABLE "studio_profiles" ADD CONSTRAINT "studio_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studio_cards" ADD CONSTRAINT "studio_cards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
