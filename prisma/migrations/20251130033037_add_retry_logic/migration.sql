-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "retry_granted_by" TEXT,
ADD COLUMN     "retry_reason" TEXT,
ADD COLUMN     "retry_requested" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "retry_requested_at" TIMESTAMP(3);
