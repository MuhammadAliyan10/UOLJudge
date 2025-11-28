-- AlterTable
ALTER TABLE "SystemLog" ADD COLUMN     "level" TEXT NOT NULL DEFAULT 'INFO',
ADD COLUMN     "message" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "metadata" JSONB;

-- CreateTable
CREATE TABLE "system_setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_setting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_setting_key_key" ON "system_setting"("key");
