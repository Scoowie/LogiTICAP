import { requestMagicLink } from "./actions";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const query = await searchParams;
  return (
    <div className="neo-dots min-h-[70vh] border-b-8 border-black py-14 sm:py-20">
      <div className="card mx-auto w-[calc(100%_-_1.25rem)] max-w-lg rotate-1 bg-[#FFFDF5]! p-6 sm:p-9">
        <p className="eyebrow">Secure access</p>
        <h1 className="neo-display mt-6 text-5xl text-black">
          Sign in to TLMS
        </h1>
        <p className="mt-5 border-l-4 border-black bg-[#FFD93D] p-3 text-sm leading-6 font-bold">
          Enter your verified email. Supabase will send a one-time magic link;
          TLMS never stores your password.
        </p>
        {query.sent && (
          <p
            role="status"
            className="mt-5 border-3 border-black bg-[#72E6A0] p-3 text-sm font-bold shadow-[4px_4px_0_0_#000]"
          >
            Check your email for a secure sign-in link.
          </p>
        )}
        {query.error && (
          <p
            role="alert"
            className="mt-5 border-3 border-black bg-[#FF6B6B] p-3 text-sm font-bold shadow-[4px_4px_0_0_#000]"
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
              className="neo-input mt-2"
              placeholder="name@school.edu"
            />
          </div>
          <button className="neo-btn w-full" type="submit">
            Send magic link
          </button>
        </form>
        <p className="mt-6 border-t-3 border-black pt-4 text-xs font-bold">
          By continuing, you use the identity provider configured by TICAP.
          Privileged roles cannot be selected during sign-in.
        </p>
      </div>
    </div>
  );
}
