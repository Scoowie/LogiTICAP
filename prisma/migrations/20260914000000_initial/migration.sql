-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPERADMIN', 'ADMIN', 'LOGISTICS_MEMBER', 'STUDENT');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SlotStatus" AS ENUM ('AVAILABLE', 'BLOCKED', 'CLOSED', 'DELETED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING_VERIFICATION', 'CONFIRMED', 'RESCHEDULE_REQUESTED', 'RESCHEDULED', 'CANCELLED', 'CHECKED_IN', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED', 'READ');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('ACTIVE', 'COMING_SOON', 'DISABLED');

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "fullName" VARCHAR(160) NOT NULL,
    "contactNumber" VARCHAR(32),
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "thesisGroupId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffInvitation" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "role" "UserRole" NOT NULL,
    "tokenHash" VARCHAR(128) NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "invitedById" UUID NOT NULL,
    "acceptedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThesisGroup" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "thesisTitle" VARCHAR(300) NOT NULL,
    "section" VARCHAR(80) NOT NULL,
    "program" VARCHAR(120) NOT NULL,
    "adviserName" VARCHAR(160),
    "representativeId" UUID NOT NULL,
    "representativeName" VARCHAR(160) NOT NULL,
    "verifiedEmail" VARCHAR(320) NOT NULL,
    "contactNumber" VARCHAR(32) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ThesisGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMember" (
    "id" UUID NOT NULL,
    "thesisGroupId" UUID NOT NULL,
    "fullName" VARCHAR(160) NOT NULL,
    "studentNumber" VARCHAR(40) NOT NULL,
    "schoolEmail" VARCHAR(320),
    "groupRole" VARCHAR(80),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogisticsService" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "status" "ServiceStatus" NOT NULL DEFAULT 'COMING_SOON',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "LogisticsService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhotoshootEvent" (
    "id" UUID NOT NULL,
    "serviceId" UUID,
    "title" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "description" VARCHAR(2000) NOT NULL,
    "venue" VARCHAR(240) NOT NULL,
    "preparationInstructions" VARCHAR(4000) NOT NULL,
    "mediaDepartmentNotes" VARCHAR(4000),
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "bookingOpensAt" TIMESTAMPTZ(3) NOT NULL,
    "bookingClosesAt" TIMESTAMPTZ(3) NOT NULL,
    "rescheduleDeadline" TIMESTAMPTZ(3) NOT NULL,
    "cancellationDeadline" TIMESTAMPTZ(3) NOT NULL,
    "slotDurationMinutes" INTEGER NOT NULL DEFAULT 20,
    "defaultSlotCapacity" INTEGER NOT NULL DEFAULT 1,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PhotoshootEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventDate" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "label" VARCHAR(80),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "EventDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeSlot" (
    "id" UUID NOT NULL,
    "eventDateId" UUID NOT NULL,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "reservedCount" INTEGER NOT NULL DEFAULT 0,
    "status" "SlotStatus" NOT NULL DEFAULT 'AVAILABLE',
    "blockReason" VARCHAR(500),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "TimeSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" UUID NOT NULL,
    "publicReference" VARCHAR(32) NOT NULL,
    "idempotencyKey" VARCHAR(100) NOT NULL,
    "eventId" UUID NOT NULL,
    "thesisGroupId" UUID NOT NULL,
    "currentSlotId" UUID,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "alternativePreference" VARCHAR(500),
    "schedulingConcern" VARCHAR(1000),
    "accessibilityNeed" VARCHAR(1000),
    "studentVisibleNotes" VARCHAR(1000),
    "internalNotes" VARCHAR(2000),
    "accuracyAccepted" BOOLEAN NOT NULL,
    "rulesAccepted" BOOLEAN NOT NULL,
    "notificationsAccepted" BOOLEAN NOT NULL,
    "privacyAccepted" BOOLEAN NOT NULL,
    "cancelledAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingHistory" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "status" "BookingStatus" NOT NULL,
    "timeSlotId" UUID,
    "actorId" UUID,
    "reason" VARCHAR(1000),
    "studentMessage" VARCHAR(1000),
    "internalNote" VARCHAR(2000),
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventAssignment" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "notes" VARCHAR(500),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckIn" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "checkedInById" UUID NOT NULL,
    "arrivedAt" TIMESTAMPTZ(3) NOT NULL,
    "completedAt" TIMESTAMPTZ(3),
    "note" VARCHAR(1000),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" UUID NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "body" VARCHAR(3000) NOT NULL,
    "audience" "UserRole",
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMPTZ(3),
    "expiresAt" TIMESTAMPTZ(3),
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" VARCHAR(80) NOT NULL,
    "subject" VARCHAR(200) NOT NULL,
    "body" VARCHAR(4000) NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "providerId" VARCHAR(200),
    "sentAt" TIMESTAMPTZ(3),
    "readAt" TIMESTAMPTZ(3),
    "failureCode" VARCHAR(120),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "action" VARCHAR(100) NOT NULL,
    "targetType" VARCHAR(80) NOT NULL,
    "targetId" VARCHAR(100) NOT NULL,
    "previousValues" JSONB,
    "newValues" JSONB,
    "reason" VARCHAR(1000),
    "ipHash" VARCHAR(128),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" VARCHAR(100) NOT NULL,
    "value" JSONB NOT NULL,
    "description" VARCHAR(500),
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "updatedById" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_email_key" ON "UserProfile"("email");

