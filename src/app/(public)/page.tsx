import {
  CalendarDays,
  Camera,
  Check,
  ClipboardCheck,
  Compass,
  Diamond,
  PackageOpen,
  School,
  Sparkles,
} from "lucide-react";
import { Button, Card, Status } from "@/components/ui";
import { formatManilaDateTime } from "@/lib/date";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const now = new Date();
  const [event, announcements] = await Promise.all([
    getDb().photoshootEvent.findFirst({
      where: { status: "OPEN", isPublic: true, bookingClosesAt: { gte: now } },
      orderBy: { bookingClosesAt: "asc" },
    }),
    getDb().announcement.findMany({
      where: {
        isPublic: true,
        publishedAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { publishedAt: "desc" },
      take: 4,
    }),
  ]);
  const services = [
    [School, "Room Reservations", "I"],
    [PackageOpen, "Equipment Requests", "II"],
    [CalendarDays, "Event Logistics", "III"],
    [ClipboardCheck, "Gate Pass & Documents", "IV"],
  ] as const;

  return (
    <>
      <section className="hex-sky relative overflow-hidden border-b border-[#b69a5e]">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(165deg,transparent_48%,rgba(76,58,39,.18)_49%,rgba(76,58,39,.18)_50%,transparent_51%)]"
        />
        <Compass
          aria-hidden="true"
          className="absolute -top-16 -right-16 hidden size-80 stroke-[.5] text-[#806837]/30 lg:block"
        />
        <div className="container-page relative grid items-center gap-12 py-16 lg:grid-cols-[1.15fr_.85fr] lg:py-24">
          <div className="text-center lg:text-left">
            <p className="eyebrow">Official TICAP logistics portal</p>
            <h1 className="hex-display mt-6 text-[clamp(3rem,7vw,6.5rem)] text-[#4c3a27]">
              Centralized
              <span className="block text-[#153f6f]">Scheduling</span>
            </h1>
            <div className="hex-rule mx-auto my-6 max-w-md lg:mx-0">
              <span />
            </div>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-[#3c342a] sm:text-xl lg:mx-0">
              A secure academy registry for thesis-group photoshoot schedules,
              preparation notices, and official logistics coordination.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Button href="/portal/booking" className="w-full sm:w-auto">
                Book a photoshoot
              </Button>
              <Button
                href="/schedule"
                variant="secondary"
                className="w-full sm:w-auto"
              >
                View public schedule
              </Button>
            </div>
          </div>

          <div className="hex-arch relative mx-auto w-full max-w-md overflow-hidden bg-[#292923] pt-24 text-[#f3ead2]">
            <div
              aria-hidden="true"
              className="absolute top-5 left-1/2 grid size-12 -translate-x-1/2 place-items-center rounded-full border border-[#b69a5e] text-[#dbc98f]"
            >
              <Camera className="size-6 stroke-[1.5]" />
            </div>
            <div className="border-t border-[#806837] bg-[linear-gradient(145deg,#334735,#292923)] p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-[Cinzel] text-xs tracking-[.18em] text-[#dbc98f] uppercase">
                    Current activity
                  </p>
                  <h2 className="mt-2 font-[Cinzel] text-xl text-[#f3ead2]">
                    {event?.title ?? "Awaiting the next dispatch"}
                  </h2>
                </div>
                <Status tone={event ? "success" : "warning"}>
                  {event ? "Open" : "Stand by"}
                </Status>
              </div>
              <dl className="mt-6 space-y-4 text-sm">
                <div className="border-l border-[#b69a5e] pl-4">
                  <dt className="text-xs tracking-wider text-[#dbc98f] uppercase">
                    Booking deadline
                  </dt>
                  <dd className="mt-1 font-semibold">
                    {event
                      ? formatManilaDateTime(event.bookingClosesAt)
                      : "Published with the next event"}
                  </dd>
                </div>
                <div className="border-l border-[#b69a5e] pl-4">
                  <dt className="text-xs tracking-wider text-[#dbc98f] uppercase">
                    Venue
                  </dt>
                  <dd className="mt-1 font-semibold">
                    {event?.venue ?? "Confirmed by Logistics"}
                  </dd>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-[#806837] bg-[#211d18]/40 p-3">
                  <Check className="size-5 shrink-0 text-[#dbc98f]" />
                  <dd>Private group information remains protected.</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#806837] bg-[#4c3a27] text-[#f3ead2]">
        <div className="container-page grid grid-cols-2 divide-x divide-[#806837] sm:grid-cols-4">
          {[
            "Verified identity",
            "Capacity protected",
            "Manila time",
            "Private by design",
          ].map((item) => (
            <p
              key={item}
              className="flex min-h-16 items-center justify-center gap-2 px-3 text-center text-xs font-semibold tracking-wider uppercase"
            >
              <Diamond className="size-3 fill-[#b69a5e] text-[#b69a5e]" />
              {item}
            </p>
          ))}
        </div>
      </section>

      <section className="container-page py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">The reservation registry</p>
          <h2 className="hex-display mt-5 text-4xl sm:text-5xl">
            A clear path from group to gallery
          </h2>
          <div className="hex-rule mx-auto mt-6 max-w-sm">
            <span />
          </div>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            [
              CalendarDays,
              "I",
              "Choose a schedule",
              "Only active dates and capacity-backed time slots are offered.",
            ],
            [
              ClipboardCheck,
              "II",
              "Confirm securely",
              "Availability is verified by the server before a booking is recorded.",
            ],
            [
              Camera,
              "III",
              "Arrive prepared",
              "Venue details, deadlines, instructions, and updates remain in one record.",
            ],
          ].map(([Icon, number, title, copy]) => {
            const Glyph = Icon as typeof CalendarDays;
            return (
              <Card key={title as string}>
                <div className="flex items-center justify-between text-[#806837]">
                  <Glyph className="size-9 stroke-[1.5]" />
                  <span className="font-[Cinzel] text-3xl">
                    {number as string}
                  </span>
                </div>
                <h3 className="mt-6 text-xl text-[#4c3a27]">
                  {title as string}
                </h3>
                <p className="muted mt-3 leading-relaxed">{copy as string}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="hex-conservatory border-y border-[#806837] py-16 sm:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-[.7fr_1.3fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold tracking-[.18em] text-[#dbc98f] uppercase">
              Academy dispatches
            </p>
            <h2 className="mt-5 font-[Cinzel] text-4xl text-[#f3ead2] sm:text-5xl">
              Current announcements
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-[#f3ead2]/80">
              Official notices for students and logistics personnel, published
              from the operations desk.
            </p>
          </div>
          <Card className="bg-[#fbf6e8]!">
            {announcements.length ? (
              <ul className="divide-y divide-[#b69a5e]/40">
                {announcements.map((item) => (
                  <li key={item.id} className="py-5 first:pt-0 last:pb-0">
                    <h3 className="text-lg text-[#4c3a27]">{item.title}</h3>
                    <p className="muted mt-2 whitespace-pre-wrap">
                      {item.body}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-7 text-center">
                <Sparkles className="mx-auto size-9 text-[#806837]" />
                <h3 className="mt-4 text-xl text-[#4c3a27]">
                  The dispatch board is clear
                </h3>
                <p className="muted mt-2">
                  Published logistics updates will appear here. Private group
                  details never will.
                </p>
              </div>
            )}
          </Card>
        </div>
      </section>

      <section className="container-page py-16 sm:py-24">
        <p className="eyebrow">Future services</p>
        <h2 className="hex-display mt-5 max-w-4xl text-4xl sm:text-5xl">
          The logistics directory is expanding
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map(([Icon, label, number], index) => (
            <article
              key={label}
              className={`hex-banner rounded-xl p-5 ${index === 1 ? "bg-[#8e261c]" : index === 2 ? "bg-[#5d2782]" : index === 3 ? "bg-[#806837]" : ""}`}
            >
              <div className="flex items-center justify-between">
                <Icon className="size-8 stroke-[1.5]" />
                <span className="font-[Cinzel] text-xl text-[#dbc98f]">
                  {number}
                </span>
              </div>
              <h3 className="mt-8 text-lg text-[#f3ead2]">{label}</h3>
              <p className="mt-2 text-xs font-semibold tracking-wider text-[#f3ead2]/80 uppercase">
                Coming soon
              </p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
