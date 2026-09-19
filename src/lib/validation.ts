import { z } from "zod";

export const uuid = z.string().uuid();
export const phone = z
  .string()
  .trim()
  .min(7)
  .max(32)
  .regex(/^[+()\-\s0-9]+$/, "Enter a valid contact number");
export const safeText = (max: number) => z.string().trim().min(1).max(max);

const manilaLocalDateTime = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/);

export const eventCreationSchema = z
  .object({
    title: safeText(160),
    description: safeText(2000),
    venue: safeText(240),
    preparationInstructions: safeText(4000),
    bookingOpensAt: manilaLocalDateTime,
    bookingClosesAt: manilaLocalDateTime,
    rescheduleDeadline: manilaLocalDateTime,
    cancellationDeadline: manilaLocalDateTime,
    slotDurationMinutes: z.coerce.number().int().min(5).max(480),
    capacity: z.coerce.number().int().min(1).max(100),
    dates: z.array(z.iso.date()).min(1).max(30),
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  })
  .refine(
    (value) =>
      new Date(`${value.bookingOpensAt}:00+08:00`) <
      new Date(`${value.bookingClosesAt}:00+08:00`),
    { message: "Booking must open before it closes" },
  );

export const groupMemberSchema = z.object({
  fullName: safeText(160),
  studentNumber: z
    .string()
    .trim()
    .min(1, "Enter a student number")
    .max(40)
    .refine(
      (value) => value.length === 0 || /^[A-Za-z0-9-]+$/.test(value),
      "Use letters, numbers, and hyphens only",
    ),
  schoolEmail: z.email().max(320).optional().or(z.literal("")),
  groupRole: z.string().trim().max(80).optional(),
});

export const thesisGroupSchema = z.object({
  name: safeText(120),
  thesisTitle: safeText(300),
  section: safeText(80),
  program: safeText(120),
  adviserName: z.string().trim().max(160).optional(),
  representativeName: safeText(160),
  verifiedEmail: z.email().max(320),
  contactNumber: phone,
  members: z.array(groupMemberSchema).min(1).max(12),
});

export const bookingSchema = z.object({
  eventId: uuid,
  thesisGroupId: uuid,
  slotId: uuid,
  idempotencyKey: z.string().uuid(),
  alternativePreference: z.string().trim().max(500).optional(),
  schedulingConcern: z.string().trim().max(1000).optional(),
  accessibilityNeed: z.string().trim().max(1000).optional(),
  accuracyAccepted: z.literal(true),
  rulesAccepted: z.literal(true),
  notificationsAccepted: z.literal(true),
  privacyAccepted: z.literal(true),
});

export const changeBookingSchema = z.object({
  bookingId: uuid,
  newSlotId: uuid.optional(),
  reason: safeText(1000),
  administrativeOverride: z.boolean().default(false),
});

export const exportQuerySchema = z.object({
  format: z.enum(["csv", "xlsx"]).default("csv"),
  report: z.enum([
    "master",
    "by-date",
    "media",
    "attendance",
    "unbooked",
    "changes",
    "contacts",
  ]),
  eventId: uuid.optional(),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
});

export const signInSchema = z.object({
  email: z.email().max(320),
  next: z.string().startsWith("/").default("/portal"),
});
