import Link from "next/link";
import { PasswordRecoveryForm } from "@/components/auth-forms";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const query = await searchParams;
  return (
    <div className="hex-sky min-h-[70vh] border-b border-[#b69a5e] py-14 sm:py-20">
      <div className="card mx-auto w-[calc(100%_-_1.25rem)] max-w-lg border-t-4 border-t-[#153f6f]! bg-[#fbf6e8]! p-6 sm:p-9">
        <p className="eyebrow">Account recovery</p>
        <h1 className="hex-display mt-6 text-4xl">Reset your password</h1>
        <p className="mt-5 text-sm leading-6 text-[#615848]">
          Enter your verified email address. If it belongs to an account, we
          will send a time-limited recovery link.
        </p>
        {(query.error === "callback" || query.error === "expired") && (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-[#8e261c] bg-[#f1d9d3] p-3 text-sm font-semibold text-[#712018]"
          >
            {query.error === "expired"
              ? "That recovery link has expired or was already used. Request a new one."
              : "That recovery link could not be verified. Request a new one and try again."}
          </p>
        )}
        <PasswordRecoveryForm />
        <p className="mt-6 border-t border-[#b69a5e] pt-4 text-sm">
          <Link
            href="/login"
            className="font-semibold text-[#153f6f] underline-offset-4 hover:underline"
          >
            Return to login
          </Link>
        </p>
      </div>
    </div>
  );
}
