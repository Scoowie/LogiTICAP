import { describe, expect, it } from "vitest";
import { getPublicSlotAvailability } from "./schedule-availability";

describe("public schedule availability", () => {
  it("marks an available slot with remaining capacity as available", () => {
    expect(
      getPublicSlotAvailability({
        status: "AVAILABLE",
        capacity: 3,
        reservedCount: 1,
      }),
    ).toEqual({ available: true, remaining: 2 });
  });

  it("marks full, blocked, and closed slots as unavailable", () => {
    expect(
      getPublicSlotAvailability({
        status: "AVAILABLE",
        capacity: 1,
        reservedCount: 1,
      }).available,
    ).toBe(false);
    expect(
      getPublicSlotAvailability({
        status: "BLOCKED",
        capacity: 2,
        reservedCount: 0,
      }).available,
    ).toBe(false);
    expect(
      getPublicSlotAvailability({
        status: "CLOSED",
        capacity: 2,
        reservedCount: 0,
      }).available,
    ).toBe(false);
  });
});
