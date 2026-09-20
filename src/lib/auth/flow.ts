import type { ZodError } from "zod";

export type AuthFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialAuthFormState: AuthFormState = { status: "idle" };
export const PASSWORD_RECOVERY_COOKIE = "tlms-password-recovery";

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
