import { requestMagicLink } from "./actions";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const query = await searchParams;
  return (
    <div className="container-page py-14">
      <div className="card mx-auto max-w-lg p-6 sm:p-8">
        <p className="eyebrow">Secure access</p>
        <h1 className="mt-2 text-3xl font-black text-[#102a43]">
          Sign in to TLMS
        </h1>
        <p className="muted mt-3 text-sm leading-6">
          Enter your verified email. Supabase will send a one-time magic link;
          TLMS never stores your password.
        </p>
        {query.sent && (
          <p
            role="status"
            className="mt-5 rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-800"
          >
            Check your email for a secure sign-in link.
          </p>
        )}
        {query.error && (
          <p
            role="alert"
            className="mt-5 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-800"
          >
            The sign-in request could not be completed. Verify the address or
            try again later.
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
              className="mt-2 min-h-11 w-full rounded-md border border-[#9eacb9] bg-white px-3"
              placeholder="name@school.edu"
            />
          </div>
          <button
            className="min-h-11 w-full rounded-md bg-[#183f63] px-5 font-bold text-white hover:bg-[#102a43]"
            type="submit"
          >
            Send magic link
          </button>
        </form>
        <p className="muted mt-5 text-xs">
          By continuing, you use the identity provider configured by TICAP.
          Privileged roles cannot be selected during sign-in.
        </p>
      </div>
    </div>
  );
}
