import { describe, expect, it } from "vitest";
import {
  bookingBelongsToActor,
  deadlineAllows,
  isActiveBooking,
  slotCanAccept,
} from "./booking-rules";

describe("booking invariants", () => {
  const now = new Date("2026-01-01T00:00:00Z");
  it("defines statuses that participate in one-active-booking protection", () => {
    expect(isActiveBooking("CONFIRMED")).toBe(true);
    expect(isActiveBooking("CHECKED_IN")).toBe(true);
    expect(isActiveBooking("CANCELLED")).toBe(false);
    expect(isActiveBooking("COMPLETED")).toBe(false);
  });
  it("rejects full, blocked, and expired slots", () => {
    expect(
      slotCanAccept(
        {
          status: "AVAILABLE",
          reservedCount: 2,
          capacity: 2,
          startsAt: new Date("2026-01-02T00:00:00Z"),
        },
        now,
      ),
    ).toBe(false);
    expect(
      slotCanAccept(
        {
          status: "BLOCKED",
          reservedCount: 0,
          capacity: 2,
          startsAt: new Date("2026-01-02T00:00:00Z"),
        },
        now,
      ),
    ).toBe(false);
    expect(
      slotCanAccept(
        { status: "AVAILABLE", reservedCount: 0, capacity: 2, startsAt: now },
        now,
      ),
    ).toBe(false);
  });
  it("permits a slot only while capacity remains", () => {
    expect(
      slotCanAccept(
        {
          status: "AVAILABLE",
          reservedCount: 1,
          capacity: 2,
          startsAt: new Date("2026-01-02T00:00:00Z"),
        },
        now,
      ),
    ).toBe(true);
  });
  it("enforces deadlines except for an authorized override", () => {
    const deadline = new Date("2025-12-31T23:00:00Z");
    expect(deadlineAllows(now, deadline, false)).toBe(false);
    expect(deadlineAllows(now, deadline, true)).toBe(true);
  });
  it("isolates students to their own thesis group", () => {
    expect(
      bookingBelongsToActor(
        { role: "STUDENT", thesisGroupId: "group-a" },
        "group-a",
      ),
    ).toBe(true);
    expect(
      bookingBelongsToActor(
        { role: "STUDENT", thesisGroupId: "group-a" },
        "group-b",
      ),
    ).toBe(false);
    expect(
      bookingBelongsToActor({ role: "ADMIN", thesisGroupId: null }, "group-b"),
    ).toBe(true);
  });
});
