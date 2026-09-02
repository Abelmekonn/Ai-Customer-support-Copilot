"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/data";
import { canEditWorkspace, canManageMailbox } from "@/lib/auth/roles";
import { extractEmailAddress } from "@/lib/channels/email/parse";
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

export async function assignTicketAction(ticketId: string, assignedTo: string) {
  const user = await requireUser();
  const supabase = await createClient();
  const assigneeId = assignedTo.trim() === "" ? null : assignedTo;

  if (assigneeId) {
    const { data: teammate } = await supabase
      .from("users")
      .select("id")
      .eq("id", assigneeId)
      .eq("organization_id", user.organization_id)
      .maybeSingle();
    if (!teammate) return;
  }

  await supabase
    .from("tickets")
    .update({ assigned_to: assigneeId })
    .eq("id", ticketId)
    .eq("organization_id", user.organization_id);

  revalidatePath(`/dashboard/tickets/${ticketId}`);
  revalidatePath("/dashboard/tickets");
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

  const fromName = String(formData.get("fromName") ?? "").trim();
  const replyTo = String(formData.get("replyTo") ?? "").trim();
  const brandTone = String(formData.get("brandTone") ?? "").trim();

  if (fullName.length < 2) {
    return { error: "Name must be at least 2 characters." };
  }

  const supabase = await createClient();
  const { error: userError } = await supabase.from("users").update({ full_name: fullName }).eq("id", user.id);
  if (userError) return { error: userError.message };

  if (canEditWorkspace(user.role) && orgName.length >= 2) {
    const orgUpdate: Record<string, string | null> = { name: orgName };
    if (canManageMailbox(user.role)) {
      if (replyTo && !replyTo.includes("@")) {
        return { error: "Reply-To must be an email address." };
      }
      orgUpdate.from_name = fromName || null;
      orgUpdate.reply_to = replyTo ? extractEmailAddress(replyTo) : null;
      orgUpdate.brand_tone = brandTone.slice(0, 200) || null;
    }
    const { error: orgError } = await supabase
      .from("organizations")
      .update(orgUpdate)
      .eq("id", user.organization_id);
    if (orgError) return { error: orgError.message };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { success: "Saved." };
}
