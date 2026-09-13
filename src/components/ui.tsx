import Link from "next/link";
import { clsx } from "clsx";

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
        "inline-flex min-h-11 items-center justify-center rounded-md px-5 py-2.5 text-sm font-bold transition",
        variant === "primary"
          ? "bg-[#183f63] text-white hover:bg-[#102a43]"
          : "border border-[#9eacb9] bg-white text-[#183f63] hover:bg-[#e8f1f8]",
        className,
      )}
      href={href}
    >
      {children}
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
    <section className={clsx("card p-5 sm:p-6", className)}>{children}</section>
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
    info: "bg-[#e8f1f8] text-[#183f63]",
    success: "bg-emerald-50 text-emerald-800",
    warning: "bg-amber-50 text-amber-900",
  };
  return (
    <span
      className={clsx(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-bold",
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
    <div className="rounded-lg border border-dashed border-[#b9c5d0] bg-[#f8fafc] p-7 text-center">
      <h2 className="text-lg font-bold text-[#183f63]">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-[#5d6b78]">{children}</p>
    </div>
  );
}
