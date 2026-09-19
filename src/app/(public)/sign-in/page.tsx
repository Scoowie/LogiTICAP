import { requestMagicLink } from "./actions";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const query = await searchParams;
  const errorMessage =
    query.error === "rate-limited"
      ? "Too many sign-in links were requested. Wait 15 minutes, then request one new link."
      : query.error === "invalid"
        ? "Enter a valid email address and try again."
        : "The identity provider could not send the sign-in link. Check the Supabase email provider, redirect allow-list, and rate-limit logs.";
  return (
    <div className="hex-sky min-h-[70vh] border-b border-[#b69a5e] py-14 sm:py-20">
      <div className="card mx-auto w-[calc(100%_-_1.25rem)] max-w-lg border-t-4 border-t-[#153f6f]! bg-[#fbf6e8]! p-6 sm:p-9">
        <p className="eyebrow">Secure access</p>
        <h1 className="hex-display mt-6 text-4xl">Sign in to TLMS</h1>
        <p className="mt-5 border-l-2 border-[#b69a5e] bg-[#f3ead2] p-3 text-sm leading-6">
          Enter your verified email. Supabase will send a one-time magic link;
          TLMS never stores your password.
        </p>
        {query.sent && (
          <p
            role="status"
            className="mt-5 rounded-lg border border-[#3f6848] bg-[#e0eadf] p-3 text-sm font-semibold text-[#294a31]"
          >
            Check your email for a secure sign-in link.
          </p>
        )}
        {query["signed-out"] && (
          <p
            role="status"
            className="mt-5 rounded-lg border border-[#3f6848] bg-[#e0eadf] p-3 text-sm font-semibold text-[#294a31]"
          >
            You have been signed out on all devices.
          </p>
        )}
        {query.error && (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-[#8e261c] bg-[#f1d9d3] p-3 text-sm font-semibold text-[#712018]"
          >
            {errorMessage}
          </p>
        )}
        <form action={requestMagicLink} className="mt-6 space-y-5">
          <input
            type="hidden"
            name="next"
            value={query.next?.startsWith("/") ? query.next : "/portal"}
          />
          <div>
            <label htmlFor="email" className="block text-sm font-bold">
              Verified email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={320}
              className="hex-input mt-2"
              placeholder="name@school.edu"
            />
          </div>
          <button className="hex-btn w-full" type="submit">
            Send magic link
          </button>
        </form>
        <p className="mt-6 border-t border-[#b69a5e] pt-4 text-xs text-[#615848]">
          By continuing, you use the identity provider configured by TICAP.
          Privileged roles cannot be selected during sign-in.
        </p>
      </div>
    </div>
  );
}
