-- AlterTable
ALTER TABLE "Contest" ADD COLUMN     "is_frozen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_paused" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paused_at" TIMESTAMP(3);
