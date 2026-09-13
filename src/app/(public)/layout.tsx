import { PublicFooter, PublicHeader } from "@/components/public-header";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PublicHeader />
      <main id="main-content">{children}</main>
      <PublicFooter />
    </>
  );
}