-- CreateIndex
CREATE INDEX "UserProfile_role_status_idx" ON "UserProfile"("role", "status");

-- CreateIndex
CREATE INDEX "UserProfile_thesisGroupId_idx" ON "UserProfile"("thesisGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffInvitation_tokenHash_key" ON "StaffInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "StaffInvitation_email_status_idx" ON "StaffInvitation"("email", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ThesisGroup_representativeId_key" ON "ThesisGroup"("representativeId");

-- CreateIndex
CREATE INDEX "ThesisGroup_name_idx" ON "ThesisGroup"("name");

-- CreateIndex
CREATE INDEX "ThesisGroup_section_program_idx" ON "ThesisGroup"("section", "program");

-- CreateIndex
CREATE INDEX "GroupMember_studentNumber_idx" ON "GroupMember"("studentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMember_thesisGroupId_studentNumber_key" ON "GroupMember"("thesisGroupId", "studentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "LogisticsService_slug_key" ON "LogisticsService"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PhotoshootEvent_slug_key" ON "PhotoshootEvent"("slug");

-- CreateIndex
CREATE INDEX "PhotoshootEvent_status_bookingOpensAt_bookingClosesAt_idx" ON "PhotoshootEvent"("status", "bookingOpensAt", "bookingClosesAt");

-- CreateIndex
CREATE INDEX "EventDate_eventId_isActive_idx" ON "EventDate"("eventId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "EventDate_eventId_date_key" ON "EventDate"("eventId", "date");

-- CreateIndex
CREATE INDEX "TimeSlot_eventDateId_status_startsAt_idx" ON "TimeSlot"("eventDateId", "status", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "TimeSlot_eventDateId_startsAt_key" ON "TimeSlot"("eventDateId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_publicReference_key" ON "Booking"("publicReference");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_idempotencyKey_key" ON "Booking"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Booking_eventId_status_idx" ON "Booking"("eventId", "status");

-- CreateIndex
CREATE INDEX "Booking_thesisGroupId_status_idx" ON "Booking"("thesisGroupId", "status");

-- CreateIndex
CREATE INDEX "Booking_currentSlotId_status_idx" ON "Booking"("currentSlotId", "status");

-- CreateIndex
CREATE INDEX "BookingHistory_bookingId_createdAt_idx" ON "BookingHistory"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "EventAssignment_userId_idx" ON "EventAssignment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EventAssignment_eventId_userId_key" ON "EventAssignment"("eventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "CheckIn_bookingId_key" ON "CheckIn"("bookingId");

-- CreateIndex
CREATE INDEX "Announcement_isPublic_publishedAt_expiresAt_idx" ON "Announcement"("isPublic", "publishedAt", "expiresAt");

-- CreateIndex
CREATE INDEX "Notification_userId_status_createdAt_idx" ON "Notification"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_targetType_targetId_createdAt_idx" ON "AuditLog"("targetType", "targetId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_thesisGroupId_fkey" FOREIGN KEY ("thesisGroupId") REFERENCES "ThesisGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThesisGroup" ADD CONSTRAINT "ThesisGroup_representativeId_fkey" FOREIGN KEY ("representativeId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_thesisGroupId_fkey" FOREIGN KEY ("thesisGroupId") REFERENCES "ThesisGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoshootEvent" ADD CONSTRAINT "PhotoshootEvent_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "LogisticsService"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventDate" ADD CONSTRAINT "EventDate_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "PhotoshootEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeSlot" ADD CONSTRAINT "TimeSlot_eventDateId_fkey" FOREIGN KEY ("eventDateId") REFERENCES "EventDate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "PhotoshootEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_thesisGroupId_fkey" FOREIGN KEY ("thesisGroupId") REFERENCES "ThesisGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_currentSlotId_fkey" FOREIGN KEY ("currentSlotId") REFERENCES "TimeSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingHistory" ADD CONSTRAINT "BookingHistory_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingHistory" ADD CONSTRAINT "BookingHistory_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES "TimeSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingHistory" ADD CONSTRAINT "BookingHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAssignment" ADD CONSTRAINT "EventAssignment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "PhotoshootEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAssignment" ADD CONSTRAINT "EventAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_checkedInById_fkey" FOREIGN KEY ("checkedInById") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Integrity rules not expressible in the Prisma schema.
ALTER TABLE "PhotoshootEvent" ADD CONSTRAINT "PhotoshootEvent_booking_window_check"
  CHECK ("bookingOpensAt" < "bookingClosesAt");
ALTER TABLE "PhotoshootEvent" ADD CONSTRAINT "PhotoshootEvent_slot_defaults_check"
  CHECK ("slotDurationMinutes" BETWEEN 5 AND 480 AND "defaultSlotCapacity" BETWEEN 1 AND 100);
ALTER TABLE "TimeSlot" ADD CONSTRAINT "TimeSlot_time_order_check" CHECK ("startsAt" < "endsAt");
ALTER TABLE "TimeSlot" ADD CONSTRAINT "TimeSlot_capacity_check"
  CHECK ("capacity" > 0 AND "reservedCount" >= 0 AND "reservedCount" <= "capacity");
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_acknowledgements_check"
  CHECK ("accuracyAccepted" AND "rulesAccepted" AND "notificationsAccepted" AND "privacyAccepted");

-- One active reservation for a thesis group in an event. Completed/cancelled/no-show rows remain as history.
CREATE UNIQUE INDEX "Booking_one_active_group_event"
  ON "Booking" ("thesisGroupId", "eventId")
  WHERE "status" IN ('PENDING_VERIFICATION', 'CONFIRMED', 'RESCHEDULE_REQUESTED', 'RESCHEDULED', 'CHECKED_IN');

-- Protected application tables are server-only. Supabase Auth supplies identity; Prisma's
-- database role and the server authorization layer supply application access control.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
ALTER TABLE "UserProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StaffInvitation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ThesisGroup" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GroupMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LogisticsService" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PhotoshootEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EventDate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TimeSlot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BookingHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EventAssignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CheckIn" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Announcement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SystemSetting" ENABLE ROW LEVEL SECURITY;

-- Important operational evidence is append-only. Corrections are represented by new rows.
CREATE OR REPLACE FUNCTION prevent_immutable_record_change()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION '% records are append-only', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "BookingHistory_append_only"
BEFORE UPDATE OR DELETE ON "BookingHistory"
FOR EACH ROW EXECUTE FUNCTION prevent_immutable_record_change();

CREATE TRIGGER "AuditLog_append_only"
BEFORE UPDATE OR DELETE ON "AuditLog"
FOR EACH ROW EXECUTE FUNCTION prevent_immutable_record_change();
