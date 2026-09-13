import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import type { AppRole, Permission } from "@/lib/auth/permissions";
import { hasPermission } from "@/lib/auth/permissions";
import { getDb } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type Actor = {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
  thesisGroupId: string | null;
};

export const getActor = cache(async (): Promise<Actor | null> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.email) return null;
  const profile = await getDb().userProfile.findUnique({
    where: { id: data.user.id },
  });
  if (!profile || profile.status !== "ACTIVE") return null;
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.fullName,
    role: profile.role,
    thesisGroupId: profile.thesisGroupId,
  };
});

export async function requireActor(): Promise<Actor> {
  const actor = await getActor();
  if (!actor) redirect("/sign-in?next=/portal");
  return actor;
}

export async function requirePermission(
  permission: Permission,
): Promise<Actor> {
  const actor = await requireActor();
  if (!hasPermission(actor.role, permission)) throw new AuthorizationError();
  return actor;
}

export class AuthorizationError extends Error {
  constructor() {
    super("You are not authorized to perform this action.");
    this.name = "AuthorizationError";
  }
}

export function assertOwnGroup(actor: Actor, groupId: string) {
  if (hasPermission(actor.role, "bookings:manage")) return;
  if (actor.role !== "STUDENT" || actor.thesisGroupId !== groupId)
    throw new AuthorizationError();
}
