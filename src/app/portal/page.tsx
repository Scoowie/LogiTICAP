import { redirect } from "next/navigation";
import { Card, EmptyState, Status } from "@/components/ui";
import { formatManilaDateTime } from "@/lib/date";
import { getDb } from "@/lib/db";
import { requireActor } from "@/lib/auth/session";

export default async function PortalDashboard() {
  const actor = await requireActor();
  if (actor.role !== "STUDENT") redirect("/staff");
  const booking = actor.thesisGroupId
    ? await getDb().booking.findFirst({
        where: {
          thesisGroupId: actor.thesisGroupId,
          status: {
            in: [
              "PENDING_VERIFICATION",
              "CONFIRMED",
              "RESCHEDULE_REQUESTED",
              "RESCHEDULED",
              "CHECKED_IN",
            ],
          },
        },
        include: { event: true, currentSlot: true },
        orderBy: { createdAt: "desc" },
      })
    : null;
  return (
    <div className="mx-auto max-w-6xl">
      <p className="eyebrow">Student portal</p>
      <h1 className="neo-display mt-5 text-4xl text-black sm:text-6xl">
        Welcome, {actor.fullName}
      </h1>
      <p className="mt-5 max-w-3xl border-l-8 border-black bg-[#FFD93D] p-3 font-bold">
        Your current photoshoot schedule, deadlines, and preparation details.
      </p>
      <div className="mt-7">
        {booking ? (
          <Card className="rotate-[.3deg] bg-[#FFFDF5]!">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="eyebrow">Current booking</p>
                <h2 className="mt-3 text-2xl font-black tracking-tight uppercase">
                  {booking.event.title}
                </h2>
              </div>
              <Status tone="success">
                {booking.status.replaceAll("_", " ")}
              </Status>
            </div>
            <dl className="mt-6 grid gap-5 text-sm sm:grid-cols-3">
              <div>
                <dt className="font-bold">Reference</dt>
                <dd className="mt-1 font-mono">{booking.publicReference}</dd>
              </div>
              <div>
                <dt className="font-bold">Schedule</dt>
                <dd className="muted mt-1">
                  {booking.currentSlot
                    ? formatManilaDateTime(booking.currentSlot.startsAt)
                    : "Pending assignment"}
                </dd>
              </div>
              <div>
                <dt className="font-bold">Venue</dt>
                <dd className="muted mt-1">{booking.event.venue}</dd>
              </div>
            </dl>
            <div className="mt-6 border-4 border-black bg-[#C4B5FD] p-4 text-sm shadow-[4px_4px_0_0_#000]">
              <h3 className="font-black uppercase">Preparation instructions</h3>
              <p className="mt-2 font-bold whitespace-pre-wrap">
                {booking.event.preparationInstructions}
              </p>
            </div>
          </Card>
        ) : (
          <EmptyState
            title={
              actor.thesisGroupId
                ? "No active photoshoot booking"
                : "Complete your thesis group first"
            }
          >
            {actor.thesisGroupId
              ? "Open My Photoshoot Booking to choose an active event and available slot."
              : "Add your group and structured member list before reserving a schedule."}
          </EmptyState>
        )}
      </div>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <Card>
          <h2 className="font-black text-black uppercase">Deadlines</h2>
          <p className="muted mt-2 text-sm">
            Your event-specific booking, rescheduling, and cancellation
            deadlines appear with the active booking.
          </p>
        </Card>
        <Card>
          <h2 className="font-black text-black uppercase">Announcements</h2>
          <p className="muted mt-2 text-sm">
            No relevant announcements at this time.
          </p>
        </Card>
      </div>
    </div>
  );
}
