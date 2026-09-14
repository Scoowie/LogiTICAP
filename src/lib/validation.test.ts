import { describe, expect, it } from "vitest";
import {
  bookingSchema,
  exportQuerySchema,
  thesisGroupSchema,
} from "./validation";

const ids = {
  eventId: "123e4567-e89b-12d3-a456-426614174000",
  thesisGroupId: "123e4567-e89b-12d3-a456-426614174001",
  slotId: "123e4567-e89b-12d3-a456-426614174002",
  idempotencyKey: "123e4567-e89b-42d3-a456-426614174003",
};

describe("runtime validation", () => {
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
});
