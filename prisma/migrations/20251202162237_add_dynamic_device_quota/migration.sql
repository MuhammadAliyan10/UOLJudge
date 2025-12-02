-- AlterTable
ALTER TABLE "team_profile" ADD COLUMN     "authorized_devices" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "max_devices" INTEGER NOT NULL DEFAULT 2;
