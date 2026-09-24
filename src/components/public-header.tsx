import Link from "next/link";
import { Menu } from "lucide-react";
import { Brand } from "@/components/brand";

const links = [
  ["Services", "/services"],
  ["Photoshoot", "/photoshoot"],
  ["Schedule", "/schedule"],
  ["Policies", "/policies"],
  ["Privacy", "/privacy"],
  ["FAQ", "/faq"],
  ["Contact", "/contact"],
];

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#b69a5e] bg-[#292923]/98 shadow-[0_6px_24px_rgba(33,29,24,.18)] backdrop-blur-md">
      <div className="container-page flex min-h-20 items-center gap-4 py-3">
        <Brand />
        <nav
          aria-label="Public navigation"
          className="ml-auto hidden items-center gap-0.5 rounded-lg border border-[#806837]/70 bg-[#211d18]/35 p-1 xl:flex"
        >
          {links.map(([label, href]) => (
            <Link className="hex-header-link" key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="ml-2 hidden items-center gap-2 xl:flex">
          <Link
            href="/login"
            className="hex-btn hex-btn--secondary hex-header-action"
          >
            Log in
          </Link>
          <Link
            href="/onboarding"
            className="hex-btn hex-header-action hex-header-action--primary"
          >
            Create account
          </Link>
        </div>
        <details className="group relative ml-auto xl:hidden">
          <summary className="grid size-11 cursor-pointer list-none place-items-center rounded-lg border border-[#b69a5e] bg-[#4c3a27] text-[#f3ead2] shadow-[inset_0_1px_0_rgba(255,255,255,.12)] transition-colors hover:bg-[#765636] [&::-webkit-details-marker]:hidden">
            <Menu aria-hidden="true" className="size-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </summary>
          <nav
            aria-label="Mobile navigation"
            className="absolute top-14 right-0 grid w-[min(20rem,calc(100vw-1.25rem))] gap-1 rounded-xl border border-[#b69a5e] bg-[#292923] p-3 shadow-[0_18px_45px_rgba(15,18,16,.4)]"
          >
            {links.map(([label, href]) => (
              <Link
                className="hex-header-link w-full justify-start"
                key={href}
                href={href}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/login"
              className="hex-btn hex-btn--secondary hex-header-action mt-1 w-full"
            >
              Log in
            </Link>
            <Link
              href="/onboarding"
              className="hex-btn hex-header-action hex-header-action--primary w-full"
            >
              Create account
            </Link>
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
        <div>
          <p>© TICAP Logistics Management System</p>
          <nav
            aria-label="Footer policies"
            className="mt-3 flex flex-wrap gap-x-4 gap-y-2"
          >
            <Link
              href="/privacy"
              className="text-[#dbc98f] underline-offset-4 hover:underline"
            >
              Privacy notice
            </Link>
            <Link
              href="/policies"
              className="text-[#dbc98f] underline-offset-4 hover:underline"
            >
              Booking policies
            </Link>
          </nav>
        </div>
        <p className="border-l border-[#b69a5e] pl-3 font-[Cinzel] text-xs tracking-wider text-[#dbc98f] uppercase">
          Unofficial TICAP Logistics portal
        </p>
      </div>
    </footer>
  );
}
