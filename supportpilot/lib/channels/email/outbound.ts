import { getChannelAccount, inboundMailDomain } from "@/lib/channels/email/account";
import { outboundConfig } from "@/lib/channels/email/config";
import { buildThreadHeaders, newOutboundMessageId, replySubject } from "@/lib/channels/email/headers";
import { sendWithResend, type OutboundSendResult } from "@/lib/channels/email/send";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordUsage } from "@/lib/usage/record";

export type SendEmailPayload = {
  messageId: string;
};

export async function deliverOutboundMessage(
  organizationId: string,
  messageId: string,
): Promise<OutboundSendResult> {
  const admin = createAdminClient();
  const { data: message, error: messageError } = await admin
    .from("messages")
    .select("*")
    .eq("id", messageId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (messageError || !message) {
    return { ok: false, error: "The reply could not be found. Refresh the ticket and try again." };
  }

  if (message.is_internal) {
    return { ok: false, error: "Internal notes are not emailed." };
  }

  if (message.email_provider_id) {
    return { ok: true, providerId: message.email_provider_id as string };
  }

  const config = outboundConfig();
  if (!config.configured) {
    return {
      ok: false,
      error: "Outbound email isn’t configured. Add RESEND_API_KEY and RESEND_FROM on the server, then retry this reply.",
    };
  }

  const { data: ticket } = await admin
    .from("tickets")
    .select("id, subject, customer_id")
    .eq("id", message.ticket_id)
    .eq("organization_id", organizationId)
    .single();

  if (!ticket) {
    return { ok: false, error: "The ticket could not be found. Refresh and try again." };
  }

  const { data: customer } = await admin
    .from("customers")
    .select("email, name")
    .eq("id", ticket.customer_id)
    .eq("organization_id", organizationId)
    .single();

  if (!customer?.email) {
    return { ok: false, error: "This ticket has no customer email, so the reply can’t be sent." };
  }

  const channel = await getChannelAccount(organizationId);
  const replyTo = channel?.inbound_address;
  if (!replyTo) {
    return {
      ok: false,
      error: "This workspace has no inbound address yet. Open Settings, then retry this reply.",
    };
  }

  const { data: prior } = await admin
    .from("messages")
    .select("email_message_id, created_at")
    .eq("ticket_id", ticket.id)
    .eq("organization_id", organizationId)
    .eq("is_internal", false)
    .not("email_message_id", "is", null)
    .neq("id", messageId)
    .order("created_at", { ascending: true });

  const ourMessageId =
    (message.email_message_id as string | null) || newOutboundMessageId(inboundMailDomain());
  const headers = buildThreadHeaders({
    ourMessageId,
    previousIds: (prior ?? []).map((row) => String(row.email_message_id)),
  });

  const result = await sendWithResend({
    apiKey: config.apiKey,
    from: config.from,
    to: customer.email,
    replyTo,
    subject: replySubject(String(ticket.subject)),
    text: String(message.content),
    idempotencyKey: messageId,
    headers: {
      "Message-ID": headers.headerMessageId,
      ...(headers.headerInReplyTo ? { "In-Reply-To": headers.headerInReplyTo } : {}),
      ...(headers.headerReferences ? { References: headers.headerReferences } : {}),
    },
  });

  if (!result.ok) {
    await admin
      .from("messages")
      .update({
        send_status: result.retryable ? "queued" : "failed",
        send_error: result.error,
        email_message_id: ourMessageId,
      })
      .eq("id", messageId)
      .eq("organization_id", organizationId);
    return result;
  }

  const sentAt = new Date().toISOString();
  const { error: updateError } = await admin
    .from("messages")
    .update({
      send_status: "sent",
      send_error: null,
      email_provider_id: result.providerId,
      email_message_id: ourMessageId,
      email_in_reply_to: headers.inReplyTo,
    })
    .eq("id", messageId)
    .eq("organization_id", organizationId);

  if (updateError) {
    return { ok: false, error: "The email sent, but we couldn’t save the provider id. Retry to sync it.", retryable: true };
  }

  const chunkIds = await citationChunkIds(String(message.generation_id ?? ""));
  const sentBy = message.sender_user_id as string | null;
  if (sentBy) {
    const { error: auditError } = await admin.from("send_audits").insert({
      organization_id: organizationId,
      ticket_id: ticket.id,
      message_id: messageId,
      generation_id: message.generation_id,
      sent_by: sentBy,
      chunk_ids: chunkIds,
      provider_message_id: result.providerId,
      sent_at: sentAt,
    });
    if (auditError && !/duplicate|unique/i.test(auditError.message)) {
      console.error("send_audits insert failed", auditError.message);
    }
  }

  if (message.generation_id) {
    await admin
      .from("ai_generations")
      .update({
        edited_response: message.content,
        approved_at: sentAt,
        approved_by: sentBy,
        needs_human_review: false,
      })
      .eq("id", message.generation_id)
      .eq("organization_id", organizationId);
  }

  await admin
    .from("tickets")
    .update({ status: "pending" })
    .eq("id", ticket.id)
    .eq("organization_id", organizationId)
    .eq("status", "open");

  await recordUsage({
    organizationId,
    type: "email_out",
    metadata: { ticketId: ticket.id, messageId, providerId: result.providerId },
  });

  return result;
}

export async function markOutboundFailed(messageId: string, organizationId: string, error: string) {
  const admin = createAdminClient();
  await admin
    .from("messages")
    .update({ send_status: "failed", send_error: error })
    .eq("id", messageId)
    .eq("organization_id", organizationId);
}

async function citationChunkIds(generationId: string) {
  if (!generationId) return [] as string[];
  const admin = createAdminClient();
  const { data } = await admin.from("citations").select("chunk_id").eq("generation_id", generationId);
  return (data ?? []).map((row) => row.chunk_id as string);
}
