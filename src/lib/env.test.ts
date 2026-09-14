import { afterEach, describe, expect, it, vi } from "vitest";
import { serverEnv } from "@/lib/env";

const requiredEnvironment = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "a".repeat(20),
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  DATABASE_URL: "postgresql://example.invalid/database",
  DIRECT_URL: "postgresql://example.invalid/database",
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("serverEnv", () => {
  it("treats blank optional integration settings as unset", () => {
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      requiredEnvironment.NEXT_PUBLIC_SUPABASE_URL,
    );
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      requiredEnvironment.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
    vi.stubEnv("NEXT_PUBLIC_APP_URL", requiredEnvironment.NEXT_PUBLIC_APP_URL);
    vi.stubEnv("DATABASE_URL", requiredEnvironment.DATABASE_URL);
    vi.stubEnv("DIRECT_URL", requiredEnvironment.DIRECT_URL);
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("EMAIL_FROM", "   ");
    vi.stubEnv("RATE_LIMIT_REDIS_URL", "");
    vi.stubEnv("BOT_PROTECTION_SECRET", "");

    const environment = serverEnv();

    expect(environment.RESEND_API_KEY).toBeUndefined();
    expect(environment.EMAIL_FROM).toBeUndefined();
    expect(environment.RATE_LIMIT_REDIS_URL).toBeUndefined();
    expect(environment.BOT_PROTECTION_SECRET).toBeUndefined();
  });

  it("still rejects malformed configured integrations", () => {
    for (const [name, value] of Object.entries(requiredEnvironment)) {
      vi.stubEnv(name, value);
    }
    vi.stubEnv("RATE_LIMIT_REDIS_URL", "not-a-url");

    expect(() => serverEnv()).toThrow(/RATE_LIMIT_REDIS_URL: Invalid URL/);
  });
});
