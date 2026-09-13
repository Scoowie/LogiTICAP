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
    <div className="container-page py-12 sm:py-16">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-2 max-w-3xl text-3xl font-black tracking-tight text-[#102a43] sm:text-4xl">
        {title}
      </h1>
      <p className="muted mt-4 max-w-3xl text-lg leading-8">{intro}</p>
      <div className="mt-8 grid gap-5">{children}</div>
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
      <h2 className="text-lg font-bold text-[#183f63]">{title}</h2>
      <div className="muted mt-2 text-sm leading-6">{children}</div>
    </Card>
  );
}
