import { describe, expect, it } from "vitest";
import {
  canChangeEventStatus,
  CLOSED_EVENT_ARCHIVE_DELAY_MS,
  eventArchiveViewSchema,
  getClosedEventArchiveCutoff,
  getNextEventClosedAt,
  isEventArchived,
} from "./event-archive";

const now = new Date("2026-09-24T12:00:00.000Z");

describe("closed event archiving", () => {
  it("accepts known archive views and defaults invalid input to active", () => {
    expect(eventArchiveViewSchema.parse("archived")).toBe("archived");
    expect(eventArchiveViewSchema.parse("invalid")).toBe("active");
    expect(eventArchiveViewSchema.parse(undefined)).toBe("active");
  });

  it("limits status changes to manageable event states", () => {
    expect(canChangeEventStatus("DRAFT", "OPEN")).toBe(true);
    expect(canChangeEventStatus("DRAFT", "CLOSED")).toBe(false);
    expect(canChangeEventStatus("OPEN", "CLOSED")).toBe(true);
    expect(canChangeEventStatus("CLOSED", "OPEN")).toBe(true);
    expect(canChangeEventStatus("COMPLETED", "OPEN")).toBe(false);
    expect(canChangeEventStatus("ARCHIVED", "OPEN")).toBe(false);
  });

  it("computes a cutoff exactly 72 hours before now", () => {
    expect(getClosedEventArchiveCutoff(now)).toEqual(
      new Date(now.getTime() - CLOSED_EVENT_ARCHIVE_DELAY_MS),
    );
  });

  it("keeps a closed event active until the cutoff", () => {
    expect(
      isEventArchived(
        {
          status: "CLOSED",
          closedAt: new Date(now.getTime() - CLOSED_EVENT_ARCHIVE_DELAY_MS + 1),
        },
        now,
      ),
    ).toBe(false);
  });

  it("archives a closed event at and after the cutoff", () => {
    for (const closedAt of [
      new Date(now.getTime() - CLOSED_EVENT_ARCHIVE_DELAY_MS),
      new Date(now.getTime() - CLOSED_EVENT_ARCHIVE_DELAY_MS - 1),
    ]) {
      expect(isEventArchived({ status: "CLOSED", closedAt }, now)).toBe(true);
    }
  });

  it("keeps non-closed events active and explicit archives archived", () => {
    expect(isEventArchived({ status: "OPEN", closedAt: null }, now)).toBe(
      false,
    );
    expect(isEventArchived({ status: "DRAFT", closedAt: null }, now)).toBe(
      false,
    );
    expect(isEventArchived({ status: "ARCHIVED", closedAt: null }, now)).toBe(
      true,
    );
  });

  it("sets, preserves, and clears the closure timestamp", () => {
    const originalClosedAt = new Date("2026-09-20T08:00:00.000Z");

    expect(getNextEventClosedAt("CLOSED", null, now)).toBe(now);
    expect(getNextEventClosedAt("CLOSED", originalClosedAt, now)).toBe(
      originalClosedAt,
    );
    expect(getNextEventClosedAt("OPEN", originalClosedAt, now)).toBeNull();
  });
});
