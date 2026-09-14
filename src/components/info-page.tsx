import { Card } from "@/components/ui";

export function InfoPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div className="container-page py-12 sm:py-20">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="hex-display mt-5 max-w-4xl text-4xl sm:text-6xl">
        {title}
      </h1>
      <p className="mt-6 max-w-3xl border-l-2 border-[#b69a5e] bg-[#f3ead2]/70 p-4 text-lg leading-relaxed text-[#4c3a27]">
        {intro}
      </p>
      <div className="mt-10 grid gap-8">{children}</div>
    </div>
  );
}

export function TextCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <h2 className="text-xl font-semibold tracking-wide text-[#4c3a27]">
        {title}
      </h2>
      <div className="mt-3 text-sm leading-6 text-[#615848]">{children}</div>
    </Card>
  );
}
