import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppUser, Customer, KnowledgeDocument, Message, Organization, TicketWithCustomer } from "@/lib/types";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return profile as AppUser;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function getOrganization(organizationId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", organizationId)
    .single();

  return data as Organization | null;
}

export async function getDashboardStats(organizationId: string) {
  const supabase = await createClient();

  const [{ count: openCount }, { count: pendingCount }, { count: resolvedCount }, { count: assistedCount }, { count: customerCount }, { count: documentCount }] =
    await Promise.all([
      supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("status", "open"),
      supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("status", "pending"),
      supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("status", "resolved"),
      supabase
        .from("ai_generations")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organizationId),
      supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organizationId),
      supabase
        .from("knowledge_documents")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organizationId),
    ]);

  return {
    openTickets: openCount ?? 0,
    pendingTickets: pendingCount ?? 0,
    resolvedTickets: resolvedCount ?? 0,
    aiAssisted: assistedCount ?? 0,
    customers: customerCount ?? 0,
    documents: documentCount ?? 0,
  };
}

export async function listTickets(organizationId: string, status?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("tickets")
    .select("*, customer:customers!customer_id(id, name, email)")
    .eq("organization_id", organizationId)
    .order("last_message_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as TicketWithCustomer[];
}

export async function getTicket(organizationId: string, ticketId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tickets")
    .select("*, customer:customers!customer_id(id, name, email)")
    .eq("organization_id", organizationId)
    .eq("id", ticketId)
    .single();

  if (error) return null;
  return data as TicketWithCustomer;
}

export async function listMessages(ticketId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Message[];
}

export async function listCustomers(organizationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Customer[];
}

export async function listDocuments(organizationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("knowledge_documents")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as KnowledgeDocument[];
}

export async function listRecentTickets(organizationId: string, limit = 6) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tickets")
    .select("*, customer:customers!customer_id(id, name, email)")
    .eq("organization_id", organizationId)
    .order("last_message_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as TicketWithCustomer[];
}
