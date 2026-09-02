import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { outboundConfig } from "@/lib/channels/email/config";
import type { UserRole } from "@/lib/types";

export const INVITE_TTL_DAYS = 14;

export type Invite = {
  id: string;
  organization_id: string;
  email: string;
  role: UserRole;
  token: string;
  invited_by: string;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
};

export type PublicInvite = {
  email: string;
  role: UserRole;
  organizationName: string;
  expiresAt: string;
};

export function newInviteToken() {
  return `inv_${randomBytes(24).toString("hex")}`;
}

export function inviteExpiresAt(from = new Date()) {
  return new Date(from.getTime() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export function inviteUrl(token: string) {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";
  return `${site}/invite/${token}`;
}

export function normalizeInviteEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function getPublicInvite(token: string): Promise<PublicInvite | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("invites")
    .select("email, role, expires_at, accepted_at, organization_id, organizations(name)")
    .eq("token", token)
    .maybeSingle();

  if (error || !data) return null;
  if (data.accepted_at) return null;
  if (new Date(data.expires_at).getTime() <= Date.now()) return null;

  const organization = data.organizations as { name?: string } | { name?: string }[] | null;
  const organizationName = Array.isArray(organization)
    ? organization[0]?.name
    : organization?.name;

  return {
    email: data.email as string,
    role: data.role as UserRole,
    organizationName: organizationName ?? "a SupportPilot workspace",
    expiresAt: data.expires_at as string,
  };
}

export async function sendInviteEmail(input: {
  to: string;
  organizationName: string;
  role: UserRole;
  acceptUrl: string;
}) {
  const config = outboundConfig();
  if (!config.configured) {
    return { sent: false as const };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.from,
      to: [input.to],
      subject: `Join ${input.organizationName} on SupportPilot`,
      text: [
        `You're invited to ${input.organizationName} as ${input.role}.`,
        "Create your account with this link (it expires in 14 days):",
        input.acceptUrl,
        "",
        "SupportPilot is a copilot for human agents. You review and send every reply.",
      ].join("\n"),
    }),
  });

  if (!response.ok) {
    return { sent: false as const };
  }
  return { sent: true as const };
}
