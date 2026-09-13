import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requested = url.searchParams.get("next") ?? "/portal";
  const next =
    requested.startsWith("/") && !requested.startsWith("//")
      ? requested
      : "/portal";
  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data } = await supabase.auth.getUser();
      if (data.user?.email) {
        const userId = data.user.id;
        const email = data.user.email;
        const suppliedName = data.user.user_metadata.full_name;
        await getDb().$transaction(async (tx) => {
          const profile = await tx.userProfile.upsert({
            where: { id: userId },
            update: { email },
            create: {
              id: userId,
              email,
              fullName:
                typeof suppliedName === "string" && suppliedName.length <= 160
                  ? suppliedName
                  : "Profile incomplete",
              role: "STUDENT",
            },
          });
          const invitation = await tx.staffInvitation.findFirst({
            where: {
              email: email.toLowerCase(),
              status: "PENDING",
              expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: "desc" },
          });
          if (invitation && profile.role === "STUDENT") {
            await tx.userProfile.update({
              where: { id: profile.id },
              data: { role: invitation.role },
            });
            await tx.staffInvitation.update({
              where: { id: invitation.id },
              data: { status: "ACCEPTED", acceptedAt: new Date() },
            });
            await tx.auditLog.create({
              data: {
                actorId: profile.id,
                action: "staff.invitation_accepted",
                targetType: "StaffInvitation",
                targetId: invitation.id,
                newValues: { role: invitation.role },
              },
            });
          }
        });
      }
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }
  return NextResponse.redirect(new URL("/sign-in?error=callback", url.origin));
}
