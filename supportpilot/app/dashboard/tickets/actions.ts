"use server";

import { seedCustomers, seedTickets } from "@/lib/demo/seed-data";
import { queueTicketReply } from "@/lib/channels/email/queue-reply";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sendMessageSchema, updateTicketSchema } from "@/lib/validation/ticket";

export async function seedDemoTickets() {
  const user = await requireUser();
  const supabase = await createClient();
  const orgId = user.organization_id;

  const { count } = await supabase
    .from("tickets")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId);

  if ((count ?? 0) > 0) {
    return { error: "This workspace already has tickets." };
  }

  const { data: customers, error: customerError } = await supabase
    .from("customers")
    .insert(
      seedCustomers.map((customer) => ({
        organization_id: orgId,
        name: customer.name,
        email: customer.email,
      })),
    )
    .select("id, email");

  if (customerError || !customers) {
    return { error: customerError?.message ?? "Could not create customers." };
  }

  const emailToId = new Map(customers.map((customer) => [customer.email, customer.id]));

  for (const ticket of seedTickets) {
    const customerId = emailToId.get(ticket.customerEmail);
    if (!customerId) continue;

    const createdAt = new Date(
      Date.now() - ticket.createdHoursAgo * 60 * 60 * 1000,
    ).toISOString();

    const { data: created, error: ticketError } = await supabase
      .from("tickets")
      .insert({
        organization_id: orgId,
        customer_id: customerId,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        created_at: createdAt,
        updated_at: createdAt,
        last_message_at: createdAt,
      })
      .select("id")
      .single();

    if (ticketError || !created) {
      return { error: ticketError?.message ?? "Could not create tickets." };
    }

    const { error: messageError } = await supabase.from("messages").insert(
      ticket.messages.map((message, index) => ({
        ticket_id: created.id,
        organization_id: orgId,
        sender_type: message.sender,
        sender_user_id: message.sender === "agent" ? user.id : null,
        content: message.content,
        created_at: new Date(
          new Date(createdAt).getTime() + index * 15 * 60 * 1000,
        ).toISOString(),
      })),
    );

    if (messageError) {
      return { error: messageError.message };
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tickets");
  revalidatePath("/dashboard/customers");
  return { ok: true };
}

export async function sendTicketMessage(formData: FormData) {
  const user = await requireUser();
  const parsed = sendMessageSchema.safeParse({
    ticketId: formData.get("ticketId"),
    content: formData.get("content"),
    isInternal: formData.get("isInternal") === "true" || formData.get("isInternal") === "on",
  });

  if (!parsed.success) {
    return { error: "Write a reply before sending." };
  }

  const result = await queueTicketReply({
    user,
    ticketId: parsed.data.ticketId,
    content: parsed.data.content,
    isInternal: parsed.data.isInternal ?? false,
  });

  revalidatePath(`/dashboard/tickets/${parsed.data.ticketId}`);
  revalidatePath("/dashboard/tickets");
  return result.error ? { error: result.error } : { ok: true };
}

export async function updateTicketStatus(formData: FormData) {
  const user = await requireUser();
  const ticketId = String(formData.get("ticketId") ?? "");
  const parsed = updateTicketSchema.safeParse({
    status: formData.get("status"),
  });

  if (!parsed.success || !ticketId) {
    return { error: "Invalid ticket update." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tickets")
    .update({ status: parsed.data.status })
    .eq("id", ticketId)
    .eq("organization_id", user.organization_id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/tickets/${ticketId}`);
  revalidatePath("/dashboard/tickets");
  revalidatePath("/dashboard");
  return { ok: true };
}
