"use client";

export default function ApplicationError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main-content" className="neo-dots min-h-screen py-16">
      <div className="card mx-auto w-[calc(100%_-_1.25rem)] max-w-xl rotate-1 bg-[#FF6B6B]! p-8 text-center">
        <p className="eyebrow">TICAP Logistics</p>
        <h1 className="neo-display mt-6 text-4xl text-black">
          Something went wrong
        </h1>
        <p className="muted mt-3 text-sm">
          The request could not be completed. No private system details are
          shown here.
        </p>
        <button onClick={() => reset()} className="neo-btn mt-6">
          Try again
        </button>
      </div>
    </main>
  );
}
