"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getPublicInvite } from "@/lib/team/invites";
import { redirect } from "next/navigation";
import { z } from "zod";

const acceptSchema = z.object({
  token: z.string().min(8),
  fullName: z.string().min(2).max(80),
  password: z.string().min(8),
});

export type AcceptInviteState = {
  error?: string;
  fields?: { fullName?: string };
};

async function confirmEmail(userId: string) {
  const admin = createAdminClient();
  await admin.auth.admin.updateUserById(userId, { email_confirm: true });
}

export async function acceptInviteAction(
  _prev: AcceptInviteState,
  formData: FormData,
): Promise<AcceptInviteState> {
  const parsed = acceptSchema.safeParse({
    token: formData.get("token"),
    fullName: formData.get("fullName"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: "Name must be at least 2 characters and password at least 8.",
      fields: { fullName: String(formData.get("fullName") ?? "") },
    };
  }

  const invite = await getPublicInvite(parsed.data.token);
  if (!invite) {
    return { error: "This invite is invalid or has expired. Ask an admin to send a new one." };
  }

  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email: invite.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        full_name: parsed.data.fullName,
        invite_token: parsed.data.token,
      },
    },
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("already") || message.includes("registered")) {
      return {
        error: "This email already has a SupportPilot account. Use a different work email.",
        fields: { fullName: parsed.data.fullName },
      };
    }
    if (message.includes("expired") || message.includes("invalid")) {
      return { error: "This invite is invalid or has expired. Ask an admin to send a new one." };
    }
    return {
      error: "Could not create the account. Try again or ask an admin for a new invite.",
      fields: { fullName: parsed.data.fullName },
    };
  }

  if (data.user && !data.session) {
    await confirmEmail(data.user.id);
  }

  if (!data.session) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: invite.email,
      password: parsed.data.password,
    });
    if (signInError) {
      return {
        error: "Account created, but sign-in failed. Go to the login page.",
        fields: { fullName: parsed.data.fullName },
      };
    }
  }

  redirect("/dashboard");
}
