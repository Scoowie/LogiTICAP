import { notFound, redirect } from "next/navigation";
import { Card, EmptyState, Status } from "@/components/ui";
import { ConfirmButton } from "@/components/confirm-button";
import { ThesisGroupForm } from "@/components/thesis-group-form";
import { getDb } from "@/lib/db";
import { requireActor } from "@/lib/auth/session";
import { formatManilaDateTime } from "@/lib/date";
import { manageOwnBooking, submitBooking } from "../actions";

const content = {
  profile: [
    "My Profile",
    "Review your verified identity and contact information.",
  ],
  group: [
    "My Thesis Group",
    "Maintain your group details and structured member list.",
  ],
  booking: [
    "My Photoshoot Booking",
    "Complete the guided reservation workflow and manage the group’s active booking.",
  ],
  notifications: [
    "Notifications",
    "Schedule confirmations and logistics updates addressed to you.",
  ],
  services: [
    "Logistics Services",
    "Photoshoot scheduling is active; other logistics services are being prepared.",
  ],
  help: [
    "Help",
    "Guidance for booking, schedule changes, access, and privacy concerns.",
  ],
} as const;

export default async function StudentSection({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requireActor();
  if (actor.role !== "STUDENT") redirect("/staff");
  const { section } = await params;
  if (!(section in content)) notFound();
  const [title, intro] = content[section as keyof typeof content];
  const group = actor.thesisGroupId
    ? await getDb().thesisGroup.findUnique({
        where: { id: actor.thesisGroupId },
        include: { members: true },
      })
    : null;
  const query = await searchParams;
  const activeBooking = group
    ? await getDb().booking.findFirst({
        where: {
          thesisGroupId: group.id,
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
        include: {
          event: {
            include: {
              dates: {
                include: {
                  slots: {
                    where: {
                      status: "AVAILABLE",
                      startsAt: { gt: new Date() },
                    },
                    orderBy: { startsAt: "asc" },
                  },
                },
              },
            },
          },
          currentSlot: true,
        },
      })
    : null;
  const openEvents =
    section === "booking" && group && !activeBooking
      ? await getDb().photoshootEvent.findMany({
          where: {
            status: "OPEN",
            isPublic: true,
            bookingOpensAt: { lte: new Date() },
            bookingClosesAt: { gte: new Date() },
          },
          include: {
            dates: {
              where: { isActive: true },
              include: {
                slots: {
                  where: { status: "AVAILABLE", startsAt: { gt: new Date() } },
                  orderBy: { startsAt: "asc" },
                },
              },
            },
          },
        })
      : [];
  const notifications =
    section === "notifications"
      ? await getDb().notification.findMany({
          where: { userId: actor.id },
          orderBy: { createdAt: "desc" },
          take: 50,
        })
      : [];
  const relevantAnnouncements =
    section === "notifications"
      ? await getDb().announcement.findMany({
          where: {
            publishedAt: { lte: new Date() },
            OR: [{ audience: null }, { audience: actor.role }],
          },
          orderBy: { publishedAt: "desc" },
          take: 20,
        })
      : [];
  const inputClass = "neo-input mt-1";
  return (
    <div className="mx-auto max-w-5xl">
      <p className="eyebrow">Student portal</p>
      <h1 className="neo-display mt-5 text-4xl text-black sm:text-6xl">
        {title}
      </h1>
      <p className="mt-5 max-w-3xl border-l-8 border-black bg-[#FFD93D] p-3 font-bold">
        {intro}
      </p>
      <div className="mt-7">
        {section === "profile" && (
          <Card>
            <dl className="grid gap-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-bold">Full name</dt>
                <dd className="muted mt-1">{actor.fullName}</dd>
              </div>
              <div>
                <dt className="font-bold">Verified email</dt>
                <dd className="muted mt-1 break-all">{actor.email}</dd>
              </div>
              <div>
                <dt className="font-bold">Account role</dt>
                <dd className="mt-1">
                  <Status>Student</Status>
                </dd>
              </div>
            </dl>
          </Card>
        )}
        {section === "group" &&
          (group ? (
            <Card>
              <h2 className="text-xl font-bold">{group.name}</h2>
              <p className="muted mt-1">{group.thesisTitle}</p>
              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
                <div>
                  <dt className="font-bold">Program</dt>
                  <dd>{group.program}</dd>
                </div>
                <div>
                  <dt className="font-bold">Section</dt>
                  <dd>{group.section}</dd>
                </div>
                <div>
                  <dt className="font-bold">Members</dt>
                  <dd>{group.members.length}</dd>
                </div>
              </dl>
              <ul
                className="mt-5 divide-y-3 divide-black"
                aria-label="Group members"
              >
                {group.members.map((member) => (
                  <li key={member.id} className="py-3 text-sm">
                    <span className="font-semibold">{member.fullName}</span>
                    <span className="muted ml-2">{member.studentNumber}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : (
            <Card>
              <h2 className="text-lg font-bold">Create your thesis group</h2>
              <p className="muted mt-1 text-sm">
                Your verified sign-in email will be used for the representative.
                Additional members can be added after initial setup.
              </p>
              <ThesisGroupForm />
            </Card>
          ))}
        {section === "booking" &&
          (activeBooking ? (
            <Card>
              <Status tone="success">
                {activeBooking.status.replaceAll("_", " ")}
              </Status>
              <h2 className="mt-3 text-xl font-bold">
                {activeBooking.event.title}
              </h2>
              <p className="mt-2 font-mono text-sm">
                {activeBooking.publicReference}
              </p>
              <p className="muted mt-2">
                {activeBooking.currentSlot
                  ? formatManilaDateTime(activeBooking.currentSlot.startsAt)
                  : "Pending schedule"}{" "}
                · {activeBooking.event.venue}
              </p>
              {[
                "PENDING_VERIFICATION",
                "CONFIRMED",
                "RESCHEDULE_REQUESTED",
                "RESCHEDULED",
              ].includes(activeBooking.status) && (
                <div className="mt-6 grid gap-4 border-t pt-5 md:grid-cols-2">
                  <form action={manageOwnBooking} className="grid gap-3">
                    <input
                      type="hidden"
                      name="bookingId"
                      value={activeBooking.id}
                    />
                    <label className="text-sm font-bold">
                      New schedule
                      <select name="newSlotId" required className={inputClass}>
                        <option value="">Choose another available slot</option>
                        {activeBooking.event.dates.flatMap((date) =>
                          date.slots
                            .filter(
                              (slot) =>
                                slot.id !== activeBooking.currentSlotId &&
                                slot.reservedCount < slot.capacity,
                            )
                            .map((slot) => (
                              <option key={slot.id} value={slot.id}>
                                {formatManilaDateTime(slot.startsAt)}
                              </option>
                            )),
                        )}
                      </select>
                    </label>
                    <label className="text-sm font-bold">
                      Reason
                      <input
                        name="reason"
                        required
                        maxLength={1000}
                        className={inputClass}
                      />
                    </label>
                    <ConfirmButton
                      name="action"
                      value="reschedule"
                      className="neo-btn"
                      message="Move this booking to the selected schedule?"
                    >
                      Reschedule booking
                    </ConfirmButton>
                  </form>
                  <form
                    action={manageOwnBooking}
                    className="grid content-start gap-3"
                  >
                    <input
                      type="hidden"
                      name="bookingId"
                      value={activeBooking.id}
                    />
                    <label className="text-sm font-bold">
                      Cancellation reason
                      <input
                        name="reason"
                        required
                        maxLength={1000}
                        className={inputClass}
                      />
                    </label>
                    <ConfirmButton
                      name="action"
                      value="cancel"
                      className="neo-btn neo-btn--danger"
                      message="Cancel this booking? Its current slot will be released."
                    >
                      Cancel booking
                    </ConfirmButton>
                  </form>
                </div>
              )}
            </Card>
          ) : !group ? (
            <EmptyState title="Create or confirm your thesis group first">
              Use My Thesis Group to add structured member and representative
              information.
            </EmptyState>
          ) : openEvents.length ? (
            <Card>
              <ol className="mb-8 grid gap-2 text-xs font-black text-black uppercase sm:grid-cols-5">
                <li>1 Identity verified</li>
                <li>2 Group confirmed</li>
                <li>3 Choose event/date</li>
                <li>4 Review policies</li>
                <li>5 Confirm</li>
              </ol>
              {query.confirmed && (
                <p
                  role="status"
                  className="mb-5 border-3 border-black bg-[#72E6A0] p-3 font-bold text-black shadow-[4px_4px_0_0_#000]"
                >
                  Booking confirmed: {query.confirmed}
                </p>
              )}
              <form action={submitBooking} className="grid gap-4">
                <input
                  type="hidden"
                  name="idempotencyKey"
                  value={crypto.randomUUID()}
                />
                <label className="text-sm font-bold">
                  Photoshoot event
                  <select name="eventId" required className={inputClass}>
                    {openEvents.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-bold">
                  Available date and time
                  <select name="slotId" required className={inputClass}>
                    <option value="">Choose a slot</option>
                    {openEvents.flatMap((event) =>
                      event.dates.flatMap((date) =>
                        date.slots
                          .filter((slot) => slot.reservedCount < slot.capacity)
                          .map((slot) => (
                            <option key={slot.id} value={slot.id}>
                              {formatManilaDateTime(slot.startsAt)} ·{" "}
                              {slot.capacity - slot.reservedCount} available
                            </option>
                          )),
                      ),
                    )}
                  </select>
                </label>
                <label className="text-sm font-bold">
                  Alternative schedule preference (optional)
                  <input
                    name="alternativePreference"
                    maxLength={500}
                    className={inputClass}
                  />
                </label>
                <label className="text-sm font-bold">
                  Special scheduling concern (optional)
                  <textarea
                    name="schedulingConcern"
                    maxLength={1000}
                    className={`${inputClass} min-h-20 py-2`}
                  />
                </label>
                <label className="text-sm font-bold">
                  Accessibility requirement (optional)
                  <textarea
                    name="accessibilityNeed"
                    maxLength={1000}
                    className={`${inputClass} min-h-20 py-2`}
                  />
                </label>
                <fieldset className="space-y-3 border-3 border-black bg-[#FFD93D] p-4">
                  <legend className="px-1 font-bold">
                    Required acknowledgements
                  </legend>
                  {[
                    ["accuracyAccepted", "Submitted information is accurate"],
                    [
                      "rulesAccepted",
                      "The group accepts cancellation and rescheduling rules",
                    ],
                    [
                      "notificationsAccepted",
                      "The group agrees to receive logistics notifications",
                    ],
                    [
                      "privacyAccepted",
                      "The group acknowledges the privacy notice",
                    ],
                  ].map(([name, label]) => (
                    <label className="flex gap-3 text-sm" key={name}>
                      <input
                        type="checkbox"
                        name={name}
                        required
                        className="mt-1 size-4"
                      />
                      {label}
                    </label>
                  ))}
                </fieldset>
                <button className="neo-btn">Confirm booking</button>
              </form>
            </Card>
          ) : (
            <EmptyState title="No bookable event is currently published">
              Authorized staff must open and publish an event before slots
              appear.
            </EmptyState>
          ))}
        {section === "notifications" &&
          (notifications.length || relevantAnnouncements.length ? (
            <div className="grid gap-4">
              {notifications.map((item) => (
                <Card key={item.id}>
                  <div className="flex justify-between gap-3">
                    <h2 className="font-bold">{item.subject}</h2>
                    <Status>{item.status}</Status>
                  </div>
                  <p className="muted mt-2 text-sm whitespace-pre-wrap">
                    {item.body}
                  </p>
                </Card>
              ))}
              {relevantAnnouncements.map((item) => (
                <Card key={item.id}>
                  <p className="eyebrow">Announcement</p>
                  <h2 className="mt-1 font-bold">{item.title}</h2>
                  <p className="muted mt-2 text-sm whitespace-pre-wrap">
                    {item.body}
                  </p>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState title="No notifications">
              Booking confirmations, schedule changes, venue changes, and
              reminders will appear here.
            </EmptyState>
          ))}
        {section === "services" && (
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              "Room Reservations",
              "Equipment Requests",
              "Event Logistics",
              "Gate Pass and Document Tracking",
              "General Logistics Concerns",
            ].map((item) => (
              <Card key={item}>
                <Status>Coming Soon</Status>
                <h2 className="mt-3 font-bold">{item}</h2>
              </Card>
            ))}
          </div>
        )}
        {section === "help" && (
          <Card>
            <h2 className="font-bold">Need assistance?</h2>
            <p className="muted mt-2 text-sm">
              Contact the official TICAP Logistics channel published by your
              organization. Never share a password, magic link, or
              authentication token.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
