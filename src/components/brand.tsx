import Link from "next/link";

export function Brand() {
  return (
    <Link
      href="/"
      className="group flex items-center gap-3"
      aria-label="Unofficial TICAP Logistics portal home"
    >
      <span
        className="relative grid size-12 place-items-center rounded-full border border-[#dbc98f] bg-[#153f6f] font-[Cinzel] text-xs font-bold tracking-wider text-[#f3ead2] shadow-[0_5px_15px_rgba(33,29,24,.24),inset_0_0_0_3px_#153f6f,inset_0_0_0_4px_#b69a5e] transition-shadow duration-200 group-hover:shadow-[0_0_18px_rgba(182,154,94,.4)]"
        aria-hidden="true"
      >
        TL
      </span>
      <span>
        <span className="block font-[Cinzel] text-lg leading-none font-semibold tracking-[.04em] text-[#f3ead2] uppercase">
          TICAP Logistics
        </span>
        <span className="mt-1 block max-w-48 text-[.6rem] leading-tight font-semibold tracking-[.14em] text-[#dbc98f] uppercase">
          Unofficial logistics portal
        </span>
      </span>
    </Link>
  );
}
