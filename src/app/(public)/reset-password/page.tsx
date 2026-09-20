import Link from "next/link";
import { cookies } from "next/headers";
import { PasswordUpdateForm } from "@/components/auth-forms";
import { PASSWORD_RECOVERY_COOKIE } from "@/lib/auth/flow";

export default async function ResetPasswordPage() {
  const recoveryVerified =
    (await cookies()).get(PASSWORD_RECOVERY_COOKIE)?.value === "verified";
  return (
    <div className="hex-sky min-h-[70vh] border-b border-[#b69a5e] py-14 sm:py-20">
      <div className="card mx-auto w-[calc(100%_-_1.25rem)] max-w-lg border-t-4 border-t-[#153f6f]! bg-[#fbf6e8]! p-6 sm:p-9">
        <p className="eyebrow">Account recovery</p>
        <h1 className="hex-display mt-6 text-4xl">Set a new password</h1>
        {recoveryVerified ? (
          <PasswordUpdateForm />
        ) : (
          <div className="mt-6">
            <p
              role="alert"
              className="rounded-lg border border-[#8e261c] bg-[#f1d9d3] p-3 text-sm font-semibold text-[#712018]"
            >
              This recovery session is invalid or expired.
            </p>
            <Link href="/forgot-password" className="hex-btn mt-5 w-full">
              Request a new link
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
