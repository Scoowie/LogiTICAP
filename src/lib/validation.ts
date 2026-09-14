import { z } from "zod";

export const uuid = z.string().uuid();
export const phone = z
  .string()
  .trim()
  .min(7)
  .max(32)
  .regex(/^[+()\-\s0-9]+$/, "Enter a valid contact number");
export const safeText = (max: number) => z.string().trim().min(1).max(max);

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
