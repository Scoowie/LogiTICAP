import "server-only";

import type { Prisma, PrismaClient } from "@/generated/prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;
const forbidden = /token|secret|password|credential|authorization/i;

function sanitize(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  if (value === null) return undefined;
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  )
    return value;
  if (Array.isArray(value)) return value.map((item) => sanitize(item) ?? null);
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !forbidden.test(key))
        .map(([key, item]) => [key, sanitize(item) ?? null]),
    );
  }
  return String(value);
}

export async function writeAudit(
  db: Db,
  input: {
    actorId?: string;
    action: string;
    targetType: string;
    targetId: string;
    previousValues?: unknown;
    newValues?: unknown;
    reason?: string;
  },
) {
  await db.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      previousValues: sanitize(input.previousValues),
      newValues: sanitize(input.newValues),
      reason: input.reason,
    },
  });
}
