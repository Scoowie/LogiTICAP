import Link from "next/link";
import { Brand } from "@/components/brand";
import type { AppRole } from "@/lib/auth/permissions";

const studentLinks = [
  ["Dashboard", "/portal"],
  ["My Profile", "/portal/profile"],
  ["My Thesis Group", "/portal/group"],
  ["My Photoshoot Booking", "/portal/booking"],
  ["Notifications", "/portal/notifications"],
  ["Logistics Services", "/portal/services"],
  ["Help", "/portal/help"],
];
const staffLinks = [
  ["Operations dashboard", "/staff"],
  ["Photoshoot Events", "/staff/events"],
  ["Dates & Time Slots", "/staff/schedule"],
  ["Bookings", "/staff/bookings"],
  ["Thesis Groups", "/staff/groups"],
  ["Check-In", "/staff/check-in"],
  ["Staff Assignments", "/staff/assignments"],
  ["Announcements", "/staff/announcements"],
  ["Reports & Exports", "/staff/reports"],
  ["Users & Roles", "/staff/users"],
  ["Audit Logs", "/staff/audit"],
  ["System Settings", "/staff/settings"],
];

export function PortalNav({ role, name }: { role: AppRole; name: string }) {
  const links = role === "STUDENT" ? studentLinks : staffLinks;
  return (
    <aside className="bg-[#102a43] text-white lg:min-h-screen lg:w-72 lg:shrink-0">
      <div className="p-4 lg:p-6">
        <Brand />
        <div className="mt-5 border-t border-white/15 pt-4">
          <p className="truncate text-sm font-bold">{name}</p>
          <p className="mt-1 text-xs text-[#c9d9e5]">
            {role.replaceAll("_", " ")}
          </p>
        </div>
      </div>
      <nav
        aria-label="Portal navigation"
        className="flex gap-1 overflow-x-auto px-3 pb-4 lg:block lg:space-y-1"
      >
        {links.map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className="block rounded-md px-3 py-2.5 text-sm font-semibold whitespace-nowrap text-[#e8f1f8] hover:bg-white/10"
          >
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
