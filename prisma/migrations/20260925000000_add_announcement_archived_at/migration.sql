ALTER TABLE "Announcement"
ADD COLUMN "archivedAt" TIMESTAMPTZ(3);

CREATE INDEX "Announcement_archivedAt_createdAt_idx"
ON "Announcement"("archivedAt", "createdAt");
