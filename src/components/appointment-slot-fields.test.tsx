// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  AppointmentSlotFields,
  RescheduleSlotField,
  type AppointmentEventOption,
} from "./appointment-slot-fields";

afterEach(cleanup);

const events: AppointmentEventOption[] = [
  {
    id: "event-one",
    title: "Event One",
    slots: [
      {
        id: "slot-one",
        startsAt: "2026-10-05T01:00:00.000Z",
        endsAt: "2026-10-05T01:20:00.000Z",
        remainingCapacity: 3,
      },
    ],
  },
  {
    id: "event-two",
    title: "Event Two",
    slots: [
      {
        id: "slot-two",
        startsAt: "2026-10-06T02:00:00.000Z",
        endsAt: "2026-10-06T02:20:00.000Z",
        remainingCapacity: 1,
      },
    ],
  },
];

describe("AppointmentSlotFields", () => {
  it("filters slots by event and clears the selected slot when the event changes", () => {
    render(<AppointmentSlotFields events={events} />);

    const eventSelect = screen.getByLabelText("Photoshoot event");
    const slotSelect = screen.getByLabelText("Available date and time");

    expect(screen.getByRole("option", { name: /3 places left/ })).toBeTruthy();
    expect(screen.queryByRole("option", { name: /1 place left/ })).toBeNull();

    fireEvent.change(slotSelect, { target: { value: "slot-one" } });
    expect((slotSelect as HTMLSelectElement).value).toBe("slot-one");

    fireEvent.change(eventSelect, { target: { value: "event-two" } });
    expect((slotSelect as HTMLSelectElement).value).toBe("");
    expect(screen.getByRole("option", { name: /1 place left/ })).toBeTruthy();
    expect(screen.queryByRole("option", { name: /3 places left/ })).toBeNull();
  });

  it("groups rescheduling slots under a readable Manila date", () => {
    render(<RescheduleSlotField slots={events[0].slots} />);

    expect(
      screen.getByRole("group", { name: "Monday, October 5, 2026" }),
    ).toBeTruthy();
    expect(screen.getByText("Times shown in Philippine Time.")).toBeTruthy();
  });
});
