"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/data";
import { sendMessageSchema, updateTicketSchema } from "@/lib/validation/ticket";

export type ActionState = { error?: string; success?: string };

export async function sendReplyAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = sendMessageSchema.safeParse({
    ticketId: formData.get("ticketId"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { error: "Write a reply before sending." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({
    ticket_id: parsed.data.ticketId,
    organization_id: user.organization_id,
    sender_type: "agent",
    sender_user_id: user.id,
    content: parsed.data.content,
  });

  if (error) {
    return { error: error.message };
  }

  await supabase
    .from("tickets")
    .update({ status: "pending" })
    .eq("id", parsed.data.ticketId)
    .eq("status", "open");

  revalidatePath(`/dashboard/tickets/${parsed.data.ticketId}`);
  revalidatePath("/dashboard/tickets");
  revalidatePath("/dashboard");
  return { success: "Reply sent." };
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
