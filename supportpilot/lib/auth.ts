import { createClient } from "@/lib/supabase/server";
import type { AppUser } from "@/lib/types";
import { redirect } from "next/navigation";
import { getCurrentUser as getProfile, requireUser as requireProfile } from "@/lib/data";

export async function getCurrentUser(): Promise<AppUser | null> {
  return getProfile();
}

export async function requireUser(): Promise<AppUser> {
  const user = await requireProfile();
  return user;
}

export async function requireSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return user;
}
