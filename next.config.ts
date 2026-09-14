import type { NextConfig } from "next";

const scriptSources = ["'self'", "'unsafe-inline'"];

if (process.env.NODE_ENV !== "production") {
  // React's development diagnostics reconstruct cross-environment call stacks
  // with eval. Production keeps the stricter policy.
  scriptSources.push("'unsafe-eval'");
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; img-src 'self' data: https:; script-src ${scriptSources.join(" ")}; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
