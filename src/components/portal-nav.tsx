"use client";

import Link from "next/link";
import {
  Bell,
  BookOpenCheck,
  Boxes,
  CalendarRange,
  Camera,
  CircleHelp,
  Clock3,
  Crown,
  FileChartColumn,
  LayoutDashboard,
  Megaphone,
  ScanLine,
  ScrollText,
  Settings2,
  ShieldCheck,
  LogOut,
  UserRound,
  UserRoundCog,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/brand";
import { signOut } from "@/app/auth/actions";
import {
  hasPermission,
  type AppRole,
  type Permission,
} from "@/lib/auth/permissions";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: Permission;
};

const studentLinks: NavItem[] = [
  { label: "Dashboard", href: "/portal", icon: LayoutDashboard },
  { label: "My Profile", href: "/portal/profile", icon: UserRound },
  { label: "My Thesis Group", href: "/portal/group", icon: UsersRound },
  { label: "Event Appointments", href: "/portal/booking", icon: Camera },
  { label: "Notifications", href: "/portal/notifications", icon: Bell },
  { label: "Logistics Services", href: "/portal/services", icon: Boxes },
  { label: "Help", href: "/portal/help", icon: CircleHelp },
];

const staffLinks: NavItem[] = [
  { label: "Operations Dashboard", href: "/staff", icon: LayoutDashboard },
  {
    label: "Events",
    href: "/staff/events",
    icon: Camera,
    permission: "events:manage",
  },
  {
    label: "Dates & Time Slots",
    href: "/staff/schedule",
    icon: Clock3,
    permission: "events:manage",
  },
  {
    label: "Bookings",
    href: "/staff/bookings",
    icon: BookOpenCheck,
    permission: "bookings:manage",
  },
  {
    label: "Thesis Groups",
    href: "/staff/groups",
    icon: UsersRound,
    permission: "bookings:manage",
  },
  {
    label: "Check-In",
    href: "/staff/check-in",
    icon: ScanLine,
    permission: "checkin:manage",
  },
  {
    label: "Staff Assignments",
    href: "/staff/assignments",
    icon: CalendarRange,
    permission: "assignments:manage",
  },
  {
    label: "Announcements",
    href: "/staff/announcements",
    icon: Megaphone,
    permission: "announcements:manage",
  },
  {
    label: "Reports & Exports",
    href: "/staff/reports",
    icon: FileChartColumn,
    permission: "exports:standard",
  },
  {
    label: "Users & Roles",
    href: "/staff/users",
    icon: UserRoundCog,
    permission: "users:manage",
  },
  {
    label: "Audit Logs",
    href: "/staff/audit",
    icon: ScrollText,
    permission: "audit:view",
  },
  {
    label: "System Settings",
    href: "/staff/settings",
    icon: Settings2,
    permission: "settings:manage",
  },
];

const rolePresentation: Record<
  AppRole,
  { label: string; descriptor: string; icon: LucideIcon; className: string }
> = {
  SUPERADMIN: {
    label: "Superadmin",
    descriptor: "System authority",
    icon: Crown,
    className: "hex-role-card--superadmin",
  },
  ADMIN: {
    label: "Administrator",
    descriptor: "Operations command",
    icon: ShieldCheck,
    className: "hex-role-card--admin",
  },
  LOGISTICS_MEMBER: {
    label: "Logistics Member",
    descriptor: "Field operations",
    icon: Boxes,
    className: "hex-role-card--member",
  },
  STUDENT: {
    label: "Student",
    descriptor: "Student services",
    icon: UserRound,
    className: "hex-role-card--student",
  },
};

export function PortalNav({ role, name }: { role: AppRole; name: string }) {
  const links =
    role === "STUDENT"
      ? studentLinks
      : staffLinks.filter(
          (link) => !link.permission || hasPermission(role, link.permission),
        );
  const pathname = usePathname();
  const presentation = rolePresentation[role];
  const RoleIcon = presentation.icon;

  return (
    <aside className="hex-sidebar lg:min-h-screen lg:w-72 lg:shrink-0">
      <div className="relative p-4 lg:sticky lg:top-0 lg:p-5">
        <Brand />
        <div
          className={`hex-role-card mt-6 ${presentation.className}`}
          aria-label={`${presentation.label} account`}
        >
          <span className="hex-role-seal" aria-hidden="true">
            <RoleIcon className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-[Cinzel] text-sm font-semibold text-[#f3ead2]">
              {name}
            </span>
            <span className="mt-1 block text-[.65rem] font-semibold tracking-[.14em] text-[#dbc98f] uppercase">
              {presentation.label} · {presentation.descriptor}
            </span>
          </span>
        </div>
        <p className="mt-6 hidden px-3 text-[.62rem] font-bold tracking-[.18em] text-[#dbc98f]/70 uppercase lg:block">
          Logistics registry
        </p>
        <nav
          aria-label="Portal navigation"
          className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible"
        >
          {links.map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`hex-portal-link ${active ? "hex-portal-link--active" : ""}`}
              >
                <Icon aria-hidden="true" className="size-4 shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <form action={signOut} className="mt-4">
          <button type="submit" className="hex-portal-link min-h-11 w-full">
            <LogOut aria-hidden="true" className="size-4 shrink-0" />
            <span>Sign out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
