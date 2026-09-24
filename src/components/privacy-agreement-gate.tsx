"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { PrivacyNoticeContent } from "@/components/privacy-notice-content";

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
  const [reviewProgress, setReviewProgress] = useState(0);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
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
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full border border-[#b69a5e] bg-[#f3ead2] text-[#153f6f]">
            <ShieldCheck aria-hidden="true" className="size-5" />
          </span>
          <div>
            <h2 className="font-bold text-[#4c3a27]">
              TLMS Privacy Notice and Consent
            </h2>
            <p className="muted mt-1 text-sm">
              Review the complete notice before giving consent and creating your
              account.
            </p>
          </div>
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
        <div id="data-privacy-agreement" className="mt-4">
          <div
            role="region"
            aria-label="Scrollable TLMS privacy notice"
            tabIndex={0}
            className="hex-panel max-h-96 overflow-y-auto bg-[#f3ead2] p-4 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#4baee1]"
            onScroll={(event) => {
              const region = event.currentTarget;
              const scrollableDistance =
                region.scrollHeight - region.clientHeight;
              const nextProgress =
                scrollableDistance <= 0
                  ? 100
                  : Math.min(
                      100,
                      Math.round((region.scrollTop / scrollableDistance) * 100),
                    );
              setReviewProgress(nextProgress);
              if (scrollableDistance - region.scrollTop <= 8) {
                setHasReachedEnd(true);
                setReviewProgress(100);
              }
            }}
          >
            <PrivacyNoticeContent compact />
          </div>

          <div className="mt-3" aria-live="polite">
            <div className="flex items-center justify-between gap-3 text-xs font-semibold text-[#615848]">
              <span>
                {hasReachedEnd
                  ? "Complete notice reviewed"
                  : "Scroll through the complete notice"}
              </span>
              <span>{reviewProgress}%</span>
            </div>
            <div
              role="progressbar"
              aria-label="Privacy notice review progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={reviewProgress}
              className="mt-2 h-2 overflow-hidden rounded-full bg-[#d7c69e]"
            >
              <span
                className="block h-full rounded-full bg-[#286f9c] transition-[width] motion-reduce:transition-none"
                style={{ width: `${reviewProgress}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            className="hex-btn mt-5"
            onClick={() => {
              setHasReviewed(true);
              setIsOpen(false);
            }}
            disabled={disabled || !hasReachedEnd}
          >
            I have reviewed this agreement
          </button>
          {!hasReachedEnd && (
            <p className="muted mt-2 text-xs">
              The review confirmation becomes available after you reach the end
              of the notice.
            </p>
          )}
        </div>
      )}

      <p className="mt-4 text-sm">
        <Link
          href="/privacy"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-[#153f6f] underline underline-offset-4"
        >
          Open the full privacy notice in a separate page
        </Link>
      </p>

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
          I have reviewed the TLMS Privacy Notice and consent to the processing
          described in it.
        </span>
      </label>
      {hasReviewed ? (
        <p
          className="mt-2 flex items-center gap-2 text-xs font-semibold text-[#294a31]"
          role="status"
        >
          <CheckCircle2 aria-hidden="true" className="size-4" />
          Notice reviewed. You may now provide consent.
        </p>
      ) : (
        <p className="muted mt-2 text-xs" role="status">
          Open the notice, reach the end, and confirm your review to enable
          consent.
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
