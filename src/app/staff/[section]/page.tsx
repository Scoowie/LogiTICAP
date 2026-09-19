import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, EmptyState, Status, WorkspaceHeader } from "@/components/ui";
import { ConfirmButton } from "@/components/confirm-button";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { requireActor } from "@/lib/auth/session";
import { formatManilaDateTime } from "@/lib/date";
import { getDb } from "@/lib/db";
import {
  administrativelyChangeBooking,
  changeAccountStatus,
  changeAssignment,
  changeEventStatus,
  changeSlot,
  changeUserRole,
  createEvent,
  editSlot,
  inviteStaff,
  publishAnnouncement,
  updateSystemSetting,
  updateAttendance,
} from "../actions";

const sections: Record<
  string,
  { title: string; intro: string; permission?: Permission }
> = {
  events: {
    title: "Events",
    intro: "Create and manage configurable photoshoot activities.",
    permission: "events:manage",
  },
  schedule: {
    title: "Event Dates and Time Slots",
    intro:
      "Review generated schedules and control individual slot availability.",
    permission: "events:manage",
  },
  bookings: {
    title: "Bookings",
    intro: "Search reservations and review group details, status, and history.",
    permission: "bookings:manage",
  },
  groups: {
    title: "Thesis Groups",
    intro:
      "Find registered groups and the information required for logistics work.",
    permission: "bookings:manage",
  },
  "check-in": {
    title: "Check-In",
    intro: "A focused, mobile-friendly attendance workflow.",
    permission: "checkin:manage",
  },
  assignments: {
    title: "Staff Assignments",
    intro: "Coordinate logistics members assigned to events.",
    permission: "assignments:manage",
  },
  announcements: {
    title: "Announcements",
    intro: "Publish public or role-targeted logistics notices.",
    permission: "announcements:manage",
  },
  reports: {
    title: "Reports and Exports",
    intro: "Download role-aware CSV or Excel reports.",
    permission: "exports:standard",
  },
  users: {
    title: "Users and Roles",
    intro:
      "Manage staff access. Only a superadmin can assign the superadmin role.",
    permission: "users:manage",
  },
  audit: {
    title: "Audit Logs",
    intro: "Review append-only records of consequential system activity.",
    permission: "audit:view",
  },
  settings: {
    title: "System Settings",
    intro: "Control organization-wide logistics configuration.",
    permission: "settings:manage",
  },
};

const inputClass = "hex-input mt-1";
const buttonClass = "hex-btn";

