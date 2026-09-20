import { describe, expect, it } from "vitest";
import { canAcceptStaffInvitation } from "./invitation-rules";

const now = new Date("2026-09-20T00:00:00Z");
const profile = {
  email: "student@example.edu",
  role: "STUDENT" as const,
  status: "ACTIVE" as const,
};
const invitation = {
  email: "student@example.edu",
  status: "PENDING" as const,
  expiresAt: new Date("2026-09-27T00:00:00Z"),
};

describe("staff invitation acceptance", () => {
  it("requires an active student profile with the same verified email", () => {
    expect(canAcceptStaffInvitation(profile, invitation, now)).toBe(true);
    expect(
      canAcceptStaffInvitation(
        { ...profile, email: "other@example.edu" },
        invitation,
        now,
      ),
    ).toBe(false);
    expect(
      canAcceptStaffInvitation(
        { ...profile, status: "SUSPENDED" },
        invitation,
        now,
      ),
    ).toBe(false);
    expect(
      canAcceptStaffInvitation({ ...profile, role: "ADMIN" }, invitation, now),
    ).toBe(false);
  });

  it("rejects expired, revoked, and already accepted invitations", () => {
    expect(
      canAcceptStaffInvitation(
        profile,
        { ...invitation, expiresAt: new Date("2026-09-19T00:00:00Z") },
        now,
      ),
    ).toBe(false);
    for (const status of ["REVOKED", "ACCEPTED", "EXPIRED"] as const) {
      expect(
        canAcceptStaffInvitation(profile, { ...invitation, status }, now),
      ).toBe(false);
    }
  });
});
