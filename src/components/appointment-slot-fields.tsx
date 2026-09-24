"use client";

import { useId, useState } from "react";
import { formatManilaDate, formatManilaTime } from "@/lib/date";

export type AppointmentSlotOption = {
  id: string;
  startsAt: string;
  endsAt: string;
  remainingCapacity: number;
};

export type AppointmentEventOption = {
  id: string;
  title: string;
  slots: AppointmentSlotOption[];
};

function slotLabel(slot: AppointmentSlotOption) {
  const places = slot.remainingCapacity === 1 ? "place" : "places";
  return `${formatManilaTime(slot.startsAt)}–${formatManilaTime(slot.endsAt)} · ${slot.remainingCapacity} ${places} left`;
}

function groupSlotsByDate(slots: AppointmentSlotOption[]) {
  const groups = new Map<string, AppointmentSlotOption[]>();

  for (const slot of slots) {
    const label = formatManilaDate(slot.startsAt, { dateStyle: "full" });
    groups.set(label, [...(groups.get(label) ?? []), slot]);
  }

  return [...groups.entries()];
}

function SlotOptions({ slots }: { slots: AppointmentSlotOption[] }) {
  return groupSlotsByDate(slots).map(([dateLabel, dateSlots]) => (
    <optgroup key={dateLabel} label={dateLabel}>
      {dateSlots.map((slot) => (
        <option key={slot.id} value={slot.id}>
          {slotLabel(slot)}
        </option>
      ))}
    </optgroup>
  ));
}

export function AppointmentSlotFields({
  events,
}: {
  events: AppointmentEventOption[];
}) {
  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const [slotId, setSlotId] = useState("");
  const eventSelectId = useId();
  const slotSelectId = useId();
  const slotHelpId = useId();
  const selectedEvent = events.find((event) => event.id === eventId);
  const slots = selectedEvent?.slots ?? [];

  return (
    <div className="grid gap-4">
      <div>
        <label className="text-sm font-bold" htmlFor={eventSelectId}>
          Photoshoot event
        </label>
        <select
          id={eventSelectId}
          name="eventId"
          required
          className="hex-input mt-1"
          value={eventId}
          onChange={(event) => {
            setEventId(event.target.value);
            setSlotId("");
          }}
        >
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-bold" htmlFor={slotSelectId}>
          Available date and time
        </label>
        <select
          id={slotSelectId}
          name="slotId"
          required
          className="hex-input mt-1"
          value={slotId}
          onChange={(event) => setSlotId(event.target.value)}
          disabled={!slots.length}
          aria-describedby={slotHelpId}
        >
          <option value="">
            {slots.length
              ? "Choose an available date and time"
              : "No available dates or times"}
          </option>
          <SlotOptions slots={slots} />
        </select>
        <p id={slotHelpId} className="muted mt-1 block text-xs font-normal">
          Times shown in Philippine Time.
        </p>
      </div>
    </div>
  );
}

export function RescheduleSlotField({
  slots,
}: {
  slots: AppointmentSlotOption[];
}) {
  const selectId = useId();
  const helpId = useId();

  return (
    <div>
      <label className="text-sm font-bold" htmlFor={selectId}>
        New schedule
      </label>
      <select
        id={selectId}
        name="newSlotId"
        required
        className="hex-input mt-1"
        defaultValue=""
        disabled={!slots.length}
        aria-describedby={helpId}
      >
        <option value="">
          {slots.length
            ? "Choose another available date and time"
            : "No other dates or times are available"}
        </option>
        <SlotOptions slots={slots} />
      </select>
      <p id={helpId} className="muted mt-1 block text-xs font-normal">
        Times shown in Philippine Time.
      </p>
    </div>
  );
}
