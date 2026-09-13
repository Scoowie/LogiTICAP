import Link from "next/link";

export function Brand() {
  return (
    <Link
      href="/"
      className="flex items-center gap-3"
      aria-label="TICAP Logistics home"
    >
      <span
        className="grid size-11 place-items-center rounded-md border-2 border-[#d6a72d] bg-[#183f63] text-xs font-black text-white"
        aria-hidden="true"
      >
        TL
      </span>
      <span>
        <span className="block text-base font-black tracking-tight text-white">
          TICAP Logistics
        </span>
        <span className="block text-[.68rem] font-semibold tracking-wide text-[#d9e6ef]">
          Centralized Scheduling and Logistics Services
        </span>
      </span>
    </Link>
  );
}
