"use client";

import { useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

const MAX_EVENT_DATES = 30;

export function EventDateFields() {
  const nextId = useRef(2);
  const [fieldIds, setFieldIds] = useState([0, 1]);

  function addDate() {
    setFieldIds((current) => {
      if (current.length >= MAX_EVENT_DATES) return current;
      const next = [...current, nextId.current];
      nextId.current += 1;
      return next;
    });
  }

  function removeDate(id: number) {
    setFieldIds((current) => current.filter((fieldId) => fieldId !== id));
  }

  return (
    <fieldset className="p-4 md:col-span-2">
      <legend className="px-1 text-sm font-bold">Event dates</legend>
      <p id="event-dates-help" className="muted text-sm">
        Add each date when the event runs. You can include up to 30 dates.
      </p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {fieldIds.map((id, index) => (
          <div
            key={id}
            className="flex flex-col gap-2 sm:flex-row sm:items-end"
          >
            <label className="min-w-0 flex-1 text-sm font-bold">
              Date {index + 1}
              {index > 0 ? " (optional)" : ""}
              <input
                id={`event-date-${id}`}
                className="hex-input mt-1"
                type="date"
                name="dates"
                required={index === 0}
                aria-describedby="event-dates-help"
              />
            </label>
            {index > 0 && (
              <button
                type="button"
                className="hex-btn hex-btn--secondary sm:shrink-0"
                onClick={() => removeDate(id)}
                aria-label={`Remove date ${index + 1}`}
              >
                <Trash2 aria-hidden="true" className="size-4" />
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="hex-btn hex-btn--secondary disabled:cursor-not-allowed disabled:opacity-50"
          onClick={addDate}
          disabled={fieldIds.length >= MAX_EVENT_DATES}
        >
          <Plus aria-hidden="true" className="size-4" />
          Add another date
        </button>
        <span className="muted text-sm" aria-live="polite">
          {fieldIds.length} of {MAX_EVENT_DATES} date fields
        </span>
      </div>
    </fieldset>
  );
}
