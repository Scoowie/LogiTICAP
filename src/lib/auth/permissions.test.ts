import { describe, expect, it } from "vitest";
import { canAssignRole, hasPermission } from "./permissions";

describe("role permissions", () => {
  it("keeps student access limited to their own bookings", () => {
    expect(hasPermission("STUDENT", "bookings:own")).toBe(true);
    expect(hasPermission("STUDENT", "bookings:manage")).toBe(false);
    expect(hasPermission("STUDENT", "exports:standard")).toBe(false);
  });
  it("allows logistics members to check in but not export or manage configuration", () => {
    expect(hasPermission("LOGISTICS_MEMBER", "checkin:manage")).toBe(true);
    expect(hasPermission("LOGISTICS_MEMBER", "events:manage")).toBe(false);
    expect(hasPermission("LOGISTICS_MEMBER", "exports:standard")).toBe(false);
  });
  it("prevents admins from assigning superadmin and security roles", () => {
    expect(canAssignRole("ADMIN", "SUPERADMIN")).toBe(false);
    expect(canAssignRole("ADMIN", "LOGISTICS_MEMBER")).toBe(true);
    expect(hasPermission("ADMIN", "users:manage")).toBe(false);
  });
  it("reserves restricted exports and superadmin assignment for superadmins", () => {
    expect(hasPermission("SUPERADMIN", "exports:restricted")).toBe(true);
    expect(canAssignRole("SUPERADMIN", "SUPERADMIN")).toBe(true);
  });
});
