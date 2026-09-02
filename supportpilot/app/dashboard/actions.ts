"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/data";
import { queueTicketReply, retryOutboundMessage } from "@/lib/channels/email/queue-reply";
import { sendMessageSchema, updateTicketSchema } from "@/lib/validation/ticket";

export type ActionState = { error?: string; success?: string };

export async function sendReplyAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const generationRaw = String(formData.get("generationId") ?? "").trim();
  const parsed = sendMessageSchema.safeParse({
    ticketId: formData.get("ticketId"),
    content: formData.get("content"),
    isInternal: formData.get("isInternal") === "true" || formData.get("isInternal") === "on",
    generationId: generationRaw || undefined,
  });

  if (!parsed.success) {
    return { error: "Write a reply before sending." };
  }

  const result = await queueTicketReply({
    user,
    ticketId: parsed.data.ticketId,
    content: parsed.data.content,
    isInternal: parsed.data.isInternal ?? false,
    generationId: parsed.data.generationId,
  });

  revalidatePath(`/dashboard/tickets/${parsed.data.ticketId}`);
  revalidatePath("/dashboard/tickets");
  revalidatePath("/dashboard");
  return result;
}

export async function retryOutboundSendAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const messageId = String(formData.get("messageId") ?? "");
  const ticketId = String(formData.get("ticketId") ?? "");
  if (!messageId) return { error: "Missing reply." };

  const result = await retryOutboundMessage({ user, messageId });
  if (ticketId) {
    revalidatePath(`/dashboard/tickets/${ticketId}`);
    revalidatePath("/dashboard/tickets");
  }
  return result;
}

export async function updateTicketStatusAction(ticketId: string, status: "open" | "pending" | "resolved") {
  const user = await requireUser();
  const parsed = updateTicketSchema.safeParse({ status });
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase
    .from("tickets")
    .update({ status: parsed.data.status })
    .eq("id", ticketId)
    .eq("organization_id", user.organization_id);

  revalidatePath(`/dashboard/tickets/${ticketId}`);
  revalidatePath("/dashboard/tickets");
  revalidatePath("/dashboard");
}

export async function updateProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const orgName = String(formData.get("organizationName") ?? "").trim();

  if (fullName.length < 2) {
    return { error: "Name must be at least 2 characters." };
  }

  const supabase = await createClient();
  const { error: userError } = await supabase.from("users").update({ full_name: fullName }).eq("id", user.id);
  if (userError) return { error: userError.message };

  if (orgName.length >= 2 && (user.role === "admin" || user.role === "manager")) {
    const { error: orgError } = await supabase
      .from("organizations")
      .update({ name: orgName })
      .eq("id", user.organization_id);
    if (orgError) return { error: orgError.message };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { success: "Saved." };
}
