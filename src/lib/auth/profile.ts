import "server-only";

import type { User } from "@supabase/supabase-js";
import type { Prisma, UserProfile } from "@/generated/prisma/client";
import { writeAudit } from "@/lib/audit";
import { canAcceptStaffInvitation } from "@/lib/auth/invitation-rules";
import { getDb } from "@/lib/db";
import { buildFullName, onboardingProfileSchema } from "@/lib/validation";

type Transaction = Prisma.TransactionClient;

async function acceptMatchingInvitation(tx: Transaction, profile: UserProfile) {
  if (profile.status !== "ACTIVE" || profile.role !== "STUDENT") return profile;

  const invitation = await tx.staffInvitation.findFirst({
    where: {
      email: profile.email,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!invitation || !canAcceptStaffInvitation(profile, invitation))
    return profile;

  const claimed = await tx.staffInvitation.updateMany({
    where: {
      id: invitation.id,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
    data: { status: "ACCEPTED", acceptedAt: new Date() },
  });
  if (claimed.count !== 1) return profile;

  const updated = await tx.userProfile.update({
    where: { id: profile.id },
    data: { role: invitation.role },
  });
  await writeAudit(tx, {
    actorId: profile.id,
    action: "staff.invitation_accepted",
    targetType: "StaffInvitation",
    targetId: invitation.id,
    newValues: { role: invitation.role },
  });
  return updated;
}

function verifiedEmail(user: User) {
  if (!user.email || !user.email_confirmed_at)
    throw new Error("A verified email address is required.");
  return user.email.trim().toLowerCase();
}

export async function completeOnboarding(user: User) {
  const email = verifiedEmail(user);
  const details = onboardingProfileSchema.parse(user.user_metadata);
  const fullName = buildFullName(details);
  const db = getDb();

  return db.$transaction(async (tx) => {
    const existing = await tx.userProfile.findUnique({
      where: { id: user.id },
    });
    const profile = existing
      ? await tx.userProfile.update({
          where: { id: user.id },
          data: {
            email,
            firstName: details.firstName,
            middleName: details.middleName ?? null,
            lastName: details.lastName,
            suffix: details.suffix ?? null,
            fullName,
            contactNumber: details.contactNumber,
          },
        })
      : await tx.userProfile.create({
          data: {
            id: user.id,
            email,
            firstName: details.firstName,
            middleName: details.middleName,
            lastName: details.lastName,
            suffix: details.suffix,
            fullName,
            contactNumber: details.contactNumber,
            role: "STUDENT",
          },
        });

    if (!existing) {
      await writeAudit(tx, {
        actorId: profile.id,
        action: "account.onboarding_completed",
        targetType: "UserProfile",
        targetId: profile.id,
        newValues: { role: profile.role },
      });
    }
    return acceptMatchingInvitation(tx, profile);
  });
}

export type LoginProfileResult =
  | {
      status: "ACTIVE";
      role: "SUPERADMIN" | "ADMIN" | "LOGISTICS_MEMBER" | "STUDENT";
    }
  | { status: "INACTIVE" }
  | { status: "MISSING" };

export async function prepareLoginProfile(
  user: User,
): Promise<LoginProfileResult> {
  const email = verifiedEmail(user);
  let profile = await getDb().userProfile.findUnique({
    where: { id: user.id },
  });

  if (!profile) {
    const parsed = onboardingProfileSchema.safeParse(user.user_metadata);
    if (!parsed.success) return { status: "MISSING" };
    profile = await completeOnboarding(user);
  }
  if (profile.status !== "ACTIVE") return { status: "INACTIVE" };

  profile = await getDb().$transaction(async (tx) => {
    const current =
      profile!.email === email
        ? profile!
        : await tx.userProfile.update({
            where: { id: profile!.id },
            data: { email },
          });
    return acceptMatchingInvitation(tx, current);
  });
  return { status: "ACTIVE", role: profile.role };
}
