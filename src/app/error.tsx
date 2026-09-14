"use client";

export default function ApplicationError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main-content" className="hex-diagram min-h-screen py-16">
      <div className="card mx-auto w-[calc(100%_-_1.25rem)] max-w-xl border-t-4 border-t-[#8e261c]! bg-[#fbf6e8]! p-8 text-center">
        <p className="eyebrow">TICAP Logistics</p>
        <h1 className="hex-display mt-6 text-4xl">Something went wrong</h1>
        <p className="muted mt-3 text-sm">
          The request could not be completed. No private system details are
          shown here.
        </p>
        <button onClick={() => reset()} className="hex-btn mt-6">
          Try again
        </button>
      </div>
    </main>
  );
}
