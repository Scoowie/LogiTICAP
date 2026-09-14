import Link from "next/link";
import { clsx } from "clsx";
import { ArrowRight, Compass } from "lucide-react";

export function Button({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  return (
    <Link
      className={clsx(
        "hex-btn",
        variant === "primary" ? "" : "hex-btn--secondary",
        className,
      )}
      href={href}
    >
      {children}
      <ArrowRight aria-hidden="true" className="size-4 stroke-[3]" />
    </Link>
  );
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("card p-5 sm:p-7", className)}>{children}</section>
  );
}

export function Status({
  children,
  tone = "info",
}: {
  children: React.ReactNode;
  tone?: "info" | "success" | "warning";
}) {
  const styles = {
    info: "border-[#286f9c] bg-[#d8eef7] text-[#184d6b]",
    success: "border-[#3f6848] bg-[#e0eadf] text-[#294a31]",
    warning: "border-[#bb7a22] bg-[#f3e4c6] text-[#70430d]",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-[.1em] uppercase",
        styles[tone],
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="hex-diagram rounded-xl border border-[#b69a5e] bg-[#fbf6e8] p-8 text-center shadow-[0_12px_35px_rgba(33,29,24,.14)] sm:p-12">
      <Compass aria-hidden="true" className="mx-auto mb-4 size-11 stroke-[1.5] text-[#806837]" />
      <h2 className="text-xl font-semibold tracking-wide text-[#4c3a27]">
        {title}
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm text-[#615848]">
        {children}
      </p>
    </div>
  );
}
