"use client";

export default function ApplicationError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main-content" className="container-page py-16">
      <div className="card mx-auto max-w-xl p-8 text-center">
        <p className="eyebrow">TICAP Logistics</p>
        <h1 className="mt-2 text-2xl font-black text-[#102a43]">
          Something went wrong
        </h1>
        <p className="muted mt-3 text-sm">
          The request could not be completed. No private system details are
          shown here.
        </p>
        <button
          onClick={() => reset()}
          className="mt-6 min-h-11 rounded-md bg-[#183f63] px-5 font-bold text-white"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