export default async function StaffSection({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const actor = await requireActor();
  const { section } = await params;
  const meta = sections[section];
  if (!meta) notFound();
  if (meta.permission && !hasPermission(actor.role, meta.permission))
    notFound();
  const query = (await searchParams).q?.slice(0, 120) ?? "";
  const db = getDb();
  const eventScope =
    actor.role === "LOGISTICS_MEMBER"
      ? { assignments: { some: { userId: actor.id } } }
      : {};
  const events = ["events", "schedule", "assignments"].includes(section)
    ? await db.photoshootEvent.findMany({
        where: eventScope,
        include: {
          dates: {
            include: { slots: { orderBy: { startsAt: "asc" } } },
            orderBy: { date: "asc" },
          },
          assignments: true,
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      })
    : [];
  const bookings = ["bookings", "check-in"].includes(section)
    ? await db.booking.findMany({
        where: {
          ...(actor.role === "LOGISTICS_MEMBER" ? { event: eventScope } : {}),
          ...(query
            ? {
                OR: [
                  { publicReference: { contains: query, mode: "insensitive" } },
                  {
                    thesisGroup: {
                      name: { contains: query, mode: "insensitive" },
                    },
                  },
                  {
                    thesisGroup: {
                      representativeName: {
                        contains: query,
                        mode: "insensitive",
                      },
                    },
                  },
                ],
              }
            : {}),
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
          thesisGroup: true,
          history: { orderBy: { createdAt: "desc" }, take: 3 },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
    : [];
  const groups =
    section === "groups"
      ? await db.thesisGroup.findMany({
          include: { _count: { select: { members: true, bookings: true } } },
          orderBy: { name: "asc" },
          take: 100,
        })
      : [];
  const users =
    section === "users"
      ? await db.userProfile.findMany({
          orderBy: { fullName: "asc" },
          take: 100,
        })
      : [];
  const invitations =
    section === "users"
      ? await db.staffInvitation.findMany({
          where: { status: "PENDING" },
          orderBy: { createdAt: "desc" },
          take: 30,
        })
      : [];
  const logisticsMembers =
    section === "assignments"
      ? await db.userProfile.findMany({
          where: { role: "LOGISTICS_MEMBER", status: "ACTIVE" },
          orderBy: { fullName: "asc" },
        })
      : [];
  const announcements =
    section === "announcements"
      ? await db.announcement.findMany({
          orderBy: { createdAt: "desc" },
          take: 30,
        })
      : [];
  const audits =
    section === "audit"
      ? await db.auditLog.findMany({
          where:
            actor.role === "ADMIN"
              ? {
                  NOT: [
                    { action: { startsWith: "security." } },
                    { action: { startsWith: "role." } },
                  ],
                }
              : {},
          include: { actor: { select: { fullName: true } } },
          orderBy: { createdAt: "desc" },
          take: 100,
        })
      : [];

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
        title={meta.title}
        intro={meta.intro}
        aside={<Status>{actor.role.replaceAll("_", " ")}</Status>}
      />
      <div className="mt-7 space-y-6">
        {section === "events" && (
          <>
            <Card>
              <h2 className="text-lg font-bold">Create photoshoot event</h2>
              <p className="muted mt-1 text-sm">
                Starts as a draft. Enter one required date and an optional
                second date; slots are generated in Philippine Time.
              </p>
              <form
                action={createEvent}
                className="mt-5 grid gap-4 md:grid-cols-2"
              >
                <label className="text-sm font-bold">
                  Event title
                  <input
                    className={inputClass}
                    name="title"
                    required
                    maxLength={160}
                  />
                </label>
                <label className="text-sm font-bold">
                  Venue
                  <input
                    className={inputClass}
                    name="venue"
                    required
                    maxLength={240}
                  />
                </label>
                <label className="text-sm font-bold md:col-span-2">
                  Description
                  <textarea
                    className={`${inputClass} min-h-24 py-3`}
                    name="description"
                    required
                    maxLength={2000}
                  />
                </label>
                <label className="text-sm font-bold md:col-span-2">
                  Preparation instructions
                  <textarea
                    className={`${inputClass} min-h-24 py-3`}
                    name="preparationInstructions"
                    required
                    maxLength={4000}
                  />
                </label>
                <label className="text-sm font-bold">
                  Booking opens
                  <input
                    className={inputClass}
                    type="datetime-local"
                    name="bookingOpensAt"
                    required
                  />
                </label>
                <label className="text-sm font-bold">
                  Booking closes
                  <input
                    className={inputClass}
                    type="datetime-local"
                    name="bookingClosesAt"
                    required
                  />
                </label>
                <label className="text-sm font-bold">
                  Reschedule deadline
                  <input
                    className={inputClass}
                    type="datetime-local"
                    name="rescheduleDeadline"
                    required
                  />
                </label>
                <label className="text-sm font-bold">
                  Cancellation deadline
                  <input
                    className={inputClass}
                    type="datetime-local"
                    name="cancellationDeadline"
                    required
                  />
                </label>
                <label className="text-sm font-bold">
                  Tentative date 1
                  <input
                    className={inputClass}
                    type="date"
                    name="dates"
                    required
                  />
                </label>
                <label className="text-sm font-bold">
                  Tentative date 2 (optional)
                  <input className={inputClass} type="date" name="dates" />
                </label>
                <label className="text-sm font-bold">
                  Daily start
                  <input
                    className={inputClass}
                    type="time"
                    name="startTime"
                    required
                  />
                </label>
                <label className="text-sm font-bold">
                  Daily end
                  <input
                    className={inputClass}
                    type="time"
                    name="endTime"
                    required
                  />
                </label>
                <label className="text-sm font-bold">
                  Slot duration (minutes)
                  <input
                    className={inputClass}
                    type="number"
                    name="slotDurationMinutes"
                    min="5"
                    max="480"
                    defaultValue="20"
                    required
                  />
                </label>
                <label className="text-sm font-bold">
                  Capacity per slot
                  <input
                    className={inputClass}
                    type="number"
                    name="capacity"
                    min="1"
                    max="100"
                    defaultValue="1"
                    required
                  />
                </label>
                <button
                  className={`${buttonClass} md:col-span-2`}
                  type="submit"
                >
                  Create draft and generate slots
                </button>
              </form>
            </Card>
            <EventList events={events} />
          </>
        )}
        {section === "schedule" &&
          (events.length
            ? events.map((event) => (
                <Card key={event.id}>
                  <div className="flex flex-wrap justify-between gap-3">
                    <h2 className="text-lg font-bold">{event.title}</h2>
                    <Status>{event.status}</Status>
                  </div>
                  {event.dates.map((date) => (
                    <div key={date.id} className="mt-5">
                      <h3 className="font-bold">
                        {date.date.toLocaleDateString("en-PH", {
                          timeZone: "UTC",
                          dateStyle: "long",
                        })}
                      </h3>
                      <div className="mt-2 overflow-x-auto">
                        <table className="w-full min-w-[620px] text-left text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="p-2">Time</th>
                              <th className="p-2">Capacity</th>
                              <th className="p-2">Status</th>
                              <th className="p-2">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {date.slots.map((slot) => (
                              <tr
                                key={slot.id}
                                className="border-b border-[#b69a5e]"
                              >
                                <td className="p-2">
                                  {formatManilaDateTime(slot.startsAt)}
                                </td>
                                <td className="p-2">
                                  {slot.reservedCount} / {slot.capacity}
                                </td>
                                <td className="p-2">
                                  <Status
                                    tone={
                                      slot.status === "AVAILABLE"
                                        ? "success"
                                        : "warning"
                                    }
                                  >
                                    {slot.status}
                                  </Status>
                                </td>
                                <td className="p-2">
                                  <form
                                    action={changeSlot}
                                    className="flex gap-2"
                                  >
                                    <input
                                      type="hidden"
                                      name="slotId"
                                      value={slot.id}
                                    />
                                    <input
                                      type="hidden"
                                      name="action"
                                      value={
                                        slot.status === "BLOCKED"
                                          ? "reopen"
                                          : "block"
                                      }
                                    />
                                    <input
                                      className="min-h-9 min-w-0 rounded border px-2"
                                      name="reason"
                                      required
                                      maxLength={500}
                                      aria-label="Reason"
                                      placeholder="Required reason"
                                    />
                                    <button className={buttonClass}>
                                      {slot.status === "BLOCKED"
                                        ? "Reopen"
                                        : "Block"}
                                    </button>
                                  </form>
                                  <details className="mt-2">
                                    <summary className="cursor-pointer font-semibold text-[#4c3a27]">
                                      Edit or delete
                                    </summary>
                                    <form
                                      action={editSlot}
                                      className="mt-2 flex gap-2"
                                    >
                                      <input
                                        type="hidden"
                                        name="slotId"
                                        value={slot.id}
                                      />
                                      <input
                                        type="number"
                                        name="capacity"
                                        min={Math.max(1, slot.reservedCount)}
                                        max={100}
                                        defaultValue={slot.capacity}
                                        required
                                        aria-label="Slot capacity"
                                        className="min-h-9 w-20 rounded border px-2"
                                      />
                                      <input
                                        name="reason"
                                        required
                                        maxLength={500}
                                        aria-label="Edit reason"
                                        placeholder="Reason"
                                        className="min-h-9 min-w-0 rounded border px-2"
                                      />
                                      <button className={buttonClass}>
                                        Save
                                      </button>
                                    </form>
                                    <form
                                      action={changeSlot}
                                      className="mt-2 flex gap-2"
                                    >
                                      <input
                                        type="hidden"
                                        name="slotId"
                                        value={slot.id}
                                      />
                                      <input
                                        type="hidden"
                                        name="action"
                                        value="delete"
                                      />
                                      <input
                                        name="reason"
                                        required
                                        maxLength={500}
                                        aria-label="Delete reason"
                                        placeholder="Delete reason"
                                        className="min-h-9 min-w-0 rounded border px-2"
                                      />
                                      <ConfirmButton
                                        className="hex-btn hex-btn--danger"
                                        message="Remove this empty slot from all schedules?"
                                      >
                                        Delete
                                      </ConfirmButton>
                                    </form>
                                  </details>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </Card>
              ))
            : section === "schedule" && (
                <EmptyState title="No events">
                  Create a photoshoot event to generate dates and slots.
                </EmptyState>
              ))}
        {section === "bookings" && (
          <BookingTable bookings={bookings} query={query} />
        )}
        {section === "groups" && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-3">Group</th>
                    <th className="p-3">Program / section</th>
                    <th className="p-3">Representative</th>
                    <th className="p-3">Members</th>
                    <th className="p-3">Bookings</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => (
                    <tr key={group.id} className="border-b">
                      <td className="p-3 font-semibold">
                        {group.name}
                        <span className="muted block font-normal">
                          {group.thesisTitle}
                        </span>
                      </td>
                      <td className="p-3">
                        {group.program} · {group.section}
                      </td>
                      <td className="p-3">{group.representativeName}</td>
                      <td className="p-3">{group._count.members}</td>
                      <td className="p-3">{group._count.bookings}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
        {section === "check-in" && (
          <>
            <form
              className="card flex flex-col gap-3 p-4 sm:flex-row"
              role="search"
            >
              <label className="sr-only" htmlFor="q">
                Group name or booking reference
              </label>
              <input
                id="q"
                name="q"
                defaultValue={query}
                className={`${inputClass} mt-0 flex-1`}
                placeholder="Group name or TLMS reference"
              />
              <button className={buttonClass}>Search</button>
            </form>
            {bookings.length ? (
              <div className="grid gap-4">
                {bookings.map((booking) => (
                  <Card key={booking.id}>
                    <div className="flex flex-wrap justify-between gap-3">
                      <div>
                        <p className="font-mono text-xs">
                          {booking.publicReference}
                        </p>
                        <h2 className="mt-1 text-lg font-bold">
                          {booking.thesisGroup.name}
                        </h2>
                        <p className="muted text-sm">
                          {booking.currentSlot
                            ? formatManilaDateTime(booking.currentSlot.startsAt)
                            : "No current slot"}{" "}
                          · {booking.event.venue}
                        </p>
                      </div>
                      <Status>{booking.status.replaceAll("_", " ")}</Status>
                    </div>
                    <form
                      action={updateAttendance}
                      className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]"
                    >
                      <input
                        type="hidden"
                        name="bookingId"
                        value={booking.id}
                      />
                      <label className="text-sm font-bold">
                        Operational note
                        <input
                          name="note"
                          maxLength={1000}
                          className={inputClass}
                        />
                      </label>
                      <div className="flex flex-wrap items-end gap-2">
                        {["CONFIRMED", "RESCHEDULED"].includes(
                          booking.status,
                        ) && (
                          <>
                            <button
                              name="action"
                              value="check-in"
                              className={buttonClass}
                            >
                              Check in
                            </button>
                            <button
                              name="action"
                              value="no-show"
                              className="hex-btn hex-btn--secondary"
                            >
                              No-show
                            </button>
                          </>
                        )}
                        {booking.status === "CHECKED_IN" && (
                          <button
                            name="action"
                            value="complete"
                            className={buttonClass}
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </form>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState title="No matching scheduled groups">
                Search by group name or a full TLMS booking reference.
              </EmptyState>
            )}
          </>
        )}
        {section === "assignments" && (
          <>
            <Card>
              <h2 className="text-lg font-bold">Assign logistics member</h2>
              <form
                action={changeAssignment}
                className="mt-4 grid gap-3 sm:grid-cols-2"
              >
                <label className="text-sm font-bold">
                  Event
                  <select name="eventId" required className={inputClass}>
                    <option value="">Choose event</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-bold">
                  Logistics member
                  <select name="userId" required className={inputClass}>
                    <option value="">Choose member</option>
                    {logisticsMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.fullName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-bold sm:col-span-2">
                  Operational notes
                  <input name="notes" maxLength={500} className={inputClass} />
                </label>
                <button
                  name="action"
                  value="assign"
                  className={`${buttonClass} sm:col-span-2`}
                >
                  Assign member
                </button>
              </form>
            </Card>
            <EventList events={events} />
          </>
        )}
        {section === "announcements" && (
          <>
            <Card>
              <h2 className="text-lg font-bold">Publish announcement</h2>
              <form action={publishAnnouncement} className="mt-4 grid gap-4">
                <label className="text-sm font-bold">
                  Title
                  <input
                    name="title"
                    required
                    maxLength={160}
                    className={inputClass}
                  />
                </label>
                <label className="text-sm font-bold">
                  Message
                  <textarea
                    name="body"
                    required
                    maxLength={3000}
                    className={`${inputClass} min-h-28 py-3`}
                  />
                </label>
                <label className="text-sm font-bold">
                  Role audience (optional)
                  <select name="audience" className={inputClass}>
                    <option value="">All authenticated roles</option>
                    <option value="STUDENT">Students</option>
                    <option value="LOGISTICS_MEMBER">Logistics members</option>
                    <option value="ADMIN">Admins</option>
                    <option value="SUPERADMIN">Superadmins</option>
                  </select>
                </label>
                <label className="flex items-center gap-3 text-sm font-bold">
                  <input type="checkbox" name="isPublic" className="size-4" />
                  Also show publicly
                </label>
                <ConfirmButton
                  className={buttonClass}
                  message="Publish this announcement now?"
                >
                  Publish announcement
                </ConfirmButton>
              </form>
            </Card>
            {announcements.length ? (
              <div className="grid gap-3">
                {announcements.map((item) => (
                  <Card key={item.id}>
                    <div className="flex justify-between gap-3">
                      <h2 className="font-bold">{item.title}</h2>
                      <Status>
                        {item.isPublic
                          ? "PUBLIC"
                          : (item.audience ?? "AUTHENTICATED")}
                      </Status>
                    </div>
                    <p className="muted mt-2 text-sm whitespace-pre-wrap">
                      {item.body}
                    </p>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState title="No announcements published">
                Create the first public or role-targeted logistics notice.
              </EmptyState>
            )}
          </>
        )}
        {section === "reports" && (
          <Card>
            <h2 className="text-lg font-bold">Available reports</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ["master", "Master photoshoot schedule"],
                ["by-date", "Schedule grouped by date"],
                ["media", "Media department schedule"],
                ["attendance", "Attendance report"],
                ["unbooked", "Groups without bookings"],
                ["changes", "Cancellation and rescheduling report"],
              ].map(([key, label]) => (
                <div key={key} className="hex-panel bg-[#fbf6e8] p-4">
                  <h3 className="font-semibold">{label}</h3>
                  <div className="mt-3 flex gap-2">
                    <Link
                      className={buttonClass}
                      href={`/api/exports?report=${key}&format=csv`}
                    >
                      CSV
                    </Link>
                    <Link
                      className={buttonClass}
                      href={`/api/exports?report=${key}&format=xlsx`}
                    >
                      Excel
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            {hasPermission(actor.role, "exports:restricted") && (
              <div className="hex-panel mt-6 bg-[#f3ead2] p-4">
                <h3 className="text-[#4c3a27]">Restricted contact list</h3>
                <p className="mt-2 text-sm font-semibold text-[#4c3a27]">
                  Contains personal contact data. Every download is audited.
                </p>
                <div className="mt-3 flex gap-2">
                  <Link
                    className={buttonClass}
                    href="/api/exports?report=contacts&format=csv"
                  >
                    CSV
                  </Link>
                  <Link
                    className={buttonClass}
                    href="/api/exports?report=contacts&format=xlsx"
                  >
                    Excel
                  </Link>
                </div>
              </div>
            )}
          </Card>
        )}
        {section === "users" && (
          <>
            <Card>
              <h2 className="text-lg font-bold">Invite staff</h2>
              <form
                action={inviteStaff}
                className="mt-4 grid gap-3 sm:grid-cols-[1fr_220px_auto]"
              >
                <label className="text-sm font-bold">
                  Verified email
                  <input
                    name="email"
                    type="email"
                    required
                    maxLength={320}
                    className={inputClass}
                  />
                </label>
                <label className="text-sm font-bold">
                  Role
                  <select name="role" className={inputClass}>
                    <option value="LOGISTICS_MEMBER">Logistics member</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPERADMIN">Superadmin</option>
                  </select>
                </label>
                <ConfirmButton
                  className={`${buttonClass} self-end`}
                  message="Send this privileged staff invitation?"
                >
                  Invite
                </ConfirmButton>
              </form>
              {invitations.length > 0 && (
                <p className="muted mt-4 text-sm">
                  {invitations.length} pending invitation(s). Expired
                  invitations cannot grant access.
                </p>
              )}
            </Card>
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-3">User</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Current role</th>
                      <th className="p-3">Change role</th>
                      <th className="p-3">Account</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b">
                        <td className="p-3 font-semibold">
                          {user.fullName}
                          <span className="muted block font-normal break-all">
                            {user.email}
                          </span>
                        </td>
                        <td className="p-3">{user.status}</td>
                        <td className="p-3">{user.role}</td>
                        <td className="p-3">
                          <form action={changeUserRole} className="flex gap-2">
                            <input
                              type="hidden"
                              name="userId"
                              value={user.id}
                            />
                            <select
                              name="role"
                              defaultValue={user.role}
                              className="min-h-10 rounded border px-2"
                            >
                              <option>STUDENT</option>
                              <option>LOGISTICS_MEMBER</option>
                              <option>ADMIN</option>
                              <option>SUPERADMIN</option>
                            </select>
                            <input
                              name="reason"
                              required
                              maxLength={1000}
                              placeholder="Required reason"
                              className="min-h-10 min-w-0 rounded border px-2"
                            />
                            <ConfirmButton
                              className={buttonClass}
                              message="Change this user's system role?"
                            >
                              Save
                            </ConfirmButton>
                          </form>
                        </td>
                        <td className="p-3">
                          <form
                            action={changeAccountStatus}
                            className="flex gap-2"
                          >
                            <input
                              type="hidden"
                              name="userId"
                              value={user.id}
                            />
                            <input
                              name="reason"
                              required
                              maxLength={1000}
                              placeholder="Required reason"
                              className="min-h-10 min-w-0 rounded border px-2"
                            />
                            <ConfirmButton
                              name="action"
                              value={
                                user.status === "ACTIVE"
                                  ? "suspend"
                                  : "activate"
                              }
                              className="hex-btn hex-btn--danger"
                              message={`${user.status === "ACTIVE" ? "Suspend" : "Activate"} this account?`}
                            >
                              {user.status === "ACTIVE"
                                ? "Suspend"
                                : "Activate"}
                            </ConfirmButton>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
        {section === "audit" && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-3">Time</th>
                    <th className="p-3">Actor</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Target</th>
                    <th className="p-3">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {audits.map((log) => (
                    <tr key={log.id} className="border-b">
                      <td className="p-3">
                        {formatManilaDateTime(log.createdAt)}
                      </td>
                      <td className="p-3">{log.actor?.fullName ?? "System"}</td>
                      <td className="p-3 font-semibold">{log.action}</td>
                      <td className="p-3">{log.targetType}</td>
                      <td className="p-3">{log.reason ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
        {section === "settings" && (
          <Card>
            <h2 className="text-lg font-bold">Update system setting</h2>
            <p className="muted mt-1 text-sm">
              Approved setting keys are constrained server-side. Every change is
              audited.
            </p>
            <form action={updateSystemSetting} className="mt-4 grid gap-4">
              <label className="text-sm font-bold">
                Setting
                <select name="key" className={inputClass}>
                  <option value="public_contact">
                    Public contact information
                  </option>
                  <option value="privacy_notice">Privacy notice</option>
                  <option value="school_email_required">
                    School email requirement
                  </option>
                </select>
              </label>
              <label className="text-sm font-bold">
                Value
                <textarea
                  name="value"
                  required
                  maxLength={2000}
                  className={`${inputClass} min-h-28 py-3`}
                />
              </label>
              <label className="text-sm font-bold">
                Change reason
                <input
                  name="description"
                  required
                  maxLength={500}
                  className={inputClass}
                />
              </label>
              <ConfirmButton
                className={buttonClass}
                message="Apply this system-wide setting change?"
              >
                Save setting
              </ConfirmButton>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}

function EventList({
  events,
}: {
  events: Array<{
    id: string;
    title: string;
    venue: string;
    status: string;
    dates: Array<{ id: string; slots: unknown[] }>;
    assignments: unknown[];
  }>;
}) {
  return events.length ? (
    <div className="grid gap-4">
      {events.map((event) => (
        <Card key={event.id}>
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">{event.title}</h2>
              <p className="muted text-sm">
                {event.venue} · {event.dates.length} dates ·{" "}
                {event.dates.reduce((sum, date) => sum + date.slots.length, 0)}{" "}
                slots · {event.assignments.length} assigned staff
              </p>
            </div>
            <Status>{event.status}</Status>
          </div>
          {["DRAFT", "CLOSED", "OPEN"].includes(event.status) && (
            <form
              action={changeEventStatus}
              className="mt-4 flex flex-wrap gap-2"
            >
              <input type="hidden" name="eventId" value={event.id} />
              <input
                type="hidden"
                name="status"
                value={event.status === "OPEN" ? "CLOSED" : "OPEN"}
              />
              <input
                name="reason"
                required
                maxLength={500}
                placeholder="Required reason"
                className="min-h-10 min-w-0 flex-1 rounded border px-3"
              />
              <button className={buttonClass}>
                {event.status === "OPEN" ? "Close booking" : "Open booking"}
              </button>
            </form>
          )}
        </Card>
      ))}
    </div>
  ) : (
    <EmptyState title="No events">
      Create the first configurable event when dates and venue are ready.
    </EmptyState>
  );
}

function BookingTable({
  bookings,
  query,
}: {
  bookings: Array<{
    id: string;
    publicReference: string;
    status: string;
    event: {
      title: string;
      dates: Array<{
        slots: Array<{
          id: string;
          startsAt: Date;
          capacity: number;
          reservedCount: number;
        }>;
      }>;
    };
    currentSlot: { startsAt: Date } | null;
    thesisGroup: { name: string; representativeName: string };
    history: unknown[];
  }>;
  query: string;
}) {
  return (
    <>
      <form className="card flex flex-col gap-3 p-4 sm:flex-row" role="search">
        <label className="sr-only" htmlFor="booking-q">
          Search bookings
        </label>
        <input
          id="booking-q"
          name="q"
          defaultValue={query}
          className={`${inputClass} mt-0 flex-1`}
          placeholder="Group, representative, or reference"
        />
        <button className={buttonClass}>Search</button>
      </form>
      {bookings.length ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-3">Reference</th>
                  <th className="p-3">Group</th>
                  <th className="p-3">Event</th>
                  <th className="p-3">Schedule</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">History</th>
                  <th className="p-3">Manage</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-b">
                    <td className="p-3 font-mono text-xs">
                      {booking.publicReference}
                    </td>
                    <td className="p-3 font-semibold">
                      {booking.thesisGroup.name}
                      <span className="muted block font-normal">
                        {booking.thesisGroup.representativeName}
                      </span>
                    </td>
                    <td className="p-3">{booking.event.title}</td>
                    <td className="p-3">
                      {booking.currentSlot
                        ? formatManilaDateTime(booking.currentSlot.startsAt)
                        : "—"}
                    </td>
                    <td className="p-3">
                      <Status>{booking.status.replaceAll("_", " ")}</Status>
                    </td>
                    <td className="p-3">
                      {booking.history.length} recent entries
                    </td>
                    <td className="p-3">
                      {[
                        "PENDING_VERIFICATION",
                        "CONFIRMED",
                        "RESCHEDULE_REQUESTED",
                        "RESCHEDULED",
                      ].includes(booking.status) ? (
                        <details>
                          <summary className="cursor-pointer font-semibold text-[#4c3a27]">
                            Change booking
                          </summary>
                          <div className="hex-panel mt-3 grid w-80 gap-3 bg-[#fbf6e8] p-3">
                            <form
                              action={administrativelyChangeBooking}
                              className="grid gap-2"
                            >
                              <input
                                type="hidden"
                                name="bookingId"
                                value={booking.id}
                              />
                              <label className="font-semibold">
                                New slot
                                <select
                                  name="newSlotId"
                                  required
                                  className={inputClass}
                                >
                                  <option value="">
                                    Choose available slot
                                  </option>
                                  {booking.event.dates.flatMap((date) =>
                                    date.slots
                                      .filter(
                                        (slot) =>
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
                              <input
                                name="reason"
                                required
                                maxLength={1000}
                                placeholder="Required override reason"
                                className={inputClass}
                              />
                              <ConfirmButton
                                name="action"
                                value="reschedule"
                                className={buttonClass}
                                message="Reschedule this group and notify the audit log?"
                              >
                                Reschedule
                              </ConfirmButton>
                            </form>
                            <form
                              action={administrativelyChangeBooking}
                              className="grid gap-2 border-t pt-3"
                            >
                              <input
                                type="hidden"
                                name="bookingId"
                                value={booking.id}
                              />
                              <input
                                name="reason"
                                required
                                maxLength={1000}
                                placeholder="Required cancellation reason"
                                className={inputClass}
                              />
                              <ConfirmButton
                                name="action"
                                value="cancel"
                                className="hex-btn hex-btn--danger"
                                message="Cancel this booking and restore its slot capacity?"
                              >
                                Cancel booking
                              </ConfirmButton>
                            </form>
                          </div>
                        </details>
                      ) : (
                        <span className="muted">No active change</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <EmptyState title="No matching bookings">
          Try a different group name, representative, or booking reference.
        </EmptyState>
      )}
    </>
  );
}
