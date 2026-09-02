import { NextResponse } from "next/server";
import { seedCustomers, seedTickets } from "@/lib/demo/seed-data";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single();
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 400 });
  }

  const organizationId = profile.organization_id as string;

  const { data: organization } = await supabase
    .from("organizations")
    .select("is_demo")
    .eq("id", organizationId)
    .single();

  if (organization && organization.is_demo === false) {
    return NextResponse.json(
      { error: "Sample tickets are only available in a demo workspace. Forward mail to your inbound address instead." },
      { status: 403 },
    );
  }

  const { count } = await supabase
    .from("tickets")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  if ((count ?? 0) > 0) {
    return NextResponse.json({ ok: true, seeded: false, message: "Tickets already exist." });
  }

  const customerIds = new Map<string, string>();

  for (const customer of seedCustomers) {
    const { data, error } = await supabase
      .from("customers")
      .insert({
        organization_id: organizationId,
        name: customer.name,
        email: customer.email,
      })
      .select("id, email")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    customerIds.set(data.email, data.id);
  }

  for (const ticket of seedTickets) {
    const customerId = customerIds.get(ticket.customerEmail);
    if (!customerId) continue;

    const createdAt = new Date(Date.now() - ticket.createdHoursAgo * 60 * 60 * 1000).toISOString();

    const { data: created, error } = await supabase
      .from("tickets")
      .insert({
        organization_id: organizationId,
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

    if (error || !created) {
      return NextResponse.json({ error: error?.message ?? "Failed to create ticket" }, { status: 500 });
    }

    for (const [index, message] of ticket.messages.entries()) {
      const messageAt = new Date(
        Date.now() - (ticket.createdHoursAgo * 60 - index * 20) * 60 * 1000,
      ).toISOString();

      const { error: messageError } = await supabase.from("messages").insert({
        ticket_id: created.id,
        organization_id: organizationId,
        sender_type: message.sender,
        sender_user_id: message.sender === "agent" ? user.id : null,
        content: message.content,
        created_at: messageAt,
      });

      if (messageError) {
        return NextResponse.json({ error: messageError.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ ok: true, seeded: true });
}
