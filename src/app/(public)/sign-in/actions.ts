"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getRateLimiter } from "@/lib/rate-limit";
import { signInSchema } from "@/lib/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { appOrigin } from "@/lib/env";

export async function requestMagicLink(formData: FormData) {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    next: formData.get("next") || "/portal",
  });
  if (!parsed.success) redirect("/sign-in?error=invalid");
  const requestHeaders = await headers();
  const key = `auth:${requestHeaders.get("x-forwarded-for")?.split(",")[0] ?? "unknown"}`;
  if (!(await getRateLimiter().consume(key, 5, 15 * 60_000)))
    redirect("/sign-in?error=rate-limited");
  const supabase = await createSupabaseServerClient();
  const origin = appOrigin();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(parsed.data.next)}`,
    },
  });
  if (error) redirect("/sign-in?error=unavailable");
  redirect("/sign-in?sent=1");
}
