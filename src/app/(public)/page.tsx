import {
  CalendarDays,
  Camera,
  Check,
  ClipboardCheck,
  Compass,
  Diamond,
  MessageSquareText,
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
    [Camera, "Thesis Photoshoot Scheduling", "I", "Available now"],
    [School, "Room Reservations", "II", "Coming soon"],
    [PackageOpen, "Equipment Requests", "III", "Coming soon"],
    [CalendarDays, "Event Logistics", "IV", "Coming soon"],
    [ClipboardCheck, "Gate Pass & Documents", "V", "Coming soon"],
    [MessageSquareText, "General Logistics Concerns", "VI", "Coming soon"],
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
            <p className="eyebrow">TICAP Logistics Department</p>
            <h1 className="hex-display mt-6 text-[clamp(3rem,7vw,6.5rem)] text-[#4c3a27]">
              Logistics,
              <span className="block text-[#153f6f]">Coordinated</span>
            </h1>
            <div className="hex-rule mx-auto my-6 max-w-md lg:mx-0">
              <span />
            </div>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-[#3c342a] sm:text-xl lg:mx-0">
              The central portal for TICAP logistics services, operational
              schedules, department notices, and secure coordination across the
              college community.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Button href="/services" className="w-full sm:w-auto">
                Explore services
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
                    Current department service
                  </p>
                  <h2 className="mt-2 font-[Cinzel] text-xl text-[#f3ead2]">
                    {event?.title ?? "Thesis Photoshoot Scheduling"}
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
                      : "The next schedule will be published here"}
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
                  <dd>Official coordination records remain protected.</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#806837] bg-[#4c3a27] text-[#f3ead2]">
        <div className="container-page grid grid-cols-2 divide-x divide-[#806837] sm:grid-cols-4">
          {[
            "Central coordination",
            "Secure records",
            "Clear schedules",
            "Accountable service",
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
          <p className="eyebrow">The department at work</p>
          <h2 className="hex-display mt-5 text-4xl sm:text-5xl">
            One desk for clearer logistics
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
              "Plan with clarity",
              "Find active services, published schedules, requirements, and deadlines in one dependable place.",
            ],
            [
              ClipboardCheck,
              "II",
              "Coordinate securely",
              "Identity, availability, permissions, and private records are verified before an operation is confirmed.",
            ],
            [
              Compass,
              "III",
              "Stay informed",
              "Department notices, venue details, instructions, and service updates remain easy to find and follow.",
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
        <p className="eyebrow">Department services</p>
        <h2 className="hex-display mt-5 max-w-4xl text-4xl sm:text-5xl">
          A growing home for TICAP logistics
        </h2>
        <p className="muted mt-5 max-w-3xl text-lg leading-relaxed">
          Photoshoot scheduling is the first active digital service. Additional
          department workflows will be introduced only when they are ready for
          official use.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map(([Icon, label, number, availability], index) => (
            <article
              key={label}
              className={`hex-banner rounded-xl p-5 ${index === 1 ? "bg-[#8e261c]" : index === 2 ? "bg-[#5d2782]" : index === 3 ? "bg-[#806837]" : index >= 4 ? "bg-[#334735]" : ""}`}
            >
              <div className="flex items-center justify-between">
                <Icon className="size-8 stroke-[1.5]" />
                <span className="font-[Cinzel] text-xl text-[#dbc98f]">
                  {number}
                </span>
              </div>
              <h3 className="mt-8 text-lg text-[#f3ead2]">{label}</h3>
              <p className="mt-2 text-xs font-semibold tracking-wider text-[#f3ead2]/80 uppercase">
                {availability}
              </p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
