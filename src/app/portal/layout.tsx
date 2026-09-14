import { PortalNav } from "@/components/portal-nav";
import { requireActor } from "@/lib/auth/session";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await requireActor();
  return (
    <div className="hex-workspace min-h-screen lg:flex">
      <PortalNav role={actor.role} name={actor.fullName} />
      <main
        id="main-content"
        className="hex-workspace-main min-w-0 flex-1 p-4 pb-12 sm:p-8 lg:p-10"
      >
        {children}
      </main>
    </div>
  );
}
