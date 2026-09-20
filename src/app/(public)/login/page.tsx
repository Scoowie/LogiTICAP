import Link from "next/link";
import { LoginForm } from "@/components/auth-forms";
import { safeNextPath } from "@/lib/auth/flow";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const query = await searchParams;
  return (
    <div className="hex-sky min-h-[70vh] border-b border-[#b69a5e] py-14 sm:py-20">
      <div className="card mx-auto w-[calc(100%_-_1.25rem)] max-w-lg border-t-4 border-t-[#153f6f]! bg-[#fbf6e8]! p-6 sm:p-9">
        <p className="eyebrow">Secure access</p>
        <h1 className="hex-display mt-6 text-4xl">Log in to TLMS</h1>
        <p className="mt-5 border-l-2 border-[#b69a5e] bg-[#f3ead2] p-3 text-sm leading-6">
          Use the verified email address and password connected to your account.
        </p>
        {query["signed-out"] && (
          <p
            role="status"
            className="mt-5 rounded-lg border border-[#3f6848] bg-[#e0eadf] p-3 text-sm font-semibold text-[#294a31]"
          >
            You have been signed out on all devices.
          </p>
        )}
        {query["password-updated"] && (
          <p
            role="status"
            className="mt-5 rounded-lg border border-[#3f6848] bg-[#e0eadf] p-3 text-sm font-semibold text-[#294a31]"
          >
            Your password was updated. Log in with the new password.
          </p>
        )}
        {query.error === "callback" && (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-[#8e261c] bg-[#f1d9d3] p-3 text-sm font-semibold text-[#712018]"
          >
            That email link is invalid or expired. Request a new link and try
            again.
          </p>
        )}
        <LoginForm next={safeNextPath(query.next)} />
        <p className="mt-6 border-t border-[#b69a5e] pt-4 text-sm text-[#615848]">
          New to TLMS?{" "}
          <Link
            href="/onboarding"
            className="font-semibold text-[#153f6f] underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
          . Existing passwordless users can use Forgot password to set their
          first password.
        </p>
      </div>
    </div>
  );
}
