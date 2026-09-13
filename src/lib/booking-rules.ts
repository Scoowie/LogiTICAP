export const ACTIVE_BOOKING_STATUSES = [
  "PENDING_VERIFICATION",
  "CONFIRMED",
  "RESCHEDULE_REQUESTED",
  "RESCHEDULED",
  "CHECKED_IN",
] as const;
export type ActiveBookingStatus = (typeof ACTIVE_BOOKING_STATUSES)[number];

export function isActiveBooking(status: string): status is ActiveBookingStatus {
  return ACTIVE_BOOKING_STATUSES.includes(status as ActiveBookingStatus);
}

export function deadlineAllows(
  now: Date,
  deadline: Date,
  administrativeOverride: boolean,
): boolean {
  return administrativeOverride || now <= deadline;
}

export function slotCanAccept(
  input: {
    status: string;
    reservedCount: number;
    capacity: number;
    startsAt: Date;
  },
  now: Date,
): boolean {
  return (
    input.status === "AVAILABLE" &&
    input.reservedCount >= 0 &&
    input.reservedCount < input.capacity &&
    input.startsAt > now
  );
}

export function bookingBelongsToActor(
  actor: { role: string; thesisGroupId: string | null },
  groupId: string,
): boolean {
  return (
    actor.role === "SUPERADMIN" ||
    actor.role === "ADMIN" ||
    (actor.role === "STUDENT" && actor.thesisGroupId === groupId)
  );
}
