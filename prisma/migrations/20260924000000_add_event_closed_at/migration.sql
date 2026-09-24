ALTER TABLE "PhotoshootEvent"
ADD COLUMN "closedAt" TIMESTAMPTZ(3);

UPDATE "PhotoshootEvent"
SET "closedAt" = "updatedAt"
WHERE "status" = 'CLOSED';

CREATE INDEX "PhotoshootEvent_status_closedAt_idx"
ON "PhotoshootEvent"("status", "closedAt");
