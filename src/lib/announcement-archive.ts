import { z } from "zod";
import type { AppRole } from "@/lib/auth/permissions";

export const announcementArchiveViewSchema = z
  .enum(["active", "archived"])
  .catch("active");

export type AnnouncementArchiveView = z.infer<
  typeof announcementArchiveViewSchema
>;

export function canArchiveAnnouncement(role: AppRole, archivedAt: Date | null) {
  return role === "SUPERADMIN" && archivedAt === null;
}
