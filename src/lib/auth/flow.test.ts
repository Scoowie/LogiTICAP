import { describe, expect, it } from "vitest";
import {
  authCallbackFailurePath,
  authCallbackQuerySchema,
  safeNextPath,
} from "./flow";

describe("authentication flow helpers", () => {
  it("allows only same-origin relative destinations", () => {
    expect(safeNextPath("/portal/booking?event=one#slots")).toBe(
      "/portal/booking?event=one#slots",
    );
    expect(safeNextPath("//attacker.example/path")).toBe("/portal");
    expect(safeNextPath("https://attacker.example/path")).toBe("/portal");
    expect(safeNextPath("not-a-path")).toBe("/portal");
  });

  it("validates Supabase PKCE callback parameters", () => {
    expect(
      authCallbackQuerySchema.safeParse({
        code: "auth-code",
        intent: "recovery",
        sb_flow_id: "0123456789abcdef0123456789abcdef",
      }).success,
    ).toBe(true);
    expect(
      authCallbackQuerySchema.safeParse({
        code: "auth-code",
        intent: "recovery",
        sb_flow_id: "invalid flow id",
      }).success,
    ).toBe(false);
  });

  it("routes callback failures to the matching public auth page", () => {
    expect(authCallbackFailurePath("recovery", "expired")).toBe(
      "/forgot-password?error=expired",
    );
    expect(authCallbackFailurePath("onboarding")).toBe(
      "/onboarding?error=callback",
    );
    expect(authCallbackFailurePath(undefined)).toBe("/login?error=callback");
  });
});
