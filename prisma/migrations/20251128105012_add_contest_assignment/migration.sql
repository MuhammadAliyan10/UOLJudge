-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'JURY', 'PARTICIPANT');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('CORE', 'WEB', 'ANDROID');

-- CreateEnum
CREATE TYPE "Verdict" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'RUNTIME_ERROR', 'COMPILE_ERROR');

-- CreateEnum
CREATE TYPE "LogAction" AS ENUM ('LOGIN', 'SUBMISSION', 'MANUAL_GRADE_UPDATE', 'BAN_USER', 'CONTEST_UPDATE', 'RESTORE_SCORE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PARTICIPANT',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_profile" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "members" JSONB NOT NULL DEFAULT '[]',
    "lab_location" TEXT,
    "category" "Category" NOT NULL,
    "total_score" INTEGER NOT NULL DEFAULT 0,
    "total_penalty" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "assigned_contest_id" TEXT,

    CONSTRAINT "team_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContestRegistration" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "contest_id" TEXT NOT NULL,
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContestRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "frozen_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "Contest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Problem" (
    "id" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 100,
    "time_limit_sec" DOUBLE PRECISION DEFAULT 2.0,
    "memory_limit_mb" INTEGER DEFAULT 256,
    "assets_path" TEXT,
    "contest_id" TEXT NOT NULL,

    CONSTRAINT "Problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_hash" TEXT NOT NULL,
    "language" TEXT,
    "verdict" "Verdict" NOT NULL DEFAULT 'PENDING',
    "auto_score" INTEGER NOT NULL DEFAULT 0,
    "manual_score" INTEGER,
    "final_score" INTEGER NOT NULL DEFAULT 0,
    "penalty" INTEGER NOT NULL DEFAULT 0,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,
    "problem_id" TEXT NOT NULL,
    "judged_by_id" TEXT,
    "jury_comment" TEXT,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clarification" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "problem_id" TEXT,
    "user_id" TEXT NOT NULL,
    "answered_by_id" TEXT,

    CONSTRAINT "Clarification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contest_id" TEXT NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemLog" (
    "id" TEXT NOT NULL,
    "action" "LogAction" NOT NULL,
    "details" TEXT NOT NULL,
    "ip_address" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submission_id" TEXT,
    "user_id" TEXT,

    CONSTRAINT "SystemLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "team_profile_user_id_key" ON "team_profile"("user_id");

-- CreateIndex
CREATE INDEX "team_profile_category_idx" ON "team_profile"("category");

-- CreateIndex
CREATE INDEX "team_profile_assigned_contest_id_idx" ON "team_profile"("assigned_contest_id");

-- CreateIndex
CREATE UNIQUE INDEX "ContestRegistration_user_id_contest_id_key" ON "ContestRegistration"("user_id", "contest_id");

-- AddForeignKey
ALTER TABLE "team_profile" ADD CONSTRAINT "team_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_profile" ADD CONSTRAINT "team_profile_assigned_contest_id_fkey" FOREIGN KEY ("assigned_contest_id") REFERENCES "Contest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestRegistration" ADD CONSTRAINT "ContestRegistration_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestRegistration" ADD CONSTRAINT "ContestRegistration_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "Contest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_judged_by_id_fkey" FOREIGN KEY ("judged_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clarification" ADD CONSTRAINT "Clarification_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "Problem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clarification" ADD CONSTRAINT "Clarification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clarification" ADD CONSTRAINT "Clarification_answered_by_id_fkey" FOREIGN KEY ("answered_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemLog" ADD CONSTRAINT "SystemLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
