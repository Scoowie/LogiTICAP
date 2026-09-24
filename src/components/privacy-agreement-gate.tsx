"use client";

import Link from "next/link";
import { useState } from "react";
import { dataPrivacyAgreementSections } from "@/lib/privacy-agreement";

export function PrivacyAgreementGate({
  disabled = false,
  fieldErrors,
  onAcceptanceChange,
}: {
  disabled?: boolean;
  fieldErrors?: Record<string, string[]>;
  onAcceptanceChange: (accepted: boolean) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);
  const errors = [
    ...(fieldErrors?.privacyViewed ?? []),
    ...(fieldErrors?.privacyAccepted ?? []),
  ];

  return (
    <section className="rounded-xl border border-[#b69a5e] bg-[#fbf6e8] p-4 sm:col-span-2 sm:p-5">
      <input
        type="hidden"
        name="privacyViewed"
        value={hasReviewed ? "true" : "false"}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-[#4c3a27]">Data Privacy Agreement</h2>
          <p className="muted mt-1 text-sm">
            Review the agreement before accepting and creating your account.
          </p>
        </div>
        <button
          type="button"
          className="hex-btn hex-btn--secondary"
          aria-expanded={isOpen}
          aria-controls="data-privacy-agreement"
          onClick={() => setIsOpen((open) => !open)}
          disabled={disabled}
        >
          {isOpen
            ? "Close agreement"
            : hasReviewed
              ? "Review agreement again"
              : "Open agreement"}
        </button>
      </div>

      {isOpen && (
        <div
          id="data-privacy-agreement"
          className="hex-panel mt-4 max-h-96 overflow-y-auto bg-[#f3ead2] p-4"
        >
          <div className="space-y-4 text-sm leading-6 text-[#3c342a]">
            {dataPrivacyAgreementSections.map((section) => (
              <section key={section.title}>
                <h3 className="font-bold text-[#4c3a27]">{section.title}</h3>
                <p className="mt-1">{section.body}</p>
              </section>
            ))}
            <p>
              By accepting below, you agree to the collection and use of your
              information for these described TLMS purposes. You can also review
              the portal&apos;s full{" "}
              <Link
                href="/policies"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-[#153f6f] underline underline-offset-4"
              >
                policies page
              </Link>
              .
            </p>
          </div>
          <button
            type="button"
            className="hex-btn mt-5"
            onClick={() => {
              setHasReviewed(true);
              setIsOpen(false);
            }}
            disabled={disabled}
          >
            I have reviewed this agreement
          </button>
        </div>
      )}

      <label className="mt-4 flex min-h-11 items-start gap-3 text-sm font-semibold">
        <input
          type="checkbox"
          name="privacyAccepted"
          className="mt-1 size-5 shrink-0"
          checked={hasAccepted}
          disabled={!hasReviewed || disabled}
          required
          aria-describedby={
            errors.length ? "privacy-agreement-error" : undefined
          }
          onChange={(event) => {
            setHasAccepted(event.target.checked);
            onAcceptanceChange(event.target.checked);
          }}
        />
        <span>
          I have reviewed and agree to the TLMS Data Privacy Agreement.
        </span>
      </label>
      {!hasReviewed && (
        <p className="muted mt-2 text-xs" role="status">
          Open and review the agreement to enable acceptance.
        </p>
      )}
      {errors.length > 0 && (
        <ul
          id="privacy-agreement-error"
          className="mt-2 space-y-1 text-sm font-semibold text-[#8e261c]"
        >
          {[...new Set(errors)].map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
