import { ChevronDown } from "lucide-react";
import { InfoPage } from "@/components/info-page";
import { Card, EmptyState, Status } from "@/components/ui";
import { formatManilaDateTime } from "@/lib/date";
import { getDb } from "@/lib/db";
import { getPublicSlotAvailability } from "@/lib/schedule-availability";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const now = new Date();
  const events = await getDb().photoshootEvent.findMany({
    where: { status: "OPEN", isPublic: true, bookingClosesAt: { gte: now } },
    include: {
      dates: {
        where: {
          isActive: true,
          slots: {
            some: { status: { not: "DELETED" }, startsAt: { gt: now } },
          },
        },
        include: {
          slots: {
            where: { status: { not: "DELETED" }, startsAt: { gt: now } },
            orderBy: { startsAt: "asc" },
          },
        },
        orderBy: { date: "asc" },
      },
    },
    orderBy: { bookingClosesAt: "asc" },
  });
  return (
    <InfoPage
      eyebrow="Public schedule"
      title="Events and Schedule Overview"
      intro="Only aggregate availability is public. Group names, student names, contacts, and private booking details are never displayed here."
    >
      {events.length ? (
        events.map((event) => {
          const slotCount = event.dates.reduce(
            (sum, date) => sum + date.slots.length,
            0,
          );

          return (
            <Card key={event.id}>
              <details className="group">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 rounded-lg [&::-webkit-details-marker]:hidden">
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-[#4c3a27] sm:text-2xl">
                      {event.title}
                    </h2>
                    <p className="muted mt-1 text-sm">
                      {event.venue} · {event.dates.length}{" "}
                      {event.dates.length === 1 ? "date" : "dates"} ·{" "}
                      {slotCount} {slotCount === 1 ? "time slot" : "time slots"}
                    </p>
                    <p className="muted mt-1 text-xs">
                      Booking closes{" "}
                      {formatManilaDateTime(event.bookingClosesAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Status tone="success">OPEN</Status>
                    <ChevronDown
                      aria-hidden="true"
                      className="size-5 text-[#4c3a27] transition-transform group-open:rotate-180 motion-reduce:transition-none"
                    />
                  </div>
                </summary>
                <div className="mt-5 grid gap-4 border-t border-[#b69a5e] pt-5 md:grid-cols-2">
                  {event.dates.map((date) => (
                    <section
                      key={date.id}
                      className="hex-panel bg-[#f3ead2] p-4"
                    >
                      <h3 className="font-bold">
                        {date.date.toLocaleDateString("en-PH", {
                          timeZone: "UTC",
                          dateStyle: "long",
                        })}
                      </h3>
                      <dl className="mt-3 grid gap-2 text-sm">
                        {date.slots.map((slot) => {
                          const availability = getPublicSlotAvailability(slot);
                          return (
                            <div
                              key={slot.id}
                              className={`flex min-h-12 items-center justify-between gap-3 rounded-lg border px-3 py-2 ${
                                availability.available
                                  ? "border-[#3f6848] bg-[#e0eadf]"
                                  : "border-[#8e261c] bg-[#f1d9d3]"
                              }`}
                            >
                              <dt>{formatManilaDateTime(slot.startsAt)}</dt>
                              <dd>
                                <Status
                                  tone={
                                    availability.available
                                      ? "success"
                                      : "danger"
                                  }
                                >
                                  {availability.available
                                    ? `${availability.remaining} available`
                                    : "Unavailable"}
                                </Status>
                              </dd>
                            </div>
                          );
                        })}
                      </dl>
                    </section>
                  ))}
                </div>
              </details>
            </Card>
          );
        })
      ) : (
        <EmptyState title="No schedule has been published">
          Authorized staff can publish configurable photoshoot dates and
          time-slot availability. Log in to make or manage a reservation when
          booking opens.
        </EmptyState>
      )}
    </InfoPage>
  );
}
