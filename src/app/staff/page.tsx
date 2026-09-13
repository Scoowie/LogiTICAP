import { Card, Status } from "@/components/ui";
import { getDb } from "@/lib/db";
import { requireActor } from "@/lib/auth/session";

export default async function OperationsDashboard() {
  await requireActor();
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Staff portal</p>
          <h1 className="mt-2 text-3xl font-black text-[#102a43]">
            Operations dashboard
          </h1>
          <p className="muted mt-2">
            Photoshoot scheduling and attendance at a glance.
          </p>
        </div>
        <Status>Live database totals</Status>
      </div>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value]) => (
          <Card key={label}>
            <p className="muted text-sm font-semibold">{label}</p>
            <p className="mt-2 text-3xl font-black text-[#183f63]">{value}</p>
          </Card>
        ))}
      </div>
      <Card className="mt-6">
        <h2 className="text-lg font-bold">Recent administrative activity</h2>
        {recent.length ? (
          <ul className="mt-3 divide-y divide-[#d6dee6]">
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
