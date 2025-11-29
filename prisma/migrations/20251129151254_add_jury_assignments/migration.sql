-- CreateTable
CREATE TABLE "jury_assignment" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "contest_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jury_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "jury_assignment_user_id_idx" ON "jury_assignment"("user_id");

-- CreateIndex
CREATE INDEX "jury_assignment_contest_id_idx" ON "jury_assignment"("contest_id");

-- CreateIndex
CREATE UNIQUE INDEX "jury_assignment_user_id_contest_id_key" ON "jury_assignment"("user_id", "contest_id");

-- AddForeignKey
ALTER TABLE "jury_assignment" ADD CONSTRAINT "jury_assignment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jury_assignment" ADD CONSTRAINT "jury_assignment_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
