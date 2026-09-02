import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export type ChannelAccount = {
  id: string;
  organization_id: string;
  provider: string;
  inbound_address: string;
  webhook_secret: string;
};

export function inboundMailDomain() {
  return process.env.INBOUND_MAIL_DOMAIN?.trim() || "inbound.supportpilot.local";
}

export function inboundAddressForSlug(slug: string) {
  return `${slug}@${inboundMailDomain()}`.toLowerCase();
}

export function inboundWebhookUrl() {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";
  return `${site}/api/channels/email/inbound`;
}

export function newWebhookSecret() {
  return `inbound_${randomBytes(24).toString("hex")}`;
}

export async function getChannelAccount(organizationId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("channel_accounts")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ChannelAccount | null) ?? null;
}

export async function getChannelAccountByAddress(inboundAddress: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("channel_accounts")
    .select("*")
    .eq("inbound_address", inboundAddress.toLowerCase())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ChannelAccount | null) ?? null;
}

export async function ensureChannelAccount(input: {
  organizationId: string;
  slug: string;
}) {
  const existing = await getChannelAccount(input.organizationId);
  if (existing) return existing;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("channel_accounts")
    .insert({
      organization_id: input.organizationId,
      inbound_address: inboundAddressForSlug(input.slug),
      webhook_secret: newWebhookSecret(),
      provider: "inbound_webhook",
    })
    .select("*")
    .single();

  if (error) {
    const raced = await getChannelAccount(input.organizationId);
    if (raced) return raced;
    throw new Error(error.message);
  }

  return data as ChannelAccount;
}

export async function rotateWebhookSecret(organizationId: string) {
  const admin = createAdminClient();
  const webhookSecret = newWebhookSecret();
  const { data, error } = await admin
    .from("channel_accounts")
    .update({ webhook_secret: webhookSecret })
    .eq("organization_id", organizationId)
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not rotate webhook secret.");
  return data as ChannelAccount;
}
