/*
  Warnings:

  - You are about to drop the column `time_limit_sec` on the `Problem` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[team_id,contest_id]` on the table `team_score` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `contest_id` to the `team_score` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- AlterTable
ALTER TABLE "Contest" ADD COLUMN     "min_score_percent" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "penalty_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
ADD COLUMN     "safe_zone_minutes" INTEGER NOT NULL DEFAULT 30;

-- AlterTable
ALTER TABLE "Problem" DROP COLUMN "time_limit_sec",
ADD COLUMN     "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "time_limit" DOUBLE PRECISION NOT NULL DEFAULT 2.0;

-- AlterTable
ALTER TABLE "team_score" ADD COLUMN     "contest_id" TEXT NOT NULL,
ADD COLUMN     "total_score" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "team_score_contest_id_solved_count_total_score_total_penalt_idx" ON "team_score"("contest_id", "solved_count" DESC, "total_score" DESC, "total_penalty" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "team_score_team_id_contest_id_key" ON "team_score"("team_id", "contest_id");

-- AddForeignKey
ALTER TABLE "team_score" ADD CONSTRAINT "team_score_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
