import { z, type ZodError } from "zod";

export type AuthFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialAuthFormState: AuthFormState = { status: "idle" };
export const PASSWORD_RECOVERY_COOKIE = "tlms-password-recovery";

export const authCallbackIntentSchema = z.enum(["onboarding", "recovery"]);

export const authCallbackQuerySchema = z.object({
  code: z.string().min(1).max(4096).optional(),
  intent: authCallbackIntentSchema.optional(),
  next: z.string().max(2048).optional(),
  sb_flow_id: z
    .string()
    .regex(/^[A-Za-z0-9_-]{8,64}$/)
    .optional(),
  error_code: z
    .string()
    .max(64)
    .regex(/^[a-z0-9_]+$/)
    .optional(),
  error: z
    .string()
    .max(64)
    .regex(/^[a-z0-9_]+$/)
    .optional(),
});

export type AuthCallbackIntent = z.infer<typeof authCallbackIntentSchema>;

export function authCallbackFailurePath(
  intent: AuthCallbackIntent | undefined,
  reason: "callback" | "expired" = "callback",
) {
  if (intent === "recovery") return `/forgot-password?error=${reason}`;
  if (intent === "onboarding") return "/onboarding?error=callback";
  return "/login?error=callback";
}

export function safeNextPath(value: unknown, fallback = "/portal") {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  try {
    const parsed = new URL(value, "https://ticap.invalid");
    return parsed.origin === "https://ticap.invalid"
      ? `${parsed.pathname}${parsed.search}${parsed.hash}`
      : fallback;
  } catch {
    return fallback;
  }
}

export function validationState(error: ZodError): AuthFormState {
  return {
    status: "error",
    message: "Check the highlighted fields and try again.",
    fieldErrors: error.flatten().fieldErrors as Record<string, string[]>,
  };
}
