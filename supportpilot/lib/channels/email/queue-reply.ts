import { after } from "next/server";
import { inboundMailDomain } from "@/lib/channels/email/account";
import { newOutboundMessageId } from "@/lib/channels/email/headers";
import { enqueueSendEmail } from "@/lib/jobs/queue";
import { runPendingJobs } from "@/lib/jobs/run";
import { createClient } from "@/lib/supabase/server";
import type { AppUser } from "@/lib/types";

export type QueueReplyResult = { error?: string; success?: string };

export async function queueTicketReply(input: {
  user: AppUser;
  ticketId: string;
  content: string;
  isInternal: boolean;
  generationId?: string | null;
}): Promise<QueueReplyResult> {
  const content = input.content.trim();
  if (!content) {
    return { error: input.isInternal ? "Write a note before saving." : "Write a reply before sending." };
  }

  const supabase = await createClient();
  const { data: ticket } = await supabase
    .from("tickets")
    .select("id, organization_id")
    .eq("id", input.ticketId)
    .eq("organization_id", input.user.organization_id)
    .maybeSingle();

  if (!ticket) {
    return { error: "Ticket not found." };
  }

  let generationId = input.generationId?.trim() || null;
  if (generationId) {
    const { data: generation } = await supabase
      .from("ai_generations")
      .select("id")
      .eq("id", generationId)
      .eq("ticket_id", input.ticketId)
      .eq("organization_id", input.user.organization_id)
      .maybeSingle();
    if (!generation) generationId = null;
  }

  if (input.isInternal) {
    const { error } = await supabase.from("messages").insert({
      ticket_id: input.ticketId,
      organization_id: input.user.organization_id,
      sender_type: "agent",
      sender_user_id: input.user.id,
      content,
      is_internal: true,
      generation_id: generationId,
    });
    if (error) return { error: "Could not save the internal note. Try again." };
    return { success: "Internal note saved. The customer will not see this." };
  }

  const emailMessageId = newOutboundMessageId(inboundMailDomain());
  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      ticket_id: input.ticketId,
      organization_id: input.user.organization_id,
      sender_type: "agent",
      sender_user_id: input.user.id,
      content,
      is_internal: false,
      send_status: "queued",
      email_message_id: emailMessageId,
      generation_id: generationId,
    })
    .select("id")
    .single();

  if (error || !message) {
    return { error: "Could not queue the reply. Try again." };
  }

  if (generationId) {
    await supabase
      .from("ai_generations")
      .update({ edited_response: content })
      .eq("id", generationId)
      .eq("organization_id", input.user.organization_id);
  }

  await enqueueSendEmail(input.user.organization_id, { messageId: message.id });
  after(() => {
    void runPendingJobs();
  });

  return { success: "Sending the reply to the customer…" };
}

export async function retryOutboundMessage(input: {
  user: AppUser;
  messageId: string;
}): Promise<QueueReplyResult> {
  const supabase = await createClient();
  const { data: message } = await supabase
    .from("messages")
    .select("id, ticket_id, is_internal, send_status, email_provider_id")
    .eq("id", input.messageId)
    .eq("organization_id", input.user.organization_id)
    .maybeSingle();

  if (!message || message.is_internal) {
    return { error: "That reply can’t be retried." };
  }
  if (message.email_provider_id) {
    return { success: "This reply already left the building." };
  }

  await supabase
    .from("messages")
    .update({ send_status: "queued", send_error: null })
    .eq("id", message.id)
    .eq("organization_id", input.user.organization_id);

  await enqueueSendEmail(input.user.organization_id, { messageId: message.id });
  after(() => {
    void runPendingJobs();
  });

  return { success: "Retrying the reply…" };
}
