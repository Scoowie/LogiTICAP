"use server";

import { createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  PASSWORD_RECOVERY_COOKIE,
  safeNextPath,
  validationState,
  type AuthFormState,
} from "@/lib/auth/flow";
import { completeOnboarding, prepareLoginProfile } from "@/lib/auth/profile";
import { appOrigin } from "@/lib/env";
import { getRateLimiter } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  loginSchema,
  onboardingSchema,
  passwordResetRequestSchema,
  passwordUpdateSchema,
} from "@/lib/validation";
import { DATA_PRIVACY_AGREEMENT_VERSION } from "@/lib/privacy-agreement";

function providerFailure(error: {
  code?: string;
  status?: number;
  name: string;
}) {
  console.error("[auth.provider.failed]", {
    code: error.code,
    status: error.status,
    name: error.name,
  });
}

async function rateLimit(
  purpose: "login" | "signup" | "recovery" | "password-update",
  email?: string,
) {
  const requestHeaders = await headers();
  const ip =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    "unknown";
  const limiter = getRateLimiter();
  const allowedByIp = await limiter.consume(
    `auth:${purpose}:ip:${ip}`,
    purpose === "login" ? 10 : 5,
    15 * 60_000,
  );
  if (!allowedByIp || !email) return allowedByIp;
  const emailHash = createHash("sha256")
    .update(email.trim().toLowerCase())
    .digest("hex");
  return limiter.consume(
    `auth:${purpose}:email:${emailHash}`,
    purpose === "login" ? 10 : 5,
    15 * 60_000,
  );
}

const rateLimited: AuthFormState = {
  status: "error",
  message: "Too many attempts. Wait 15 minutes, then try again.",
};

export async function onboard(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = onboardingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationState(parsed.error);
  if (!(await rateLimit("signup", parsed.data.email))) return rateLimited;

  const {
    email,
    password,
    firstName,
    middleName,
    lastName,
    suffix,
    contactNumber,
  } = parsed.data;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${appOrigin()}/auth/callback?intent=onboarding`,
      data: {
        firstName,
        middleName,
        lastName,
        suffix,
        contactNumber,
        privacyAgreementAccepted: true,
        privacyAgreementVersion: DATA_PRIVACY_AGREEMENT_VERSION,
        privacyAgreementAcceptedAt: new Date().toISOString(),
      },
    },
  });

  if (error) {
    if (error.status === 429 || error.code?.includes("rate_limit"))
      return rateLimited;
    if (error.code === "weak_password") {
      return {
        status: "error",
        message: "Choose a stronger password and try again.",
        fieldErrors: { password: ["The password was rejected as too weak"] },
      };
    }
    if (error.code === "user_already_exists") {
      return {
        status: "success",
        message:
          "If this address can be registered, a verification email is on its way.",
      };
    }
    providerFailure(error);
    return {
      status: "error",
      message: "Account setup is temporarily unavailable. Try again later.",
    };
  }

  if (data.session && data.user) {
    try {
      await completeOnboarding(data.user);
    } catch (profileError) {
      console.error("[auth.onboarding.profile-failed]", {
        name:
          profileError instanceof Error ? profileError.name : "UnknownError",
      });
      await supabase.auth.signOut({ scope: "global" });
      return {
        status: "error",
        message:
          "The account was verified, but its profile could not be created. Try logging in again.",
      };
    }
    redirect("/portal");
  }
  return {
    status: "success",
    message:
      "Check your email and open the verification link in this browser to finish creating your account.",
  };
}

export async function logIn(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationState(parsed.error);
  if (!(await rateLimit("login", parsed.data.email))) return rateLimited;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error || !data.user) {
    if (error && (error.status === 429 || error.code?.includes("rate_limit")))
      return rateLimited;
    if (error && error.status && error.status >= 500) providerFailure(error);
    return {
      status: "error",
      message: "The email or password is incorrect.",
    };
  }

  let profile;
  try {
    profile = await prepareLoginProfile(data.user);
  } catch (profileError) {
    console.error("[auth.login.profile-failed]", {
      name: profileError instanceof Error ? profileError.name : "UnknownError",
    });
    await supabase.auth.signOut({ scope: "global" });
    return {
      status: "error",
      message: "Login is temporarily unavailable. Try again later.",
    };
  }
  if (profile.status !== "ACTIVE") {
    await supabase.auth.signOut({ scope: "global" });
    return {
      status: "error",
      message:
        profile.status === "INACTIVE"
          ? "This account is not currently available. Contact an administrator."
          : "This account has not completed onboarding. Create the account again or contact support.",
    };
  }
  redirect(safeNextPath(parsed.data.next));
}

export async function requestPasswordReset(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = passwordResetRequestSchema.safeParse(
    Object.fromEntries(formData),
  );
  if (!parsed.success) return validationState(parsed.error);
  if (!(await rateLimit("recovery", parsed.data.email))) return rateLimited;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${appOrigin()}/auth/callback?intent=recovery`,
    },
  );
  if (error) {
    if (error.status === 429 || error.code?.includes("rate_limit"))
      return rateLimited;
    providerFailure(error);
    return {
      status: "error",
      message: "Password recovery is temporarily unavailable. Try again later.",
    };
  }
  return {
    status: "success",
    message:
      "If an account exists for that email, a password recovery link is on its way.",
  };
}

export async function updatePassword(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = passwordUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationState(parsed.error);
  if (!(await rateLimit("password-update"))) return rateLimited;

  const cookieStore = await cookies();
  if (cookieStore.get(PASSWORD_RECOVERY_COOKIE)?.value !== "verified") {
    return {
      status: "error",
      message: "This recovery link is invalid or expired. Request a new one.",
    };
  }
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return {
      status: "error",
      message: "This recovery link is invalid or expired. Request a new one.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    if (error.status === 429 || error.code?.includes("rate_limit"))
      return rateLimited;
    if (error.code === "weak_password") {
      return {
        status: "error",
        message: "Choose a stronger password and try again.",
        fieldErrors: { password: ["The password was rejected as too weak"] },
      };
    }
    providerFailure(error);
    return {
      status: "error",
      message: "The password could not be updated. Request a new link.",
    };
  }

  cookieStore.set(PASSWORD_RECOVERY_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/reset-password",
  });
  const { error: signOutError } = await supabase.auth.signOut({
    scope: "global",
  });
  if (signOutError) providerFailure(signOutError);
  redirect("/login?password-updated=1");
}
