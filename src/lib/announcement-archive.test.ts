import { describe, expect, it } from "vitest";
import {
  announcementArchiveViewSchema,
  canArchiveAnnouncement,
} from "./announcement-archive";

describe("announcement archive rules", () => {
  it("accepts only supported archive views", () => {
    expect(announcementArchiveViewSchema.parse("active")).toBe("active");
    expect(announcementArchiveViewSchema.parse("archived")).toBe("archived");
    expect(announcementArchiveViewSchema.parse("unexpected")).toBe("active");
    expect(announcementArchiveViewSchema.parse(undefined)).toBe("active");
  });

  it("allows only a superadmin to archive an active announcement", () => {
    expect(canArchiveAnnouncement("SUPERADMIN", null)).toBe(true);
    expect(canArchiveAnnouncement("ADMIN", null)).toBe(false);
    expect(canArchiveAnnouncement("LOGISTICS_MEMBER", null)).toBe(false);
    expect(canArchiveAnnouncement("STUDENT", null)).toBe(false);
    expect(canArchiveAnnouncement("SUPERADMIN", new Date())).toBe(false);
  });
});
