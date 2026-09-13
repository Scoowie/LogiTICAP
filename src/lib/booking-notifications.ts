import "server-only";

import { formatManilaDateTime } from "@/lib/date";
import { getDb } from "@/lib/db";
import { getEmailProvider } from "@/lib/email";

type ChangeType = "RESCHEDULED" | "CANCELLED" | "SCHEDULE_CHANGE" | "VENUE_CHANGE" | "REMINDER";

export async function notifyBookingChange(bookingId: string, type: ChangeType) {
  const db = getDb();
  const booking = await db.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { thesisGroup: true, event: true, currentSlot: true },
  });
  const details = booking.currentSlot
    ? `${formatManilaDateTime(booking.currentSlot.startsAt)} at ${booking.event.venue}`
    : booking.event.title;
  const subjects: Record<ChangeType, string> = {
    RESCHEDULED: "Photoshoot booking rescheduled",
    CANCELLED: "Photoshoot booking cancelled",
    SCHEDULE_CHANGE: "Photoshoot schedule changed",
    VENUE_CHANGE: "Photoshoot venue changed",
    REMINDER: "Upcoming photoshoot reminder",
  };
  const notification = await db.notification.create({
    data: {
      userId: booking.thesisGroup.representativeId,
      type,
      subject: subjects[type],
      body: `${subjects[type]}. Reference: ${booking.publicReference}. ${details}`,
    },
  });
  try {
    const sent = await getEmailProvider().send({
      to: booking.thesisGroup.verifiedEmail,
      subject: `${subjects[type]} · ${booking.publicReference}`,
      text: `${subjects[type]}. Reference: ${booking.publicReference}. Sign in to TLMS for private details.`,
    });
    await db.notification.update({
      where: { id: notification.id },
      data: { status: "SENT", sentAt: new Date(), providerId: sent.id },
    });
  } catch (error) {
    await db.notification.update({
      where: { id: notification.id },
      data: {
        status: "FAILED",
        failureCode: error instanceof Error ? error.name.slice(0, 120) : "UNKNOWN",
      },
    });
  }
}
