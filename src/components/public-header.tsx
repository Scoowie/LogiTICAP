import Link from "next/link";
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
  return (
    <header className="border-b border-[#2b587b] bg-[#102a43]">
      <div className="container-page flex min-h-20 flex-wrap items-center justify-between gap-4 py-3">
        <Brand />
        <nav
          aria-label="Public navigation"
          className="order-3 flex w-full gap-1 overflow-x-auto pb-1 lg:order-2 lg:w-auto lg:pb-0"
        >
          {links.map(([label, href]) => (
            <Link
              className="rounded px-3 py-2 text-sm font-semibold whitespace-nowrap text-[#e9f1f7] hover:bg-white/10"
              key={href}
              href={href}
            >
              {label}
            </Link>
          ))}
        </nav>
        <Button
          href="/sign-in"
          variant="secondary"
          className="order-2 lg:order-3"
        >
          Sign in
        </Button>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="mt-16 border-t border-[#c5d0da] bg-white">
      <div className="container-page flex flex-col gap-2 py-8 text-sm text-[#5d6b78] sm:flex-row sm:justify-between">
        <p>© TICAP Logistics Management System</p>
        <p>Official college organization logistics portal</p>
      </div>
    </footer>
  );
}
