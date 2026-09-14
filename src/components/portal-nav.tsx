"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/brand";
import type { AppRole } from "@/lib/auth/permissions";

const studentLinks = [
  ["Dashboard", "/portal"], ["My Profile", "/portal/profile"],
  ["My Thesis Group", "/portal/group"], ["My Photoshoot Booking", "/portal/booking"],
  ["Notifications", "/portal/notifications"], ["Logistics Services", "/portal/services"],
  ["Help", "/portal/help"],
];
const staffLinks = [
  ["Operations dashboard", "/staff"], ["Photoshoot Events", "/staff/events"],
  ["Dates & Time Slots", "/staff/schedule"], ["Bookings", "/staff/bookings"],
  ["Thesis Groups", "/staff/groups"], ["Check-In", "/staff/check-in"],
  ["Staff Assignments", "/staff/assignments"], ["Announcements", "/staff/announcements"],
  ["Reports & Exports", "/staff/reports"], ["Users & Roles", "/staff/users"],
  ["Audit Logs", "/staff/audit"], ["System Settings", "/staff/settings"],
];

export function PortalNav({ role, name }: { role: AppRole; name: string }) {
  const links = role === "STUDENT" ? studentLinks : staffLinks;
  const pathname = usePathname();
  return (
    <aside className="hex-conservatory border-b border-[#806837] text-[#f3ead2] lg:min-h-screen lg:w-72 lg:shrink-0 lg:border-r lg:border-b-0">
      <div className="p-4 lg:p-5">
        <Brand />
        <div className="mt-6 rounded-lg border border-[#806837] bg-[#292923]/75 p-3 shadow-[inset_0_1px_0_rgba(219,201,143,.18)]">
          <p className="truncate font-[Cinzel] text-sm font-semibold text-[#f3ead2]">{name}</p>
          <p className="mt-1 text-xs font-semibold tracking-[.12em] text-[#dbc98f] uppercase">{role.replaceAll("_", " ")}</p>
        </div>
      </div>
      <nav aria-label="Portal navigation" className="flex gap-2 overflow-x-auto px-3 pb-4 lg:block lg:space-y-1">
        {links.map(([label, href]) => (
          <Link
            key={href}
            href={href}
            aria-current={pathname === href ? "page" : undefined}
            className={`block min-h-11 rounded-md border-l-2 px-3 py-2.5 font-[Cinzel] text-[.69rem] font-semibold tracking-[.07em] whitespace-nowrap uppercase transition-colors duration-150 ${pathname === href ? "border-[#dbc98f] bg-[#4c3a27] text-[#dbc98f] shadow-[inset_0_0_0_1px_rgba(219,201,143,.12)]" : "border-transparent text-[#f3ead2] hover:bg-[#4c3a27]/75 hover:text-[#dbc98f]"}`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
