import { InfoPage } from "@/components/info-page";
import { Card, EmptyState, Status } from "@/components/ui";
import { formatManilaDateTime } from "@/lib/date";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const now = new Date();
  const events = await getDb().photoshootEvent.findMany({
    where: { status: "OPEN", isPublic: true, bookingClosesAt: { gte: now } },
    include: {
      dates: {
        where: { isActive: true },
        include: {
          slots: {
            where: { status: "AVAILABLE", startsAt: { gt: now } },
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
      title="Photoshoot availability overview"
      intro="Only aggregate availability is public. Group names, student names, contacts, and private booking details are never displayed here."
    >
      {events.length ? (
        events.map((event) => (
          <Card key={event.id}>
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <h2 className="text-2xl text-[#4c3a27]">{event.title}</h2>
                <p className="muted mt-1 text-sm">
                  {event.venue} · Booking closes{" "}
                  {formatManilaDateTime(event.bookingClosesAt)}
                </p>
              </div>
              <Status tone="success">OPEN</Status>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {event.dates.map((date) => (
                <section key={date.id} className="hex-panel bg-[#f3ead2] p-4">
                  <h3 className="font-bold">
                    {date.date.toLocaleDateString("en-PH", {
                      timeZone: "UTC",
                      dateStyle: "long",
                    })}
                  </h3>
                  <dl className="mt-3 grid gap-2 text-sm">
                    {date.slots.map((slot) => (
                      <div key={slot.id} className="flex justify-between gap-3">
                        <dt>{formatManilaDateTime(slot.startsAt)}</dt>
                        <dd className="font-semibold">
                          {Math.max(0, slot.capacity - slot.reservedCount)}{" "}
                          available
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </div>
          </Card>
        ))
      ) : (
        <EmptyState title="No schedule has been published">
          Authorized staff can publish configurable photoshoot dates and
          time-slot availability. Sign in to make or manage a reservation when
          booking opens.
        </EmptyState>
      )}
    </InfoPage>
  );
}
