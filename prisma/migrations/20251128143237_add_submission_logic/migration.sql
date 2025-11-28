/*
  Warnings:

  - The `verdict` column on the `Submission` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `language` on table `Submission` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ProblemType" AS ENUM ('PHYSICAL', 'DIGITAL');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "content_url" TEXT,
ADD COLUMN     "type" "ProblemType" NOT NULL DEFAULT 'PHYSICAL';

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "can_retry" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_latest" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "language" SET NOT NULL,
DROP COLUMN "verdict",
ADD COLUMN     "verdict" "SubmissionStatus" NOT NULL DEFAULT 'PENDING';
