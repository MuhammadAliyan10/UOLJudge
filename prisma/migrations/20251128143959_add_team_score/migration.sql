-- CreateTable
CREATE TABLE "team_score" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "solved_count" INTEGER NOT NULL DEFAULT 0,
    "total_penalty" INTEGER NOT NULL DEFAULT 0,
    "problem_stats" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_score_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "team_score_team_id_key" ON "team_score"("team_id");

-- AddForeignKey
ALTER TABLE "team_score" ADD CONSTRAINT "team_score_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
