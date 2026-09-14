"use server";

import { randomBytes } from "node:crypto";
import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { writeAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/session";
import { canAssignRole, ROLES } from "@/lib/auth/permissions";
import { getDb } from "@/lib/db";
import { safeText, uuid } from "@/lib/validation";
import { getEmailProvider } from "@/lib/email";
import { cancelBooking, rescheduleBooking } from "@/lib/booking-service";
import { notifyBookingChange } from "@/lib/booking-notifications";

const eventSchema = z
  .object({
    title: safeText(160),
    description: safeText(2000),
    venue: safeText(240),
    preparationInstructions: safeText(4000),
    bookingOpensAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/),
    bookingClosesAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/),
    rescheduleDeadline: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/),
    cancellationDeadline: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/),
    slotDurationMinutes: z.coerce.number().int().min(5).max(480),
    capacity: z.coerce.number().int().min(1).max(100),
    dates: z.array(z.iso.date()).min(2).max(30),
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  })
  .refine(
    (v) => localManila(v.bookingOpensAt) < localManila(v.bookingClosesAt),
    {
      message: "Booking must open before it closes",
    },
  );

function formStrings(form: FormData, key: string) {
  return form
    .getAll(key)
    .filter((v): v is string => typeof v === "string" && v.length > 0);
}
function manila(date: string, time: string) {
  return new Date(`${date}T${time}:00+08:00`);
}
function localManila(value: string) {
  return new Date(`${value}:00+08:00`);
}

