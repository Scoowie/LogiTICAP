import { beforeEach, describe, expect, it, vi } from "vitest";

const { createServerClient } = vi.hoisted(() => ({
  createServerClient: vi.fn(() => ({ auth: {} })),
}));

vi.mock("server-only", () => ({}));
vi.mock("@supabase/ssr", () => ({ createServerClient }));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}));
vi.mock("@/lib/env", () => ({
  publicEnv: vi.fn(() => ({
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key-with-enough-characters",
  })),
}));

import { createSupabaseServerClient } from "./server";

describe("Supabase server client", () => {
  beforeEach(() => vi.clearAllMocks());

  it("adds a flow id to PKCE redirects so callbacks select the right verifier", async () => {
    await createSupabaseServerClient();

    expect(createServerClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "test-anon-key-with-enough-characters",
      expect.objectContaining({
        auth: {
          experimental: {
            appendPkceFlowIdToRedirects: true,
          },
        },
      }),
    );
  });
});
