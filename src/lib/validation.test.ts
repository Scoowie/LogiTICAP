import { describe, expect, it } from "vitest";
import {
  bookingSchema,
  buildFullName,
  eventCreationSchema,
  exportQuerySchema,
  onboardingSchema,
  passwordUpdateSchema,
  thesisGroupSchema,
} from "./validation";

const ids = {
  eventId: "123e4567-e89b-12d3-a456-426614174000",
  thesisGroupId: "123e4567-e89b-12d3-a456-426614174001",
  slotId: "123e4567-e89b-12d3-a456-426614174002",
  idempotencyKey: "123e4567-e89b-42d3-a456-426614174003",
};

describe("runtime validation", () => {
  const event = {
    title: "Thesis photoshoot",
    description: "Official thesis group photoshoot schedule.",
    venue: "TICAP Hall",
    preparationInstructions: "Arrive ten minutes early.",
    bookingOpensAt: "2026-10-01T08:00",
    bookingClosesAt: "2026-10-15T17:00",
    rescheduleDeadline: "2026-10-14T17:00",
    cancellationDeadline: "2026-10-14T17:00",
    slotDurationMinutes: 20,
    capacity: 1,
    startTime: "08:00",
    endTime: "17:00",
  };

  it("allows up to 30 unique event dates", () => {
    expect(
      eventCreationSchema.safeParse({ ...event, dates: ["2026-10-20"] })
        .success,
    ).toBe(true);
    expect(
      eventCreationSchema.safeParse({
        ...event,
        dates: ["2026-10-20", "2026-10-21", "2026-10-22"],
      }).success,
    ).toBe(true);
    expect(
      eventCreationSchema.safeParse({
        ...event,
        dates: ["2026-10-20", "2026-10-20"],
      }).success,
    ).toBe(false);
    expect(
      eventCreationSchema.safeParse({
        ...event,
        dates: Array.from({ length: 31 }, (_, index) =>
          new Date(Date.UTC(2026, 9, 1 + index)).toISOString().slice(0, 10),
        ),
      }).success,
    ).toBe(false);
    expect(eventCreationSchema.safeParse({ ...event, dates: [] }).success).toBe(
      false,
    );
    expect(
      eventCreationSchema.safeParse({ ...event, dates: ["20 October 2026"] })
        .success,
    ).toBe(false);
  });

  it("requires every booking acknowledgement", () => {
    expect(
      bookingSchema.safeParse({
        ...ids,
        accuracyAccepted: true,
        rulesAccepted: true,
        notificationsAccepted: true,
        privacyAccepted: false,
      }).success,
    ).toBe(false);
    expect(
      bookingSchema.safeParse({
        ...ids,
        accuracyAccepted: true,
        rulesAccepted: true,
        notificationsAccepted: true,
        privacyAccepted: true,
      }).success,
    ).toBe(true);
  });
  it("rejects unstructured or malformed group members", () => {
    const base = {
      name: "G-1",
      thesisTitle: "Security",
      section: "A",
      program: "Cybersecurity",
      representativeName: "Representative",
      verifiedEmail: "student@example.edu",
      contactNumber: "+63 900 000 0000",
    };
    expect(thesisGroupSchema.safeParse({ ...base, members: [] }).success).toBe(
      false,
    );
    expect(
      thesisGroupSchema.safeParse({
        ...base,
        members: [{ fullName: "Member", studentNumber: "bad number!" }],
      }).success,
    ).toBe(false);
  });
  it("reports one clear error for a blank member student number", () => {
    const result = thesisGroupSchema.safeParse({
      name: "G-1",
      thesisTitle: "Security",
      section: "A",
      program: "Cybersecurity",
      representativeName: "Representative",
      verifiedEmail: "student@example.edu",
      contactNumber: "+63 900 000 0000",
      members: [{ fullName: "Member", studentNumber: "" }],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual([
        expect.objectContaining({
          path: ["members", 0, "studentNumber"],
          message: "Enter a student number",
        }),
      ]);
    }
  });
  it("restricts export report and format values", () => {
    expect(
      exportQuerySchema.safeParse({ report: "contacts", format: "xlsx" })
        .success,
    ).toBe(true);
    expect(
      exportQuerySchema.safeParse({ report: "all-secrets", format: "pdf" })
        .success,
    ).toBe(false);
  });

  it("normalizes structured onboarding names and email", () => {
    const result = onboardingSchema.parse({
      firstName: "  María  ",
      middleName: "  Dela   Cruz ",
      lastName: " O’Neil ",
      suffix: " Jr. ",
      contactNumber: "+63 900 000 0000",
      email: " STUDENT@Example.edu ",
      password: "StrongPassword1!",
      confirmPassword: "StrongPassword1!",
      privacyViewed: "true",
      privacyAccepted: "on",
    });

    expect(result).toMatchObject({
      firstName: "María",
      middleName: "Dela Cruz",
      lastName: "O’Neil",
      suffix: "Jr.",
      email: "student@example.edu",
    });
    expect(buildFullName(result)).toBe("María Dela Cruz O’Neil, Jr.");
  });

  it("requires strong matching onboarding passwords", () => {
    const base = {
      firstName: "Student",
      middleName: "",
      lastName: "User",
      suffix: "",
      contactNumber: "+63 900 000 0000",
      email: "student@example.edu",
      privacyViewed: "true",
      privacyAccepted: "on",
    };
    expect(
      onboardingSchema.safeParse({
        ...base,
        password: "weakpassword",
        confirmPassword: "weakpassword",
      }).success,
    ).toBe(false);
    expect(
      passwordUpdateSchema.safeParse({
        password: "StrongPassword1!",
        confirmPassword: "DifferentPassword1!",
      }).success,
    ).toBe(false);
  });

  it("rejects control and markup characters in names", () => {
    expect(
      onboardingSchema.safeParse({
        firstName: "<Admin>",
        middleName: "",
        lastName: "User",
        suffix: "",
        contactNumber: "+63 900 000 0000",
        email: "student@example.edu",
        password: "StrongPassword1!",
        confirmPassword: "StrongPassword1!",
        privacyViewed: "true",
        privacyAccepted: "on",
      }).success,
    ).toBe(false);
  });

  it("requires the privacy agreement to be viewed and accepted", () => {
    const base = {
      firstName: "Student",
      middleName: "",
      lastName: "User",
      suffix: "",
      contactNumber: "+63 900 000 0000",
      email: "student@example.edu",
      password: "StrongPassword1!",
      confirmPassword: "StrongPassword1!",
    };

    expect(onboardingSchema.safeParse(base).success).toBe(false);
    expect(
      onboardingSchema.safeParse({
        ...base,
        privacyViewed: "true",
        privacyAccepted: "on",
      }).success,
    ).toBe(true);
  });
});