export async function createEvent(form: FormData) {
  const actor = await requirePermission("events:manage");
  const parsed = eventSchema.safeParse({
    ...Object.fromEntries(form),
    dates: formStrings(form, "dates"),
  });
  if (!parsed.success)
    throw new Error(parsed.error.issues.map((i) => i.message).join("; "));
  const input = parsed.data;
  const starts = manila(input.dates[0], input.startTime);
  const ends = manila(input.dates[0], input.endTime);
  if (starts >= ends)
    throw new Error("Daily start time must be before end time.");
  const db = getDb();
  await db.$transaction(
    async (tx) => {
      const event = await tx.photoshootEvent.create({
        data: {
          title: input.title,
          slug: `${input.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")
            .slice(0, 90)}-${randomBytes(3).toString("hex")}`,
          description: input.description,
          venue: input.venue,
          preparationInstructions: input.preparationInstructions,
          bookingOpensAt: localManila(input.bookingOpensAt),
          bookingClosesAt: localManila(input.bookingClosesAt),
          rescheduleDeadline: localManila(input.rescheduleDeadline),
          cancellationDeadline: localManila(input.cancellationDeadline),
          slotDurationMinutes: input.slotDurationMinutes,
          defaultSlotCapacity: input.capacity,
          createdById: actor.id,
        },
      });
      for (const date of input.dates) {
        const eventDate = await tx.eventDate.create({
          data: { eventId: event.id, date: new Date(`${date}T00:00:00Z`) },
        });
        for (
          let cursor = manila(date, input.startTime);
          cursor < manila(date, input.endTime);
          cursor = new Date(
            cursor.getTime() + input.slotDurationMinutes * 60_000,
          )
        ) {
          const end = new Date(
            cursor.getTime() + input.slotDurationMinutes * 60_000,
          );
          if (end > manila(date, input.endTime)) break;
          await tx.timeSlot.create({
            data: {
              eventDateId: eventDate.id,
              startsAt: cursor,
              endsAt: end,
              capacity: input.capacity,
            },
          });
        }
      }
      await writeAudit(tx, {
        actorId: actor.id,
        action: "event.created",
        targetType: "PhotoshootEvent",
        targetId: event.id,
        newValues: {
          title: event.title,
          dates: input.dates,
          slotDurationMinutes: input.slotDurationMinutes,
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
  revalidatePath("/staff/events");
  revalidatePath("/staff/schedule");
}

const checkInSchema = z.object({
  bookingId: uuid,
  action: z.enum(["check-in", "complete", "no-show"]),
  note: z.string().trim().max(1000).optional(),
});
export async function updateAttendance(form: FormData) {
  const actor = await requirePermission("checkin:manage");
  const input = checkInSchema.parse(Object.fromEntries(form));
  const db = getDb();
  await db.$transaction(
    async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: input.bookingId },
      });
      if (!booking) throw new Error("Booking not found.");
      if (actor.role === "LOGISTICS_MEMBER") {
        const assigned = await tx.eventAssignment.count({
          where: { eventId: booking.eventId, userId: actor.id },
        });
        if (!assigned) throw new Error("You are not assigned to this event.");
      }
      if (input.action === "check-in") {
        if (!["CONFIRMED", "RESCHEDULED"].includes(booking.status))
          throw new Error("This group cannot be checked in again.");
        await tx.checkIn.create({
          data: {
            bookingId: booking.id,
            checkedInById: actor.id,
            arrivedAt: new Date(),
            note: input.note,
          },
        });
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: "CHECKED_IN" },
        });
        await tx.bookingHistory.create({
          data: {
            bookingId: booking.id,
            status: "CHECKED_IN",
            timeSlotId: booking.currentSlotId,
            actorId: actor.id,
            reason: "Operational check-in",
            internalNote: input.note,
          },
        });
      } else {
        const status = input.action === "complete" ? "COMPLETED" : "NO_SHOW";
        if (input.action === "complete" && booking.status !== "CHECKED_IN")
          throw new Error("Check the group in before completion.");
        if (
          input.action === "no-show" &&
          !["CONFIRMED", "RESCHEDULED"].includes(booking.status)
        )
          throw new Error("This booking cannot be marked no-show.");
        await tx.booking.update({
          where: { id: booking.id },
          data: { status },
        });
        await tx.bookingHistory.create({
          data: {
            bookingId: booking.id,
            status,
            timeSlotId: booking.currentSlotId,
            actorId: actor.id,
            reason: input.note ?? `Marked ${status.toLowerCase()}`,
          },
        });
        if (input.action === "complete")
          await tx.checkIn.update({
            where: { bookingId: booking.id },
            data: { completedAt: new Date(), note: input.note },
          });
      }
      await writeAudit(tx, {
        actorId: actor.id,
        action: `attendance.${input.action}`,
        targetType: "Booking",
        targetId: booking.id,
        newValues: { action: input.action },
        reason: input.note,
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
  revalidatePath("/staff/check-in");
}

const slotChangeSchema = z.object({
  slotId: uuid,
  action: z.enum(["block", "reopen", "delete"]),
  reason: safeText(500),
});
export async function changeSlot(form: FormData) {
  const actor = await requirePermission("events:manage");
  const input = slotChangeSchema.parse(Object.fromEntries(form));
  const db = getDb();
  await db.$transaction(async (tx) => {
    const slot = await tx.timeSlot.findUnique({ where: { id: input.slotId } });
    if (!slot) throw new Error("Slot not found.");
    if (slot.reservedCount > 0)
      throw new Error(
        "A slot with reservations cannot be blocked or deleted; reschedule its bookings first.",
      );
    const status =
      input.action === "block"
        ? "BLOCKED"
        : input.action === "reopen"
          ? "AVAILABLE"
          : "DELETED";
    if (status === "AVAILABLE" && slot.startsAt <= new Date())
      throw new Error("Past slots cannot be reopened.");
    await tx.timeSlot.update({
      where: { id: slot.id },
      data: {
        status,
        blockReason: status === "AVAILABLE" ? null : input.reason,
      },
    });
    await writeAudit(tx, {
      actorId: actor.id,
      action: `slot.${input.action}`,
      targetType: "TimeSlot",
      targetId: slot.id,
      previousValues: { status: slot.status },
      newValues: { status },
      reason: input.reason,
    });
  });
  revalidatePath("/staff/schedule");
}

const slotEditSchema = z.object({
  slotId: uuid,
  capacity: z.coerce.number().int().min(1).max(100),
  reason: safeText(500),
});
export async function editSlot(form: FormData) {
  const actor = await requirePermission("events:manage");
  const input = slotEditSchema.parse(Object.fromEntries(form));
  const db = getDb();
  await db.$transaction(async (tx) => {
    const slot = await tx.timeSlot.findUnique({ where: { id: input.slotId } });
    if (!slot) throw new Error("Slot not found.");
    if (input.capacity < slot.reservedCount)
      throw new Error("Capacity cannot be lower than existing reservations.");
    await tx.timeSlot.update({
      where: { id: slot.id },
      data: { capacity: input.capacity },
    });
    await writeAudit(tx, {
      actorId: actor.id,
      action: "slot.edited",
      targetType: "TimeSlot",
      targetId: slot.id,
      previousValues: { capacity: slot.capacity },
      newValues: { capacity: input.capacity },
      reason: input.reason,
    });
  });
  revalidatePath("/staff/schedule");
}

const eventStatusSchema = z.object({
  eventId: uuid,
  status: z.enum(["OPEN", "CLOSED"]),
  reason: safeText(500),
});
export async function changeEventStatus(form: FormData) {
  const actor = await requirePermission("events:manage");
  const input = eventStatusSchema.parse(Object.fromEntries(form));
  const db = getDb();
  await db.$transaction(async (tx) => {
    const event = await tx.photoshootEvent.findUnique({
      where: { id: input.eventId },
      include: {
        dates: { include: { _count: { select: { slots: true } } } },
      },
    });
    if (!event) throw new Error("Event not found.");
    if (
      input.status === "OPEN" &&
      (event.dates.length < 2 ||
        event.dates.some((date) => date._count.slots === 0))
    )
      throw new Error("An open event requires at least two dates with slots.");
    await tx.photoshootEvent.update({
      where: { id: event.id },
      data: { status: input.status, isPublic: input.status === "OPEN" },
    });
    await writeAudit(tx, {
      actorId: actor.id,
      action: `event.${input.status.toLowerCase()}`,
      targetType: "PhotoshootEvent",
      targetId: event.id,
      previousValues: { status: event.status, isPublic: event.isPublic },
      newValues: { status: input.status, isPublic: input.status === "OPEN" },
      reason: input.reason,
    });
  });
  revalidatePath("/staff/events");
  revalidatePath("/schedule");
  revalidatePath("/");
}

const roleSchema = z.object({
  userId: uuid,
  role: z.enum(ROLES),
  reason: safeText(1000),
});
export async function changeUserRole(form: FormData) {
  const actor = await requirePermission("users:manage");
  const input = roleSchema.parse(Object.fromEntries(form));
  if (!canAssignRole(actor.role, input.role))
    throw new Error("You cannot assign that role.");
  const db = getDb();
  await db.$transaction(async (tx) => {
    const target = await tx.userProfile.findUnique({
      where: { id: input.userId },
    });
    if (!target) throw new Error("User not found.");
    await tx.userProfile.update({
      where: { id: target.id },
      data: { role: input.role },
    });
    await writeAudit(tx, {
      actorId: actor.id,
      action: "role.changed",
      targetType: "UserProfile",
      targetId: target.id,
      previousValues: { role: target.role },
      newValues: { role: input.role },
      reason: input.reason,
    });
  });
  revalidatePath("/staff/users");
}

const assignmentSchema = z.object({
  eventId: uuid,
  userId: uuid,
  action: z.enum(["assign", "remove"]),
  notes: z.string().trim().max(500).optional(),
});
export async function changeAssignment(form: FormData) {
  const actor = await requirePermission("assignments:manage");
  const input = assignmentSchema.parse(Object.fromEntries(form));
  const db = getDb();
  await db.$transaction(async (tx) => {
    const user = await tx.userProfile.findUnique({
      where: { id: input.userId },
    });
    if (!user || user.role !== "LOGISTICS_MEMBER" || user.status !== "ACTIVE")
      throw new Error("Only active logistics members can be assigned.");
    if (input.action === "assign") {
      await tx.eventAssignment.upsert({
        where: {
          eventId_userId: { eventId: input.eventId, userId: input.userId },
        },
        update: { notes: input.notes },
        create: {
          eventId: input.eventId,
          userId: input.userId,
          notes: input.notes,
        },
      });
    } else {
      await tx.eventAssignment.delete({
        where: {
          eventId_userId: { eventId: input.eventId, userId: input.userId },
        },
      });
    }
    await writeAudit(tx, {
      actorId: actor.id,
      action: `assignment.${input.action}`,
      targetType: "PhotoshootEvent",
      targetId: input.eventId,
      newValues: { userId: input.userId },
      reason: input.notes,
    });
  });
  revalidatePath("/staff/assignments");
}

const announcementSchema = z.object({
  title: safeText(160),
  body: safeText(3000),
  audience: z.enum(ROLES).optional(),
  isPublic: z.boolean(),
});
export async function publishAnnouncement(form: FormData) {
  const actor = await requirePermission("announcements:manage");
  const input = announcementSchema.parse({
    ...Object.fromEntries(form),
    audience: form.get("audience") || undefined,
    isPublic: form.get("isPublic") === "on",
  });
  const db = getDb();
  await db.$transaction(async (tx) => {
    const item = await tx.announcement.create({
      data: { ...input, createdById: actor.id, publishedAt: new Date() },
    });
    await writeAudit(tx, {
      actorId: actor.id,
      action: "announcement.published",
      targetType: "Announcement",
      targetId: item.id,
      newValues: {
        title: item.title,
        audience: item.audience,
        isPublic: item.isPublic,
      },
    });
  });
  revalidatePath("/staff/announcements");
  revalidatePath("/");
}

const inviteSchema = z.object({
  email: z.email().max(320),
  role: z.enum(ROLES).exclude(["STUDENT"]),
});
export async function inviteStaff(form: FormData) {
  const actor = await requirePermission("users:manage");
  const input = inviteSchema.parse(Object.fromEntries(form));
  if (!canAssignRole(actor.role, input.role))
    throw new Error("You cannot invite that role.");
  const rawToken = randomBytes(32).toString("base64url");
  const db = getDb();
  const invitation = await db.$transaction(async (tx) => {
    const created = await tx.staffInvitation.create({
      data: {
        email: input.email.toLowerCase(),
        role: input.role,
        tokenHash: createHash("sha256").update(rawToken).digest("hex"),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60_000),
        invitedById: actor.id,
      },
    });
    await writeAudit(tx, {
      actorId: actor.id,
      action: "staff.invited",
      targetType: "StaffInvitation",
      targetId: created.id,
      newValues: {
        email: created.email,
        role: created.role,
        expiresAt: created.expiresAt,
      },
    });
    return created;
  });
  try {
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    await getEmailProvider().send({
      to: invitation.email,
      subject: "TICAP Logistics staff invitation",
      text: `You have been invited to TICAP Logistics. Use your verified email to sign in at ${origin}/sign-in. This invitation expires in seven days.`,
    });
  } catch {
    /* The invitation remains visible for an authorized resend workflow. */
  }
  revalidatePath("/staff/users");
}

const accountSchema = z.object({
  userId: uuid,
  action: z.enum(["activate", "suspend"]),
  reason: safeText(1000),
});
export async function changeAccountStatus(form: FormData) {
  const actor = await requirePermission("users:manage");
  const input = accountSchema.parse(Object.fromEntries(form));
  if (actor.id === input.userId && input.action === "suspend")
    throw new Error("You cannot suspend your own account.");
  const db = getDb();
  await db.$transaction(async (tx) => {
    const target = await tx.userProfile.findUnique({
      where: { id: input.userId },
    });
    if (!target) throw new Error("User not found.");
    if (target.role === "SUPERADMIN" && actor.role !== "SUPERADMIN")
      throw new Error("Only a superadmin can change this account.");
    const status = input.action === "activate" ? "ACTIVE" : "SUSPENDED";
    await tx.userProfile.update({ where: { id: target.id }, data: { status } });
    await writeAudit(tx, {
      actorId: actor.id,
      action: `account.${input.action}`,
      targetType: "UserProfile",
      targetId: target.id,
      previousValues: { status: target.status },
      newValues: { status },
      reason: input.reason,
    });
  });
  revalidatePath("/staff/users");
}

export async function administrativelyChangeBooking(form: FormData) {
  const actor = await requirePermission("bookings:manage");
  const action = z.enum(["reschedule", "cancel"]).parse(form.get("action"));
  const payload = {
    bookingId: form.get("bookingId"),
    newSlotId: form.get("newSlotId") || undefined,
    reason: form.get("reason"),
    administrativeOverride: true,
  };
  if (action === "reschedule") await rescheduleBooking(actor, payload);
  else await cancelBooking(actor, payload);
  await notifyBookingChange(
    payload.bookingId as string,
    action === "reschedule" ? "RESCHEDULED" : "CANCELLED",
  );
  revalidatePath("/staff/bookings");
  revalidatePath("/staff");
}

const settingSchema = z.object({
  key: z.enum(["public_contact", "privacy_notice", "school_email_required"]),
  value: safeText(2000),
  description: z.string().trim().max(500).optional(),
});
export async function updateSystemSetting(form: FormData) {
  const actor = await requirePermission("settings:manage");
  const input = settingSchema.parse(Object.fromEntries(form));
  const db = getDb();
  await db.$transaction(async (tx) => {
    const previous = await tx.systemSetting.findUnique({
      where: { key: input.key },
    });
    await tx.systemSetting.upsert({
      where: { key: input.key },
      update: {
        value: input.value,
        description: input.description,
        updatedById: actor.id,
      },
      create: {
        key: input.key,
        value: input.value,
        description: input.description,
        updatedById: actor.id,
      },
    });
    await writeAudit(tx, {
      actorId: actor.id,
      action: "settings.changed",
      targetType: "SystemSetting",
      targetId: input.key,
      previousValues: previous ? { value: previous.value } : undefined,
      newValues: { value: input.value },
      reason: input.description,
    });
  });
  revalidatePath("/staff/settings");
}
