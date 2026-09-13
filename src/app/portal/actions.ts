"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { writeAudit } from "@/lib/audit";
import { requireActor } from "@/lib/auth/session";
import {
  cancelBooking,
  createBooking,
  rescheduleBooking,
} from "@/lib/booking-service";
import { getDb } from "@/lib/db";
import { getEmailProvider } from "@/lib/email";
import { getRateLimiter } from "@/lib/rate-limit";
import { thesisGroupSchema } from "@/lib/validation";

export async function createThesisGroup(form: FormData) {
  const actor = await requireActor();
  if (actor.role !== "STUDENT" || actor.thesisGroupId)
    throw new Error("A group is already linked to this account.");
  const memberNames = form.getAll("memberName");
  const memberNumbers = form.getAll("memberNumber");
  const memberEmails = form.getAll("memberEmail");
  const parsed = thesisGroupSchema.safeParse({
    name: form.get("name"),
    thesisTitle: form.get("thesisTitle"),
    section: form.get("section"),
    program: form.get("program"),
    adviserName: form.get("adviserName"),
    representativeName: form.get("representativeName"),
    verifiedEmail: actor.email,
    contactNumber: form.get("contactNumber"),
    members: memberNames
      .map((fullName, index) => ({
        fullName,
        studentNumber: memberNumbers[index],
        schoolEmail: memberEmails[index] || undefined,
      }))
      .filter(
        (member) =>
          typeof member.fullName === "string" &&
          member.fullName.trim().length > 0,
      ),
  });
  if (!parsed.success)
    throw new Error(
      parsed.error.issues.map((issue) => issue.message).join("; "),
    );
  const input = parsed.data;
  const db = getDb();
  await db.$transaction(
    async (tx) => {
      const group = await tx.thesisGroup.create({
        data: {
          name: input.name,
          thesisTitle: input.thesisTitle,
          section: input.section,
          program: input.program,
          adviserName: input.adviserName || null,
          representativeId: actor.id,
          representativeName: input.representativeName,
          verifiedEmail: actor.email,
          contactNumber: input.contactNumber,
          members: {
            create: input.members.map((member) => ({
              ...member,
              schoolEmail: member.schoolEmail || null,
            })),
          },
        },
      });
      await tx.userProfile.update({
        where: { id: actor.id },
        data: {
          thesisGroupId: group.id,
          fullName: input.representativeName,
          contactNumber: input.contactNumber,
        },
      });
      await writeAudit(tx, {
        actorId: actor.id,
        action: "group.created",
        targetType: "ThesisGroup",
        targetId: group.id,
        newValues: { name: group.name, memberCount: input.members.length },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
  revalidatePath("/portal", "layout");
  redirect("/portal/group?created=1");
}

export async function submitBooking(form: FormData) {
  const actor = await requireActor();
  if (!actor.thesisGroupId)
    throw new Error("Create your thesis group before booking.");
  if (!(await getRateLimiter().consume(`booking:${actor.id}`, 8, 15 * 60_000)))
    throw new Error("Too many booking attempts. Try again later.");
  const booking = await createBooking(actor, {
    eventId: form.get("eventId"),
    thesisGroupId: actor.thesisGroupId,
    slotId: form.get("slotId"),
    idempotencyKey: form.get("idempotencyKey"),
    alternativePreference: form.get("alternativePreference") || undefined,
    schedulingConcern: form.get("schedulingConcern") || undefined,
    accessibilityNeed: form.get("accessibilityNeed") || undefined,
    accuracyAccepted: form.get("accuracyAccepted") === "on",
    rulesAccepted: form.get("rulesAccepted") === "on",
    notificationsAccepted: form.get("notificationsAccepted") === "on",
    privacyAccepted: form.get("privacyAccepted") === "on",
  });
  const db = getDb();
  const details = await db.booking.findUniqueOrThrow({
    where: { id: booking.id },
    include: { thesisGroup: true, event: true, currentSlot: true },
  });
  const notification = await db.notification.create({
    data: {
      userId: actor.id,
      type: "BOOKING_CONFIRMATION",
      subject: `Booking confirmed: ${booking.publicReference}`,
      body: `Your group is confirmed for ${details.event.title}. Reference: ${booking.publicReference}`,
    },
  });
  try {
    const result = await getEmailProvider().send({
      to: actor.email,
      subject: `TICAP photoshoot booking ${booking.publicReference}`,
      text: `Your booking is confirmed. Reference: ${booking.publicReference}. Sign in to TLMS for private schedule and venue details.`,
    });
    await db.notification.update({
      where: { id: notification.id },
      data: { status: "SENT", sentAt: new Date(), providerId: result.id },
    });
  } catch (error) {
    await db.notification.update({
      where: { id: notification.id },
      data: {
        status: "FAILED",
        failureCode:
          error instanceof Error ? error.name.slice(0, 120) : "UNKNOWN",
      },
    });
  }
  revalidatePath("/portal");
  redirect(
    `/portal/booking?confirmed=${encodeURIComponent(booking.publicReference)}`,
  );
}

export async function manageOwnBooking(form: FormData) {
  const actor = await requireActor();
  if (actor.role !== "STUDENT") throw new Error("Student access required.");
  const action = form.get("action");
  const payload = {
    bookingId: form.get("bookingId"),
    newSlotId: form.get("newSlotId") || undefined,
    reason: form.get("reason"),
    administrativeOverride: false,
  };
  if (action === "reschedule") await rescheduleBooking(actor, payload);
  else if (action === "cancel") await cancelBooking(actor, payload);
  else throw new Error("Invalid booking action.");
  revalidatePath("/portal", "layout");
  redirect(`/portal/booking?changed=${action}`);
}
