import "server-only";

import { randomBytes } from "node:crypto";
import { Prisma, BookingStatus } from "@/generated/prisma/client";
import type { Actor } from "@/lib/auth/session";
import { assertOwnGroup, AuthorizationError } from "@/lib/auth/session";
import { writeAudit } from "@/lib/audit";
import { getDb } from "@/lib/db";
import { bookingSchema, changeBookingSchema } from "@/lib/validation";

export class BookingRuleError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "BookingRuleError";
  }
}

const activeStatuses: BookingStatus[] = [
  "PENDING_VERIFICATION",
  "CONFIRMED",
  "RESCHEDULE_REQUESTED",
  "RESCHEDULED",
  "CHECKED_IN",
];
const reference = () =>
  `TLMS-${randomBytes(8).toString("base64url").toUpperCase()}`;

export async function createBooking(actor: Actor, untrusted: unknown) {
  const input = bookingSchema.parse(untrusted);
  assertOwnGroup(actor, input.thesisGroupId);
  const db = getDb();

  return db.$transaction(
    async (tx) => {
      const duplicate = await tx.booking.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });
      if (duplicate) {
        if (duplicate.thesisGroupId !== input.thesisGroupId)
          throw new AuthorizationError();
        return duplicate;
      }

      const now = new Date();
      const slot = await tx.timeSlot.findUnique({
        where: { id: input.slotId },
        include: { eventDate: { include: { event: true } } },
      });
      if (!slot || slot.eventDate.eventId !== input.eventId)
        throw new BookingRuleError(
          "The selected schedule does not exist.",
          "INVALID_SLOT",
        );
      const event = slot.eventDate.event;
      if (
        event.status !== "OPEN" ||
        now < event.bookingOpensAt ||
        now > event.bookingClosesAt
      )
        throw new BookingRuleError(
          "Booking is not currently open.",
          "BOOKING_CLOSED",
        );
      if (
        !slot.eventDate.isActive ||
        slot.status !== "AVAILABLE" ||
        slot.startsAt <= now
      )
        throw new BookingRuleError(
          "This slot is no longer available.",
          "SLOT_UNAVAILABLE",
        );

      const existing = await tx.booking.findFirst({
        where: {
          eventId: input.eventId,
          thesisGroupId: input.thesisGroupId,
          status: { in: activeStatuses },
        },
        select: { id: true },
      });
      if (existing)
        throw new BookingRuleError(
          "This group already has an active booking for the event.",
          "DUPLICATE_BOOKING",
        );

      const claimed = await tx.timeSlot.updateMany({
        where: {
          id: input.slotId,
          status: "AVAILABLE",
          reservedCount: { lt: slot.capacity },
        },
        data: { reservedCount: { increment: 1 } },
      });
      if (claimed.count !== 1)
        throw new BookingRuleError(
          "The slot reached capacity. Choose another time.",
          "SLOT_FULL",
        );

      const booking = await tx.booking.create({
        data: {
          publicReference: reference(),
          idempotencyKey: input.idempotencyKey,
          eventId: input.eventId,
          thesisGroupId: input.thesisGroupId,
          currentSlotId: input.slotId,
          status: "CONFIRMED",
          alternativePreference: input.alternativePreference,
          schedulingConcern: input.schedulingConcern,
          accessibilityNeed: input.accessibilityNeed,
          accuracyAccepted: input.accuracyAccepted,
          rulesAccepted: input.rulesAccepted,
          notificationsAccepted: input.notificationsAccepted,
          privacyAccepted: input.privacyAccepted,
          history: {
            create: {
              status: "CONFIRMED",
              timeSlotId: input.slotId,
              actorId: actor.id,
              reason: "Student booking confirmed",
            },
          },
        },
      });
      await writeAudit(tx, {
        actorId: actor.id,
        action: "booking.created",
        targetType: "Booking",
        targetId: booking.id,
        newValues: { status: booking.status, slotId: input.slotId },
      });
      return booking;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function rescheduleBooking(actor: Actor, untrusted: unknown) {
  const input = changeBookingSchema
    .extend({ newSlotId: changeBookingSchema.shape.newSlotId.unwrap() })
    .parse(untrusted);
  const db = getDb();
  return db.$transaction(
    async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: input.bookingId },
        include: { event: true, currentSlot: true },
      });
      if (!booking)
        throw new BookingRuleError("Booking not found.", "NOT_FOUND");
      assertOwnGroup(actor, booking.thesisGroupId);
      if (!activeStatuses.includes(booking.status) || !booking.currentSlot)
        throw new BookingRuleError(
          "This booking cannot be rescheduled.",
          "INVALID_STATUS",
        );
      const oldSlotId = booking.currentSlotId!;
      const isStaff = actor.role === "ADMIN" || actor.role === "SUPERADMIN";
      if (input.administrativeOverride && !isStaff)
        throw new AuthorizationError();
      if (
        !input.administrativeOverride &&
        new Date() > booking.event.rescheduleDeadline
      )
        throw new BookingRuleError(
          "The rescheduling deadline has passed.",
          "DEADLINE_PASSED",
        );

      const newSlot = await tx.timeSlot.findUnique({
        where: { id: input.newSlotId },
        include: { eventDate: true },
      });
      if (
        !newSlot ||
        newSlot.eventDate.eventId !== booking.eventId ||
        newSlot.status !== "AVAILABLE" ||
        newSlot.startsAt <= new Date()
      )
        throw new BookingRuleError(
          "The new slot is unavailable.",
          "SLOT_UNAVAILABLE",
        );
      if (newSlot.id === booking.currentSlotId)
        throw new BookingRuleError("Choose a different slot.", "SAME_SLOT");
      const claimed = await tx.timeSlot.updateMany({
        where: {
          id: newSlot.id,
          status: "AVAILABLE",
          reservedCount: { lt: newSlot.capacity },
        },
        data: { reservedCount: { increment: 1 } },
      });
      if (claimed.count !== 1)
        throw new BookingRuleError(
          "The new slot reached capacity.",
          "SLOT_FULL",
        );

      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: { currentSlotId: newSlot.id, status: "RESCHEDULED" },
      });
      await tx.bookingHistory.create({
        data: {
          bookingId: booking.id,
          status: "RESCHEDULED",
          timeSlotId: newSlot.id,
          actorId: actor.id,
          reason: input.reason,
          metadata: {
            previousSlotId: oldSlotId,
            administrativeOverride: input.administrativeOverride,
          },
        },
      });
      await tx.timeSlot.update({
        where: { id: oldSlotId },
        data: { reservedCount: { decrement: 1 } },
      });
      await writeAudit(tx, {
        actorId: actor.id,
        action: input.administrativeOverride
          ? "booking.override_rescheduled"
          : "booking.rescheduled",
        targetType: "Booking",
        targetId: booking.id,
        previousValues: { slotId: oldSlotId },
        newValues: { slotId: newSlot.id },
        reason: input.reason,
      });
      return updated;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function cancelBooking(actor: Actor, untrusted: unknown) {
  const input = changeBookingSchema.omit({ newSlotId: true }).parse(untrusted);
  const db = getDb();
  return db.$transaction(
    async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: input.bookingId },
        include: { event: true },
      });
      if (!booking)
        throw new BookingRuleError("Booking not found.", "NOT_FOUND");
      assertOwnGroup(actor, booking.thesisGroupId);
      if (!activeStatuses.includes(booking.status))
        throw new BookingRuleError(
          "This booking is no longer active.",
          "INVALID_STATUS",
        );
      const isStaff = actor.role === "ADMIN" || actor.role === "SUPERADMIN";
      if (input.administrativeOverride && !isStaff)
        throw new AuthorizationError();
      if (
        !input.administrativeOverride &&
        new Date() > booking.event.cancellationDeadline
      )
        throw new BookingRuleError(
          "The cancellation deadline has passed.",
          "DEADLINE_PASSED",
        );

      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          currentSlotId: null,
        },
      });
      if (booking.currentSlotId)
        await tx.timeSlot.update({
          where: { id: booking.currentSlotId },
          data: { reservedCount: { decrement: 1 } },
        });
      await tx.bookingHistory.create({
        data: {
          bookingId: booking.id,
          status: "CANCELLED",
          timeSlotId: booking.currentSlotId,
          actorId: actor.id,
          reason: input.reason,
          metadata: { administrativeOverride: input.administrativeOverride },
        },
      });
      await writeAudit(tx, {
        actorId: actor.id,
        action: input.administrativeOverride
          ? "booking.override_cancelled"
          : "booking.cancelled",
        targetType: "Booking",
        targetId: booking.id,
        previousValues: {
          status: booking.status,
          slotId: booking.currentSlotId,
        },
        newValues: { status: "CANCELLED" },
        reason: input.reason,
      });
      return updated;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
