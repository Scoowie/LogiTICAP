import { Card, Status, WorkspaceHeader } from "@/components/ui";
import { getDb } from "@/lib/db";
import { requireActor } from "@/lib/auth/session";

export default async function OperationsDashboard() {
  const actor = await requireActor();
  const db = getDb();
  const todayStart = new Date();
  todayStart.setUTCHours(16, 0, 0, 0);
  todayStart.setUTCDate(todayStart.getUTCDate() - 1);
  const todayEnd = new Date(todayStart);
  todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);
  const [
    groups,
    confirmed,
    cancellations,
    requests,
    checkIns,
    completed,
    noShows,
    slotAgg,
    fullSlots,
    today,
    recent,
  ] = await Promise.all([
    db.thesisGroup.count({ where: { isActive: true } }),
    db.booking.count({
      where: { status: { in: ["CONFIRMED", "RESCHEDULED"] } },
    }),
    db.booking.count({ where: { status: "CANCELLED" } }),
    db.booking.count({ where: { status: "RESCHEDULE_REQUESTED" } }),
    db.booking.count({ where: { status: "CHECKED_IN" } }),
    db.booking.count({ where: { status: "COMPLETED" } }),
    db.booking.count({ where: { status: "NO_SHOW" } }),
    db.timeSlot.aggregate({
      _sum: { capacity: true, reservedCount: true },
      where: { status: "AVAILABLE" },
    }),
    db.$queryRaw<
      Array<{ count: bigint }>
    >`SELECT COUNT(*) AS count FROM "TimeSlot" WHERE status = 'AVAILABLE' AND "reservedCount" >= capacity`,
    db.booking.count({
      where: {
        currentSlot: { startsAt: { gte: todayStart, lt: todayEnd } },
        status: { not: "CANCELLED" },
      },
    }),
    db.auditLog.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      select: { id: true, action: true, targetType: true, createdAt: true },
    }),
  ]);
  const unbooked = Math.max(0, groups - confirmed - requests - checkIns);
  const available = Math.max(
    0,
    (slotAgg._sum.capacity ?? 0) - (slotAgg._sum.reservedCount ?? 0),
  );
  const metrics = [
    ["Registered groups", groups],
    ["Confirmed bookings", confirmed],
    ["Available capacity", available],
    ["Full slots", Number(fullSlots[0]?.count ?? 0)],
    ["Groups without bookings", unbooked],
    ["Cancelled", cancellations],
    ["Reschedule requests", requests],
    ["Scheduled today", today],
    ["Checked in", checkIns],
    ["Completed", completed],
    ["No-shows", noShows],
  ];
  return (
    <div className="mx-auto max-w-7xl">
      <WorkspaceHeader
        eyebrow={
          actor.role === "SUPERADMIN"
            ? "Superadmin command"
            : actor.role === "ADMIN"
              ? "Administration"
              : "Field operations"
        }
        title="Operations dashboard"
        intro="Photoshoot scheduling, attendance, and logistics operations at a glance."
        aside={<Status>Live database totals</Status>}
      />
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value], index) => (
          <Card
            key={label}
            className={
              index % 4 === 0
                ? "border-t-4 border-t-[#153f6f]! bg-[#fbf6e8]!"
                : index % 4 === 1
                  ? "border-t-4 border-t-[#8e261c]! bg-[#fbf6e8]!"
                  : index % 4 === 2
                    ? "border-t-4 border-t-[#5d2782]! bg-[#fbf6e8]!"
                    : "border-t-4 border-t-[#d5a938]! bg-[#fbf6e8]!"
            }
          >
            <p className="text-xs font-semibold tracking-[.12em] text-[#615848] uppercase">
              {label}
            </p>
            <p className="mt-3 font-[Cinzel] text-4xl font-semibold text-[#4c3a27]">
              {value}
            </p>
          </Card>
        ))}
      </div>
      <Card className="mt-6">
        <h2 className="text-lg font-bold">Recent administrative activity</h2>
        {recent.length ? (
          <ul className="mt-4 divide-y divide-[#b69a5e]/40">
            {recent.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap justify-between gap-2 py-3 text-sm"
              >
                <span>
                  <strong>{item.action}</strong> · {item.targetType}
                </span>
                <time className="muted">
                  {item.createdAt.toLocaleString("en-PH", {
                    timeZone: "Asia/Manila",
                  })}
                </time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted mt-3 text-sm">
            No administrative activity recorded.
          </p>
        )}
      </Card>
    </div>
  );
}
