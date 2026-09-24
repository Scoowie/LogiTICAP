"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  logIn,
  onboard,
  requestPasswordReset,
  updatePassword,
} from "@/app/(public)/auth-actions";
import { initialAuthFormState, type AuthFormState } from "@/lib/auth/flow";
import { PrivacyAgreementGate } from "@/components/privacy-agreement-gate";

function FormMessage({ state }: { state: AuthFormState }) {
  if (state.status === "idle") return null;
  const success = state.status === "success";
  return (
    <p
      role={success ? "status" : "alert"}
      aria-live="polite"
      className={`rounded-lg border p-3 text-sm font-semibold ${
        success
          ? "border-[#3f6848] bg-[#e0eadf] text-[#294a31]"
          : "border-[#8e261c] bg-[#f1d9d3] text-[#712018]"
      }`}
    >
      {state.message}
    </p>
  );
}

function FieldError({ state, name }: { state: AuthFormState; name: string }) {
  const errors = state.fieldErrors?.[name];
  if (!errors?.length) return null;
  return (
    <ul
      id={`${name}-error`}
      className="mt-1 space-y-1 text-sm font-semibold text-[#8e261c]"
    >
      {errors.map((error) => (
        <li key={error}>{error}</li>
      ))}
    </ul>
  );
}

function describedBy(state: AuthFormState, name: string) {
  return state.fieldErrors?.[name]?.length ? `${name}-error` : undefined;
}

const inputClass = "hex-input mt-2";

export function OnboardingForm() {
  const [state, action, pending] = useActionState(
    onboard,
    initialAuthFormState,
  );
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  return (
    <form action={action} className="mt-7 grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <FormMessage state={state} />
      </div>
      <label className="text-sm font-bold">
        First name
        <input
          name="firstName"
          autoComplete="given-name"
          required
          maxLength={60}
          aria-describedby={describedBy(state, "firstName")}
          className={inputClass}
        />
        <FieldError state={state} name="firstName" />
      </label>
      <label className="text-sm font-bold">
        Middle name <span className="font-normal">(optional)</span>
        <input
          name="middleName"
          autoComplete="additional-name"
          maxLength={80}
          aria-describedby={describedBy(state, "middleName")}
          className={inputClass}
        />
        <FieldError state={state} name="middleName" />
      </label>
      <label className="text-sm font-bold">
        Last name
        <input
          name="lastName"
          autoComplete="family-name"
          required
          maxLength={80}
          aria-describedby={describedBy(state, "lastName")}
          className={inputClass}
        />
        <FieldError state={state} name="lastName" />
      </label>
      <label className="text-sm font-bold">
        Suffix <span className="font-normal">(optional)</span>
        <input
          name="suffix"
          autoComplete="honorific-suffix"
          maxLength={20}
          placeholder="Jr., III"
          aria-describedby={describedBy(state, "suffix")}
          className={inputClass}
        />
        <FieldError state={state} name="suffix" />
      </label>
      <label className="text-sm font-bold">
        Contact number
        <input
          name="contactNumber"
          type="tel"
          autoComplete="tel"
          required
          maxLength={32}
          aria-describedby={describedBy(state, "contactNumber")}
          className={inputClass}
        />
        <FieldError state={state} name="contactNumber" />
      </label>
      <label className="text-sm font-bold sm:col-span-2">
        Email address
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={320}
          aria-describedby={describedBy(state, "email")}
          className={inputClass}
        />
        <FieldError state={state} name="email" />
      </label>
      <div className="rounded-lg border border-[#b69a5e] bg-[#f3ead2] p-4 text-sm sm:col-span-2">
        <p className="font-bold text-[#4c3a27]">Password requirements</p>
        <p className="mt-1 text-[#615848]">
          Use at least 12 characters with uppercase and lowercase letters, a
          number, and a symbol.
        </p>
      </div>
      <label className="text-sm font-bold">
        Password
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          maxLength={128}
          aria-describedby={describedBy(state, "password")}
          className={inputClass}
        />
        <FieldError state={state} name="password" />
      </label>
      <label className="text-sm font-bold">
        Confirm password
        <input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          maxLength={128}
          aria-describedby={describedBy(state, "confirmPassword")}
          className={inputClass}
        />
        <FieldError state={state} name="confirmPassword" />
      </label>
      <PrivacyAgreementGate
        disabled={pending}
        fieldErrors={state.fieldErrors}
        onAcceptanceChange={setPrivacyAccepted}
      />
      <button
        type="submit"
        disabled={pending || !privacyAccepted}
        className="hex-btn disabled:cursor-wait disabled:opacity-70 sm:col-span-2"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(logIn, initialAuthFormState);
  return (
    <form action={action} className="mt-6 space-y-5">
      <FormMessage state={state} />
      <input type="hidden" name="next" value={next} />
      <label className="block text-sm font-bold">
        Email address
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={320}
          aria-describedby={describedBy(state, "email")}
          className={inputClass}
        />
        <FieldError state={state} name="email" />
      </label>
      <label className="block text-sm font-bold">
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
          aria-describedby={describedBy(state, "password")}
          className={inputClass}
        />
        <FieldError state={state} name="password" />
      </label>
      <div className="text-right">
        <Link
          href="/forgot-password"
          className="text-sm font-semibold text-[#153f6f] underline-offset-4 hover:underline"
        >
          Forgot password?
        </Link>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="hex-btn w-full disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}

export function PasswordRecoveryForm() {
  const [state, action, pending] = useActionState(
    requestPasswordReset,
    initialAuthFormState,
  );
  return (
    <form action={action} className="mt-6 space-y-5">
      <FormMessage state={state} />
      <label className="block text-sm font-bold">
        Email address
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={320}
          aria-describedby={describedBy(state, "email")}
          className={inputClass}
        />
        <FieldError state={state} name="email" />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="hex-btn w-full disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Sending recovery link…" : "Send recovery link"}
      </button>
    </form>
  );
}

export function PasswordUpdateForm() {
  const [state, action, pending] = useActionState(
    updatePassword,
    initialAuthFormState,
  );
  return (
    <form action={action} className="mt-6 space-y-5">
      <FormMessage state={state} />
      <p className="rounded-lg border border-[#b69a5e] bg-[#f3ead2] p-3 text-sm">
        Use at least 12 characters with uppercase and lowercase letters, a
        number, and a symbol.
      </p>
      <label className="block text-sm font-bold">
        New password
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          maxLength={128}
          aria-describedby={describedBy(state, "password")}
          className={inputClass}
        />
        <FieldError state={state} name="password" />
      </label>
      <label className="block text-sm font-bold">
        Confirm new password
        <input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          maxLength={128}
          aria-describedby={describedBy(state, "confirmPassword")}
          className={inputClass}
        />
        <FieldError state={state} name="confirmPassword" />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="hex-btn w-full disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Updating password…" : "Set new password"}
      </button>
    </form>
  );
}
