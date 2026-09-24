import { z } from "zod";

export const CLOSED_EVENT_ARCHIVE_DELAY_MS = 72 * 60 * 60 * 1000;

export type EventArchiveView = "active" | "archived";
export const eventArchiveViewSchema = z
  .enum(["active", "archived"])
  .catch("active");

export function canChangeEventStatus(
  currentStatus: string,
  nextStatus: "OPEN" | "CLOSED",
) {
  if (currentStatus === "DRAFT") return nextStatus === "OPEN";
  return currentStatus === "OPEN" || currentStatus === "CLOSED";
}

export function getClosedEventArchiveCutoff(now = new Date()) {
  return new Date(now.getTime() - CLOSED_EVENT_ARCHIVE_DELAY_MS);
}

export function getNextEventClosedAt(
  nextStatus: "OPEN" | "CLOSED",
  currentClosedAt: Date | null,
  now = new Date(),
) {
  return nextStatus === "CLOSED" ? (currentClosedAt ?? now) : null;
}

export function isEventArchived(
  event: { status: string; closedAt: Date | string | null },
  now = new Date(),
) {
  if (event.status === "ARCHIVED") return true;
  if (event.status !== "CLOSED" || !event.closedAt) return false;
  return new Date(event.closedAt) <= getClosedEventArchiveCutoff(now);
}
