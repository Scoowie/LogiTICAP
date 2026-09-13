import {
  CalendarDays,
  Camera,
  ClipboardCheck,
  PackageOpen,
  School,
} from "lucide-react";
import { Button, Card, Status } from "@/components/ui";
import { formatManilaDateTime } from "@/lib/date";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const now = new Date();
  const [event, announcements] = await Promise.all([
    getDb().photoshootEvent.findFirst({
      where: {
        status: "OPEN",
        isPublic: true,
        bookingClosesAt: { gte: now },
      },
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
    [School, "Room Reservations"],
    [PackageOpen, "Equipment Requests"],
    [CalendarDays, "Event Logistics"],
    [ClipboardCheck, "Gate Pass & Documents"],
  ] as const;
  return (
    <>
      <section className="border-b border-[#c7d4de] bg-[linear-gradient(135deg,#e8f1f8_0%,#f8fafc_70%)]">
        <div className="container-page grid gap-10 py-14 lg:grid-cols-[1.3fr_.7fr] lg:py-20">
          <div>
            <p className="eyebrow">TICAP Logistics Management System · TLMS</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-[#102a43] sm:text-5xl">
              Cybersecurity thesis photoshoot scheduling, in one official
              portal.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#485867]">
              Confirm your thesis group, choose an available schedule, and
              receive a secure booking reference from the TICAP Logistics team.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/portal/booking">Book a Photoshoot</Button>
              <Button href="/schedule" variant="secondary">
                View public schedule
              </Button>
            </div>
          </div>
          <Card className="self-start border-t-4 border-t-[#d6a72d]">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-[#102a43]">
                Current activity
              </h2>
              <Status tone={event ? "success" : "warning"}>
                {event ? "Booking open" : "Awaiting publication"}
              </Status>
            </div>
            <dl className="mt-6 grid gap-5 text-sm">
              <div>
                <dt className="font-bold">Booking deadline</dt>
                <dd className="muted mt-1">
                  {event
                    ? formatManilaDateTime(event.bookingClosesAt)
                    : "Published with the active event"}
                </dd>
              </div>
              <div>
                <dt className="font-bold">Venue</dt>
                <dd className="muted mt-1">
                  {event?.venue ?? "Confirmed by Logistics per event"}
                </dd>
              </div>
              <div>
                <dt className="font-bold">Timezone</dt>
                <dd className="muted mt-1">Asia/Manila (Philippine Time)</dd>
              </div>
            </dl>
          </Card>
        </div>
      </section>
      <section className="container-page py-12">
        <div className="grid gap-5 md:grid-cols-3">
          <Card>
            <CalendarDays className="text-[#1f547f]" />
            <h2 className="mt-4 text-lg font-bold">Schedule clearly</h2>
            <p className="muted mt-2 text-sm leading-6">
              Only open dates and slots are offered. Capacity is secured on the
              server when you confirm.
            </p>
          </Card>
          <Card>
            <ClipboardCheck className="text-[#1f547f]" />
            <h2 className="mt-4 text-lg font-bold">Prepare confidently</h2>
            <p className="muted mt-2 text-sm leading-6">
              Deadlines, venue details, preparation guidance, and updates stay
              with your booking.
            </p>
          </Card>
          <Card>
            <Camera className="text-[#1f547f]" />
            <h2 className="mt-4 text-lg font-bold">Run operations well</h2>
            <p className="muted mt-2 text-sm leading-6">
              Authorized staff coordinate schedules, attendance, assignments,
              and reports.
            </p>
          </Card>
        </div>
      </section>
      <section className="container-page">
        <Card>
          <p className="eyebrow">Announcements</p>
          <h2 className="mt-2 text-2xl font-black text-[#102a43]">
            {announcements.length
              ? "Current logistics updates"
              : "No public announcements yet"}
          </h2>
          {announcements.length ? (
            <ul className="mt-4 divide-y divide-[#d6dee6]">
              {announcements.map((item) => (
                <li key={item.id} className="py-3">
                  <h3 className="font-bold">{item.title}</h3>
                  <p className="muted mt-1 text-sm whitespace-pre-wrap">
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted mt-2">
              Published logistics updates will appear here. Private group
              details are never shown publicly.
            </p>
          )}
        </Card>
      </section>
      <section className="container-page py-12">
        <p className="eyebrow">Future logistics services</p>
        <h2 className="mt-2 text-2xl font-black text-[#102a43]">
          One portal, built to grow responsibly
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.map(([Icon, label]) => (
            <Card key={label} className="flex items-center gap-3">
              <Icon className="shrink-0 text-[#1f547f]" />
              <div>
                <h3 className="font-bold">{label}</h3>
                <p className="muted text-xs">Coming Soon</p>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
