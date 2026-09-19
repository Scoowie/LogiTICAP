"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut({ scope: "global" });

  if (error) throw new Error("Unable to sign out. Please try again.");

  redirect("/sign-in?signed-out=1");
}
