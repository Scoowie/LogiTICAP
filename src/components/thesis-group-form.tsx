"use client";

import { useActionState } from "react";
import {
  createThesisGroup,
  type ThesisGroupActionState,
} from "@/app/portal/actions";

const initialState: ThesisGroupActionState = { error: null };

export function ThesisGroupForm() {
  const [state, formAction, pending] = useActionState(
    createThesisGroup,
    initialState,
  );
  const inputClass =
    "mt-1 min-h-11 w-full rounded-md border border-[#9eacb9] bg-white px-3 text-sm";

  return (
    <form action={formAction} className="mt-5 grid gap-4 sm:grid-cols-2">
      {state.error && (
        <p
          id="group-form-error"
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 sm:col-span-2"
        >
          {state.error}
        </p>
      )}
      <label className="text-sm font-bold">
        Group name or identifier
        <input name="name" required maxLength={120} className={inputClass} />
      </label>
      <label className="text-sm font-bold">
        Program
        <input name="program" required maxLength={120} className={inputClass} />
      </label>
      <label className="text-sm font-bold sm:col-span-2">
        Thesis title
        <input
          name="thesisTitle"
          required
          maxLength={300}
          className={inputClass}
        />
      </label>
      <label className="text-sm font-bold">
        Section
        <input name="section" required maxLength={80} className={inputClass} />
      </label>
      <label className="text-sm font-bold">
        Adviser (optional)
        <input name="adviserName" maxLength={160} className={inputClass} />
      </label>
      <label className="text-sm font-bold">
        Representative full name
        <input
          name="representativeName"
          required
          maxLength={160}
          className={inputClass}
        />
      </label>
      <label className="text-sm font-bold">
        Contact number
        <input
          name="contactNumber"
          required
          maxLength={32}
          className={inputClass}
        />
      </label>
      {[1, 2, 3].map((number) => (
        <fieldset key={number} className="rounded-md border p-4 sm:col-span-2">
          <legend className="px-1 text-sm font-bold">
            Group member {number}
            {number > 1 ? " (optional)" : ""}
          </legend>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm">
              Full name
              <input
                name="memberName"
                required={number === 1}
                maxLength={160}
                className={inputClass}
              />
            </label>
            <label className="text-sm">
              Student number
              <input
                name="memberNumber"
                required={number === 1}
                maxLength={40}
                pattern="[A-Za-z0-9-]+"
                title="Use letters, numbers, and hyphens only"
                className={inputClass}
              />
            </label>
            <label className="text-sm">
              School email
              <input
                name="memberEmail"
                type="email"
                maxLength={320}
                className={inputClass}
              />
            </label>
          </div>
        </fieldset>
      ))}
      <button
        disabled={pending}
        aria-describedby={state.error ? "group-form-error" : undefined}
        className="min-h-11 rounded-md bg-[#183f63] px-5 font-bold text-white disabled:cursor-wait disabled:opacity-70 sm:col-span-2"
      >
        {pending ? "Creating group…" : "Create group"}
      </button>
    </form>
  );
}
