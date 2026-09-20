import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/auth/flow";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const query = await searchParams;
  const destination = new URLSearchParams();
  if (query.next) destination.set("next", safeNextPath(query.next));
  if (query["signed-out"]) destination.set("signed-out", "1");
  if (query.error === "callback") destination.set("error", "callback");
  redirect(`/login${destination.size ? `?${destination}` : ""}`);
}
