import { createAdminClient } from "@/lib/supabase/admin";
import { threadLookupIds } from "@/lib/channels/email/thread";
import { stripReplyPrefix } from "@/lib/channels/email/parse";

export type StoredAttachmentRef = {
  filename: string;
  contentType: string;
  filePath: string;
};

export type IngestEmailPayload = {
  fromEmail: string;
  fromName: string;
  subject: string;
  text: string;
  messageId: string;
  inReplyTo: string | null;
  references: string[];
  attachments: StoredAttachmentRef[];
};

export async function ingestInboundEmail(organizationId: string, payload: IngestEmailPayload) {
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("messages")
    .select("id, ticket_id")
    .eq("organization_id", organizationId)
    .eq("email_message_id", payload.messageId)
    .maybeSingle();

  if (existing) {
    return { ticketId: existing.ticket_id as string, messageId: existing.id as string, duplicate: true };
  }

  const customerId = await findOrCreateCustomer(organizationId, payload.fromEmail, payload.fromName);
  const ticketId =
    (await findThreadTicket(organizationId, payload)) ??
    (await createTicket(organizationId, customerId, payload));

  const { data: message, error: messageError } = await admin
    .from("messages")
    .insert({
      ticket_id: ticketId,
      organization_id: organizationId,
      sender_type: "customer",
      content: payload.text,
      email_message_id: payload.messageId,
      email_in_reply_to: payload.inReplyTo,
    })
    .select("id")
    .single();

  if (messageError || !message) {
    if (messageError?.code === "23505") {
      const { data: again } = await admin
        .from("messages")
        .select("id, ticket_id")
        .eq("organization_id", organizationId)
        .eq("email_message_id", payload.messageId)
        .maybeSingle();
      if (again) {
        return { ticketId: again.ticket_id as string, messageId: again.id as string, duplicate: true };
      }
    }
    throw new Error(messageError?.message ?? "Could not store inbound message.");
  }

  await admin
    .from("tickets")
    .update({ status: "open" })
    .eq("id", ticketId)
    .eq("organization_id", organizationId)
    .neq("status", "open");

  if (payload.attachments.length > 0) {
    const { error: attachmentError } = await admin.from("message_attachments").insert(
      payload.attachments.map((attachment) => ({
        organization_id: organizationId,
        ticket_id: ticketId,
        message_id: message.id,
        file_name: attachment.filename,
        file_path: attachment.filePath,
        content_type: attachment.contentType,
      })),
    );
    if (attachmentError) throw new Error(attachmentError.message);
  }

  return { ticketId, messageId: message.id as string, duplicate: false };
}

async function findOrCreateCustomer(organizationId: string, email: string, name: string) {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("customers")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("email", email)
    .maybeSingle();

  if (existing) return existing.id as string;

  const { data, error } = await admin
    .from("customers")
    .insert({
      organization_id: organizationId,
      email,
      name: name || email.split("@")[0] || "Customer",
    })
    .select("id")
    .single();

  if (data) return data.id as string;

  if (error?.code === "23505") {
    const { data: raced } = await admin
      .from("customers")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("email", email)
      .single();
    if (raced) return raced.id as string;
  }

  throw new Error(error?.message ?? "Could not create customer.");
}

async function findThreadTicket(organizationId: string, payload: IngestEmailPayload) {
  const ids = threadLookupIds(payload);
  if (ids.length === 0) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("messages")
    .select("ticket_id")
    .eq("organization_id", organizationId)
    .in("email_message_id", ids)
    .limit(1)
    .maybeSingle();

  return (data?.ticket_id as string | undefined) ?? null;
}

async function createTicket(organizationId: string, customerId: string, payload: IngestEmailPayload) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tickets")
    .insert({
      organization_id: organizationId,
      customer_id: customerId,
      subject: stripReplyPrefix(payload.subject),
      status: "open",
      priority: "medium",
      last_message_preview: payload.text.slice(0, 140),
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Could not create ticket.");
  return data.id as string;
}
