import Link from "next/link";
import { OnboardingForm } from "@/components/auth-forms";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const query = await searchParams;
  return (
    <div className="hex-sky min-h-[70vh] border-b border-[#b69a5e] py-12 sm:py-16">
      <div className="card mx-auto w-[calc(100%_-_1.25rem)] max-w-3xl border-t-4 border-t-[#153f6f]! bg-[#fbf6e8]! p-6 sm:p-9">
        <p className="eyebrow">New account</p>
        <h1 className="hex-display mt-5 text-4xl">Create your TLMS account</h1>
        <p className="mt-4 border-l-2 border-[#b69a5e] bg-[#f3ead2] p-3 text-sm leading-6">
          Enter your personal information and choose a password. We will send an
          email link to verify your address before the account becomes active.
        </p>
        {query.error === "callback" && (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-[#8e261c] bg-[#f1d9d3] p-3 text-sm font-semibold text-[#712018]"
          >
            The verification link is invalid, expired, or could not complete the
            profile. Submit the form again for a new link.
          </p>
        )}
        <OnboardingForm />
        <p className="mt-6 border-t border-[#b69a5e] pt-4 text-sm text-[#615848]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#153f6f] underline-offset-4 hover:underline"
          >
            Log in
          </Link>
          . Staff roles are granted only through an authorized invitation sent
          to the verified email address.
        </p>
      </div>
    </div>
  );
}
