import { PortalNav } from "@/components/portal-nav";
import { requireActor } from "@/lib/auth/session";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await requireActor();
  return (
    <div className="min-h-screen lg:flex">
      <PortalNav role={actor.role} name={actor.fullName} />
      <main id="main-content" className="min-w-0 flex-1 p-4 sm:p-7 lg:p-9">
        {children}
      </main>
    </div>
  );
}
