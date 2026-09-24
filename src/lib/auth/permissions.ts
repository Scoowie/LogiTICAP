export const ROLES = [
  "SUPERADMIN",
  "ADMIN",
  "LOGISTICS_MEMBER",
  "STUDENT",
] as const;
export type AppRole = (typeof ROLES)[number];

export type Permission =
  | "events:manage"
  | "bookings:own"
  | "bookings:manage"
  | "checkin:manage"
  | "assignments:manage"
  | "announcements:manage"
  | "announcements:archive"
  | "exports:standard"
  | "exports:restricted"
  | "users:manage"
  | "roles:assign-superadmin"
  | "audit:view"
  | "settings:manage";

const matrix: Record<AppRole, ReadonlySet<Permission>> = {
  SUPERADMIN: new Set([
    "events:manage",
    "bookings:own",
    "bookings:manage",
    "checkin:manage",
    "assignments:manage",
    "announcements:manage",
    "announcements:archive",
    "exports:standard",
    "exports:restricted",
    "users:manage",
    "roles:assign-superadmin",
    "audit:view",
    "settings:manage",
  ]),
  ADMIN: new Set([
    "events:manage",
    "bookings:own",
    "bookings:manage",
    "checkin:manage",
    "assignments:manage",
    "announcements:manage",
    "exports:standard",
    "audit:view",
  ]),
  LOGISTICS_MEMBER: new Set(["checkin:manage"]),
  STUDENT: new Set(["bookings:own"]),
};

export function hasPermission(role: AppRole, permission: Permission): boolean {
  return matrix[role].has(permission);
}

export function canAssignRole(actor: AppRole, target: AppRole): boolean {
  if (target === "SUPERADMIN") return actor === "SUPERADMIN";
  return (
    actor === "SUPERADMIN" ||
    (actor === "ADMIN" && target === "LOGISTICS_MEMBER")
  );
}

export function canViewAudit(role: AppRole, action: string): boolean {
  if (role === "SUPERADMIN") return true;
  if (role !== "ADMIN") return false;
  return !action.startsWith("security.") && !action.startsWith("role.");
}
