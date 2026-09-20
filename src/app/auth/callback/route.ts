import { NextResponse } from "next/server";
import { PASSWORD_RECOVERY_COOKIE, safeNextPath } from "@/lib/auth/flow";
import { completeOnboarding, prepareLoginProfile } from "@/lib/auth/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const intent = url.searchParams.get("intent");
  const next = safeNextPath(url.searchParams.get("next"));
  if (!code)
    return NextResponse.redirect(
      new URL(
        intent === "recovery"
          ? "/forgot-password?error=callback"
          : "/login?error=callback",
        url.origin,
      ),
    );

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth.callback.exchange-failed]", {
      code: error.code,
      status: error.status,
      name: error.name,
    });
    return NextResponse.redirect(
      new URL(
        intent === "recovery"
          ? "/forgot-password?error=callback"
          : "/login?error=callback",
        url.origin,
      ),
    );
  }

  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) {
    return NextResponse.redirect(new URL("/login?error=callback", url.origin));
  }

  if (intent === "recovery") {
    const response = NextResponse.redirect(
      new URL("/reset-password", url.origin),
    );
    response.cookies.set(PASSWORD_RECOVERY_COOKIE, "verified", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 10 * 60,
      path: "/reset-password",
    });
    return response;
  }

  try {
    if (intent === "onboarding") {
      await completeOnboarding(data.user);
      return NextResponse.redirect(new URL("/portal", url.origin));
    }
    const profile = await prepareLoginProfile(data.user);
    if (profile.status === "ACTIVE")
      return NextResponse.redirect(new URL(next, url.origin));
  } catch (profileError) {
    console.error("[auth.callback.profile-failed]", {
      name: profileError instanceof Error ? profileError.name : "UnknownError",
    });
  }
  await supabase.auth.signOut({ scope: "global" });
  return NextResponse.redirect(
    new URL(
      intent === "onboarding"
        ? "/onboarding?error=callback"
        : "/login?error=callback",
      url.origin,
    ),
  );
}
