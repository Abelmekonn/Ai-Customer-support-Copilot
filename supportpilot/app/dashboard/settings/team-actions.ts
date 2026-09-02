"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/data";
import { canInviteMembers } from "@/lib/auth/roles";
import { getBillingSnapshot } from "@/lib/billing/usage";
import { createClient } from "@/lib/supabase/server";
import {
  inviteExpiresAt,
  inviteUrl,
  newInviteToken,
  normalizeInviteEmail,
  sendInviteEmail,
} from "@/lib/team/invites";
import type { UserRole } from "@/lib/types";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "manager", "agent"]),
});

export type TeamActionState = { error?: string; success?: string };

export async function inviteMemberAction(
  _prev: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const user = await requireUser();
  if (!canInviteMembers(user.role)) {
    return { error: "Only admins can invite teammates." };
  }

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: "Enter a work email and choose a role." };
  }

  const email = normalizeInviteEmail(parsed.data.email);
  const role = parsed.data.role as UserRole;
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("users")
    .select("id, email")
    .eq("organization_id", user.organization_id);

  if ((members ?? []).some((member) => member.email.toLowerCase() === email)) {
    return { error: "That person is already on this team." };
  }

  const { data: pending } = await supabase
    .from("invites")
    .select("id")
    .eq("organization_id", user.organization_id)
    .eq("email", email)
    .is("accepted_at", null)
    .maybeSingle();

  if (!pending) {
    const billing = await getBillingSnapshot(user.organization_id);
    if (billing.seats.blocked) {
      return {
        error: `This workspace has used all ${billing.seats.seats} seats on ${billing.plan.name}. Upgrade in Settings or revoke a pending invite.`,
      };
    }
  }

  const { data: organization } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", user.organization_id)
    .single();

  const token = newInviteToken();
  const expiresAt = inviteExpiresAt().toISOString();

  if (pending) {
    const { error } = await supabase
      .from("invites")
      .update({
        token,
        role,
        expires_at: expiresAt,
        invited_by: user.id,
      })
      .eq("id", pending.id);
    if (error) return { error: "Could not refresh that invite. Try again." };
  } else {
    const { error } = await supabase.from("invites").insert({
      organization_id: user.organization_id,
      email,
      role,
      token,
      invited_by: user.id,
      expires_at: expiresAt,
    });
    if (error) return { error: "Could not create the invite. Try again." };
  }

  const acceptUrl = inviteUrl(token);
  const mailed = await sendInviteEmail({
    to: email,
    organizationName: organization?.name ?? "your workspace",
    role,
    acceptUrl,
  });

  revalidatePath("/dashboard/settings");
  return {
    success: mailed.sent
      ? `Invite sent to ${email}.`
      : `Invite created for ${email}. Copy the link from the pending list — outbound email isn’t configured.`,
  };
}

export async function revokeInviteAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!canInviteMembers(user.role)) return;

  const inviteId = String(formData.get("inviteId") ?? "");
  if (!inviteId) return;

  const supabase = await createClient();
  await supabase
    .from("invites")
    .delete()
    .eq("id", inviteId)
    .eq("organization_id", user.organization_id)
    .is("accepted_at", null);

  revalidatePath("/dashboard/settings");
}
