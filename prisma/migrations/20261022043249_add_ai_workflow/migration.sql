-- CreateTable
CREATE TABLE "ai_workflows" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Workflow Baru',
    "nodes" JSONB NOT NULL DEFAULT '[]',
    "edges" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_workflows_userId_idx" ON "ai_workflows"("userId");

-- AddForeignKey
ALTER TABLE "ai_workflows" ADD CONSTRAINT "ai_workflows_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
