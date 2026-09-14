"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui";

const links = [
  ["Services", "/services"],
  ["Photoshoot", "/photoshoot"],
  ["Schedule", "/schedule"],
  ["Policies", "/policies"],
  ["FAQ", "/faq"],
  ["Contact", "/contact"],
];

export function PublicHeader() {
  const pathname = usePathname();
  return (
    <header className="relative z-40 border-b border-[#b69a5e] bg-[#292923]/98 shadow-[0_6px_24px_rgba(33,29,24,.18)]">
      <div className="container-page flex min-h-20 items-center justify-between gap-5 py-3">
        <Brand />
        <nav aria-label="Public navigation" className="hidden items-center gap-1 lg:flex">
          {links.map(([label, href]) => (
            <Link
              className={`relative min-h-11 px-3 py-3 font-[Cinzel] text-[.7rem] font-semibold tracking-[.09em] whitespace-nowrap text-[#f3ead2] uppercase transition-colors duration-150 hover:text-[#dbc98f] ${pathname === href ? "text-[#dbc98f] after:absolute after:right-3 after:bottom-1 after:left-3 after:h-px after:bg-[#dbc98f]" : ""}`}
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
        <Button href="/sign-in" variant="secondary" className="hidden lg:inline-flex">
          Sign in
        </Button>
        <details className="relative lg:hidden">
          <summary className="grid size-11 cursor-pointer list-none place-items-center rounded-lg border border-[#b69a5e] bg-[#4c3a27] text-[#f3ead2]">
            <Menu aria-hidden="true" className="size-5" />
            <span className="sr-only">Open navigation</span>
          </summary>
          <nav aria-label="Mobile navigation" className="absolute top-14 right-0 grid w-72 gap-1 rounded-xl border border-[#b69a5e] bg-[#292923] p-3 shadow-[0_18px_45px_rgba(15,18,16,.4)]">
            {links.map(([label, href]) => (
              <Link
                className={`min-h-11 rounded-md border-l-2 px-4 py-3 font-[Cinzel] text-xs font-semibold tracking-wider text-[#f3ead2] uppercase ${pathname === href ? "border-[#dbc98f] bg-[#4c3a27] text-[#dbc98f]" : "border-transparent hover:bg-[#4c3a27]"}`}
                key={href}
                href={href}
                aria-current={pathname === href ? "page" : undefined}
              >
                {label}
              </Link>
            ))}
            <Button href="/sign-in">Sign in</Button>
          </nav>
        </details>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="mt-20 border-t border-[#b69a5e] bg-[#292923] text-[#f3ead2]">
      <div className="container-page flex flex-col gap-4 py-10 text-sm sm:flex-row sm:items-end sm:justify-between">
        <p>© TICAP Logistics Management System</p>
        <p className="border-l border-[#b69a5e] pl-3 font-[Cinzel] text-xs tracking-wider text-[#dbc98f] uppercase">
          Official college organization portal
        </p>
      </div>
    </footer>
  );
}
