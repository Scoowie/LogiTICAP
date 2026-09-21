import { NextResponse } from "next/server";
import {
  authCallbackFailurePath,
  authCallbackIntentSchema,
  authCallbackQuerySchema,
  PASSWORD_RECOVERY_COOKIE,
  safeNextPath,
} from "@/lib/auth/flow";
import { completeOnboarding, prepareLoginProfile } from "@/lib/auth/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawQuery = Object.fromEntries(url.searchParams);
  const intentResult = authCallbackIntentSchema.safeParse(rawQuery.intent);
  const fallbackIntent = intentResult.success ? intentResult.data : undefined;
  const queryResult = authCallbackQuerySchema.safeParse(rawQuery);

  if (!queryResult.success) {
    console.warn("[auth.callback.invalid-query]", {
      fields: [
        ...new Set(
          queryResult.error.issues
            .map((issue) => issue.path[0])
            .filter((field): field is string => typeof field === "string"),
        ),
      ],
    });
    return NextResponse.redirect(
      new URL(authCallbackFailurePath(fallbackIntent), url.origin),
    );
  }

  const {
    code,
    intent,
    next: requestedNext,
    sb_flow_id: flowId,
    error_code: errorCode,
  } = queryResult.data;
  const next = safeNextPath(requestedNext);
  if (!code) {
    console.warn("[auth.callback.missing-code]", {
      intent: intent ?? "login",
      errorCode: errorCode ?? "none",
    });
    const reason =
      intent === "recovery" && errorCode === "otp_expired"
        ? "expired"
        : "callback";
    return NextResponse.redirect(
      new URL(authCallbackFailurePath(intent, reason), url.origin),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = flowId
    ? await supabase.auth.exchangeCodeForSession(code, { flowId })
    : await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth.callback.exchange-failed]", {
      code: error.code,
      status: error.status,
      name: error.name,
      intent: intent ?? "login",
      hasFlowId: Boolean(flowId),
    });
    const reason =
      intent === "recovery" && error.code === "otp_expired"
        ? "expired"
        : "callback";
    return NextResponse.redirect(
      new URL(authCallbackFailurePath(intent, reason), url.origin),
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
    new URL(authCallbackFailurePath(intent), url.origin),
  );
}
