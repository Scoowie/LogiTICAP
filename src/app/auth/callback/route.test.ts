import { beforeEach, describe, expect, it, vi } from "vitest";

const { exchangeCodeForSession, getUser, createSupabaseServerClient } =
  vi.hoisted(() => {
    const exchangeCodeForSession = vi.fn();
    const getUser = vi.fn();
    return {
      exchangeCodeForSession,
      getUser,
      createSupabaseServerClient: vi.fn(async () => ({
        auth: {
          exchangeCodeForSession,
          getUser,
          signOut: vi.fn(),
        },
      })),
    };
  });

vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient }));
vi.mock("@/lib/auth/profile", () => ({
  completeOnboarding: vi.fn(),
  prepareLoginProfile: vi.fn(),
}));

import { GET } from "./route";

describe("authentication callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    exchangeCodeForSession.mockResolvedValue({ error: null });
    getUser.mockResolvedValue({
      data: { user: { id: "user-id", email: "user@example.com" } },
      error: null,
    });
  });

  it("uses the matching PKCE flow id for password recovery", async () => {
    const response = await GET(
      new Request(
        "https://example.com/auth/callback?intent=recovery&code=auth-code&sb_flow_id=0123456789abcdef0123456789abcdef",
      ),
    );

    expect(exchangeCodeForSession).toHaveBeenCalledWith("auth-code", {
      flowId: "0123456789abcdef0123456789abcdef",
    });
    expect(response.headers.get("location")).toBe(
      "https://example.com/reset-password",
    );
    const recoveryCookie = response.headers.get("set-cookie");
    expect(recoveryCookie).toContain("tlms-password-recovery=verified");
    expect(recoveryCookie).toContain("SameSite=lax");
    expect(recoveryCookie).not.toContain("SameSite=strict");
  });

  it("keeps older callback links without a flow id compatible", async () => {
    await GET(
      new Request(
        "https://example.com/auth/callback?intent=recovery&code=auth-code",
      ),
    );

    expect(exchangeCodeForSession).toHaveBeenCalledWith("auth-code");
  });

  it("reports an upstream expired recovery token without exchanging it", async () => {
    const response = await GET(
      new Request(
        "https://example.com/auth/callback?intent=recovery&error=access_denied&error_code=otp_expired",
      ),
    );

    expect(createSupabaseServerClient).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://example.com/forgot-password?error=expired",
    );
  });

  it("rejects malformed flow ids before attempting an exchange", async () => {
    const response = await GET(
      new Request(
        "https://example.com/auth/callback?intent=recovery&code=auth-code&sb_flow_id=invalid%20flow",
      ),
    );

    expect(createSupabaseServerClient).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://example.com/forgot-password?error=callback",
    );
  });
});
