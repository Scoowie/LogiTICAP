import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { writeAudit } from "@/lib/audit";
import { hasPermission } from "@/lib/auth/permissions";
import { getActor } from "@/lib/auth/session";
import { formatManilaDateTime } from "@/lib/date";
import { getDb } from "@/lib/db";
import { exportQuerySchema } from "@/lib/validation";

type Row = Record<string, string | number>;
const csvCell = (value: string | number) =>
  `"${String(value).replaceAll('"', '""')}"`;

export async function GET(request: Request) {
  const actor = await getActor();
  if (!actor || !hasPermission(actor.role, "exports:standard"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = exportQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid export parameters" },
      { status: 400 },
    );
  const input = parsed.data;
  if (
    input.report === "contacts" &&
    !hasPermission(actor.role, "exports:restricted")
  )
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = getDb();
  const dateFilter =
    input.from || input.to
      ? {
          startsAt: {
            ...(input.from
              ? { gte: new Date(`${input.from}T00:00:00+08:00`) }
              : {}),
            ...(input.to
              ? { lt: new Date(`${input.to}T23:59:59.999+08:00`) }
              : {}),
          },
        }
      : undefined;
  let rows: Row[] = [];
  if (input.report === "unbooked") {
    const groups = await db.thesisGroup.findMany({
      where: {
        isActive: true,
        bookings: {
          none: {
            status: {
              in: [
                "PENDING_VERIFICATION",
                "CONFIRMED",
                "RESCHEDULE_REQUESTED",
                "RESCHEDULED",
                "CHECKED_IN",
              ],
            },
            ...(input.eventId ? { eventId: input.eventId } : {}),
          },
        },
      },
      select: { name: true, thesisTitle: true, program: true, section: true },
    });
    rows = groups.map((group) => ({
      Group: group.name,
      "Thesis title": group.thesisTitle,
      Program: group.program,
      Section: group.section,
    }));
  } else {
    const bookings = await db.booking.findMany({
      where: {
        ...(input.eventId ? { eventId: input.eventId } : {}),
        ...(dateFilter ? { currentSlot: dateFilter } : {}),
        ...(input.report === "attendance"
          ? { status: { in: ["CHECKED_IN", "COMPLETED", "NO_SHOW"] } }
          : {}),
        ...(input.report === "changes"
          ? {
              status: {
                in: ["CANCELLED", "RESCHEDULE_REQUESTED", "RESCHEDULED"],
              },
            }
          : {}),
      },
      include: {
        event: true,
        thesisGroup: true,
        currentSlot: true,
        checkIn: true,
      },
      orderBy: { currentSlot: { startsAt: "asc" } },
    });
    rows = bookings.map((booking) => ({
      Reference: booking.publicReference,
      Event: booking.event.title,
      Group: booking.thesisGroup.name,
      Program: booking.thesisGroup.program,
      Section: booking.thesisGroup.section,
      Schedule: booking.currentSlot
        ? formatManilaDateTime(booking.currentSlot.startsAt)
        : "",
      Venue: booking.event.venue,
      Status: booking.status.replaceAll("_", " "),
      ...(input.report === "attendance"
        ? {
            "Arrival time": booking.checkIn
              ? formatManilaDateTime(booking.checkIn.arrivedAt)
              : "",
            "Completion time": booking.checkIn?.completedAt
              ? formatManilaDateTime(booking.checkIn.completedAt)
              : "",
          }
        : {}),
      ...(input.report === "contacts"
        ? {
            Representative: booking.thesisGroup.representativeName,
            Email: booking.thesisGroup.verifiedEmail,
            "Contact number": booking.thesisGroup.contactNumber,
          }
        : {}),
    }));
  }
  await writeAudit(db, {
    actorId: actor.id,
    action:
      input.report === "contacts"
        ? "export.sensitive_generated"
        : "export.generated",
    targetType: "Report",
    targetId: `${input.report}:${crypto.randomUUID()}`,
    newValues: {
      report: input.report,
      format: input.format,
      eventId: input.eventId,
      from: input.from,
      to: input.to,
      rowCount: rows.length,
    },
  });
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `ticap-${input.report}-${stamp}.${input.format}`;
  if (input.format === "csv") {
    const headers = rows.length ? Object.keys(rows[0]) : ["Result"];
    const body = [
      headers.map(csvCell).join(","),
      ...rows.map((row) =>
        headers.map((header) => csvCell(row[header] ?? "")).join(","),
      ),
    ].join("\r\n");
    return new NextResponse(`\uFEFF${body}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  }
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "TICAP Logistics Management System";
  const sheet = workbook.addWorksheet("TLMS Report", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  const data = rows.length ? rows : [{ Result: "No records" }];
  sheet.columns = Object.keys(data[0]).map((header) => ({
    header,
    key: header,
    width: Math.min(48, Math.max(14, header.length + 3)),
  }));
  sheet.addRows(data);
  sheet.getRow(1).font = { bold: true };
  sheet.autoFilter = {
    from: "A1",
    to: `${sheet.getColumn(sheet.columnCount).letter}1`,
  };
  const output = await workbook.xlsx.writeBuffer();
  return new NextResponse(new Uint8Array(output), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
