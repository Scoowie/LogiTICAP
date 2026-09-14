import { redirect } from "next/navigation";
import { PortalNav } from "@/components/portal-nav";
import { requireActor } from "@/lib/auth/session";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await requireActor();
  if (actor.role === "STUDENT") redirect("/portal");
  return (
    <div className="min-h-screen bg-[#FFFDF5] lg:flex">
      <PortalNav role={actor.role} name={actor.fullName} />
      <main
        id="main-content"
        className="neo-grid min-w-0 flex-1 p-4 pb-12 sm:p-8 lg:p-10"
      >
        {children}
      </main>
    </div>
  );
}
